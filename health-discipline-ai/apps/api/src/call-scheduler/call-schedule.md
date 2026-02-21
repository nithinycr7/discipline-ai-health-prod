# Call Scheduling System — Architecture Documentation

> Last updated: 2026-02-21

## Overview

The call scheduling system orchestrates daily AI voice calls to patients for medicine adherence tracking. It supports two execution modes controlled by the `USE_CLOUD_TASKS` env var:

| Mode | `USE_CLOUD_TASKS` | How calls trigger | Status |
|---|---|---|---|
| **Cloud Tasks** (primary) | `true` | Event-driven — one Cloud Task per patient per time slot | **Active** |
| **Cron** (fallback) | `false` | Polling — cron checks all patients every minute | Fallback |

**Key files:**
- `cloud-tasks/cloud-tasks.service.ts` — Cloud Tasks client wrapper
- `cloud-tasks/internal.controller.ts` — 4 internal HTTP endpoints
- `common/guards/internal-task.guard.ts` — Shared secret authentication
- `call-scheduler/call-scheduler.service.ts` — Cron fallback (4 cron jobs, disabled when Cloud Tasks active)
- `call-scheduler/call-orchestrator.service.ts` — Call initiation logic (shared by both modes)
- `call-scheduler/retry-handler.service.ts` — Retry scheduling (shared by both modes)
- `calls/calls.service.ts` — Database queries for the `calls` collection
- `integrations/elevenlabs/elevenlabs-webhook.controller.ts` — Post-call webhook handler

---

## Cloud Tasks Architecture (Primary)

### How It Works

```
                  Cloud Scheduler
                  (5:00 AM IST daily)
                        │
                        ▼
          POST /internal/enqueue-daily-calls
          (Loads all active call configs)
                        │
            ┌───────────┼──────────────┐
            ▼           ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Cloud Task   │ │ Cloud Task   │ │ Cloud Task   │
    │ Patient A    │ │ Patient B    │ │ Patient C    │
    │ at 20:30 IST │ │ at 08:30 IST │ │ at 21:00 IST │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           ▼                ▼                ▼
    POST /internal/trigger-call (at exact patient time)
           │
           ▼
    CallOrchestratorService.initiateCall()
           │
           ├──► Voice API (ElevenLabs or Sarvam)
           │
           ├──► Timeout task enqueued (T+10min)
           │
           ▼
    Patient's phone rings
           │
           ▼
    Post-call webhook arrives ──► transcript parsed ──► data extracted
           │
           ├── If no_answer ──► Retry task enqueued (T+delay)
           │                           │
           │                           ▼
           │                    POST /internal/trigger-call (isRetry=true)
           │
           └── If completed ──► Report sent to caregiver
```

### Components

#### 1. Cloud Scheduler (GCP managed cron)

Two scheduled jobs trigger HTTP endpoints on the API:

| Job | Schedule | Endpoint | Purpose |
|---|---|---|---|
| `enqueue-daily-calls` | `30 23 * * *` UTC (5:00 AM IST) | `/internal/enqueue-daily-calls` | Enqueue all patient calls for the day |
| `check-paused-patients` | `*/30 * * * *` UTC (every 30 min) | `/internal/check-paused-patients` | Resume patients with expired pauses |

Both jobs send `X-CloudTasks-Secret` header for authentication.

#### 2. Cloud Tasks Queue (`daily-calls`)

A single queue holds all tasks. Configuration:

| Setting | Value | Why |
|---|---|---|
| Max dispatches/sec | 10 | Prevents overwhelming Twilio/ElevenLabs |
| Max concurrent dispatches | 50 | Matches the old batch size limit |
| Max attempts | 3 | Auto-retry on 5xx errors |
| Min backoff | 10s | Wait between retries |
| Max backoff | 300s | Cap retry delay at 5 minutes |

#### 3. Task ID Dedup

Every task has a deterministic ID that prevents duplicates:

| Task Type | Task ID Pattern | Example |
|---|---|---|
| Daily call | `call-{date}-{patientId}-{timing}` | `call-2026-02-21-67a1b2c3d4-night` |
| Timeout | `timeout-{callId}` | `timeout-67a1b2c3d4e5f6` |
| Retry | `retry-{callId}-{retryCount}` | `retry-67a1b2c3d4e5f6-1` |

Cloud Tasks rejects duplicate task IDs with `ALREADY_EXISTS` (gRPC code 6). This replaces distributed locks for dedup.

#### 4. Internal Controller (`/api/v1/internal/*`)

Four endpoints, all protected by `InternalTaskGuard` (shared secret auth):

##### `POST /internal/enqueue-daily-calls`

Triggered once daily by Cloud Scheduler. Enqueues individual tasks for each patient.

```
Flow:
  1. Kill switch check → abort if DISABLE_ALL_CALLS=true
  2. Load all active call configs
  3. For each config:
     a. Load patient → skip if isPaused or phoneStatus=invalid
     b. For each time slot (morning/afternoon/evening/night):
        - Parse HH:MM → compute exact schedule time in patient's timezone
        - Skip if time already passed today
        - Enqueue Cloud Task with date-based task ID (dedup)
  4. Return { tasksEnqueued, tasksSkipped, configsScanned }
```

##### `POST /internal/trigger-call`

Triggered by Cloud Task at the patient's exact call time. Handles both new and retry calls.

Body: `{ patientId, timing?, callId?, isRetry? }`

```
NEW CALL PATH (isRetry=false):
  1. Kill switch check
  2. Load patient → check isPaused, phoneStatus
  3. Load call config → check isActive
  4. hasCallToday() safety check
  5. CallOrchestratorService.initiateCall()
     - Creates call record
     - Calls voice API
     - Enqueues timeout task at T+10min

RETRY CALL PATH (isRetry=true, callId set):
  1. Kill switch check
  2. Load patient → check isPaused
  3. claimForProcessing(callId, 'scheduled') → atomic claim
  4. Load medicines
  5. CallOrchestratorService.initiateRetryCall()
```

##### `POST /internal/call-timeout`

Triggered 10 minutes after a call starts. Replaces the `cleanupStaleCalls` cron.

Body: `{ callId }`

```
Flow:
  1. Load call → if NOT in_progress, return (webhook already handled)
  2. markStaleAsNoAnswer() → atomic update
  3. Check hasCompletedCallToday() → skip retry if patient already had a good call
  4. retryHandler.handleNoAnswer(callId) → enqueues retry Cloud Task
```

##### `POST /internal/check-paused-patients`

Triggered every 30 minutes by Cloud Scheduler.

```
Flow:
  1. Find patients where isPaused=true AND pausedUntil <= now
  2. Resume each patient
  3. Return { resumedCount }
```

#### 5. CloudTasksService

Injectable NestJS service wrapping `@google-cloud/tasks`. Reads env vars:

| Env Var | Purpose |
|---|---|
| `GCP_PROJECT_ID` | GCP project ID |
| `CLOUD_TASKS_LOCATION` | Queue region (us-central1) |
| `CLOUD_TASKS_QUEUE` | Queue name (daily-calls) |
| `CLOUD_TASKS_INTERNAL_SECRET` | Shared secret for endpoint auth |
| `API_BASE_URL` | Target URL for tasks |

Methods:
- `enqueueTask({ url, payload, scheduleTime?, taskId? })` — Core method
- `enqueueCallTask(patientId, timing, scheduleTime, dateKey)` — Patient call
- `enqueueTimeoutTask(callId, scheduleTime)` — Stale call detection
- `enqueueRetryTask(patientId, callId, retryCount, scheduleTime)` — Retry call

#### 6. InternalTaskGuard

NestJS guard that verifies the `X-CloudTasks-Secret` header matches `CLOUD_TASKS_INTERNAL_SECRET`. Rejects with 403 if:
- No secret configured on the server (safe default)
- Header doesn't match

---

## Call Lifecycle

A call goes through these statuses:

```
scheduled → in_progress → completed
                        → no_answer   → (retry task enqueued)
                        → failed      → (retry task enqueued)
                        → busy        → (retry task enqueued)
                        → declined
```

### Status Definitions

| Status | Meaning |
|---|---|
| `scheduled` | Call record created, waiting to be initiated |
| `in_progress` | Call initiated via voice API, waiting for completion webhook |
| `completed` | Call finished successfully, transcript parsed, data extracted |
| `no_answer` | Patient didn't answer (< 30s duration or voicemail detected) |
| `failed` | Technical failure (SIP error, API error) |
| `busy` | Twilio returned busy signal |
| `declined` | Patient explicitly declined |

---

## Retry System

### How Retries Work with Cloud Tasks

When a call ends with `no_answer`, `busy`, `failed`, or `re_scheduled`:

```
Post-call webhook ──► RetryHandlerService.handleNoAnswer/Busy/Failed()
       │
       ▼
scheduleRetry(callId, reason):
  1. Load call config → check retryEnabled, retryOnlyForStatuses
  2. Check hasPendingRetry() → skip if one already exists
  3. Check retryCount >= maxRetries → send missed call alert if exceeded
  4. Create new call record (status=scheduled, isRetry=true, scheduledAt=T+delay)
  5. Enqueue Cloud Task: retry-{callId}-{retryCount} at scheduledAt
       │
       ▼
Cloud Task fires at scheduledAt ──► POST /internal/trigger-call (isRetry=true)
       │
       ▼
claimForProcessing() → initiateRetryCall() → patient's phone rings again
```

### Retry Delays

| Scenario | Default Delay | Description |
|---|---|---|
| `no_answer` | 30 min | Patient didn't pick up |
| `re_scheduled` | 60 min | Patient said "call me later" |
| `busy` | 15 min | Twilio busy signal |
| `failed` | 10 min | Technical error |

Configurable per-patient via `config.retryIntervalMinutes` (overrides defaults).

### Max Retries

Default: 2 retries (configurable per-patient via `config.maxRetries`). After max retries:
- Missed call alert sent to the payer (caregiver)
- All pending medicines marked as `missed`

---

## Post-Call Webhook (ElevenLabs)

When a call completes, ElevenLabs sends a POST webhook to `/webhooks/elevenlabs/post-call`.

### Processing Flow

```
handlePostCall(body):
  1. Extract conversationId and callId from dynamic variables
  2. Idempotency check: skip if call.status is already 'completed' or 'no_answer'
  3. Build transcript text from message array
  4. Parse transcript via Gemini (TranscriptParserService):
     - Medicine responses (taken/missed/pending)
     - Vitals (glucose, BP)
     - Wellness/mood notes, complaints
     - reScheduled / skipToday flags
     - Screening question answers
  5. Calculate costs (Twilio + ElevenLabs)
  6. Determine no_answer:
     - All medicines still 'pending' AND
     - Not reScheduled AND not skipToday AND
     - (duration < 30s OR terminationReason matches no_answer/voicemail)
  7. If no_answer:
     - Update call status → 'no_answer'
     - retryHandler.handleNoAnswer() → enqueues retry Cloud Task
  8. If completed:
     - Save extracted data, costs, transcript
     - Track adherence streak
     - Send post-call report notification
     - If skipToday → pause patient until end of day
     - If reScheduled → retryHandler.handleReScheduled()
```

---

## Safety Mechanisms

### Cloud Tasks Mode (3 layers)

| Layer | Mechanism | Where | Prevents |
|---|---|---|---|
| 1 | Task ID dedup | Cloud Tasks queue | Duplicate tasks for same patient/date/timing |
| 2 | `hasCallToday()` | trigger-call endpoint | Extra calls if task fires after a call already happened |
| 3 | Webhook idempotency | Post-call webhook | Double-processing of webhook data |

Plus these additional guards:
- **Kill switch** (`DISABLE_ALL_CALLS`) — checked in every internal endpoint
- **`hasPendingRetry()`** — prevents duplicate retry records in DB
- **`claimForProcessing()`** — atomic claim for retry calls
- **`hasCompletedCallToday()`** — prevents retry after a successful call

### Kill Switch

**Env var:** `DISABLE_ALL_CALLS=true`

Checked at the top of every internal endpoint and every cron job. When active, no outbound calls are initiated.

```bash
# Emergency stop
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "DISABLE_ALL_CALLS=true"

# Resume
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "DISABLE_ALL_CALLS=false"
```

### Patient-Level Guards

| Guard | Effect |
|---|---|
| `patient.isPaused` | Skipped by enqueue + trigger-call |
| `patient.phoneStatus === 'invalid'` | Skipped by enqueue + trigger-call |
| `config.retryEnabled === false` | No retries scheduled |
| `config.retryOnlyForStatuses` | Only specified reasons trigger retries |
| `config.isActive === false` | Not returned by `getActiveConfigs()` |

---

## Timing Configuration

Each patient has a `CallConfig` document with up to 4 time slots:

```json
{
  "patientId": "...",
  "timezone": "Asia/Kolkata",
  "isActive": true,
  "morningCallTime": "08:30",
  "afternoonCallTime": null,
  "eveningCallTime": "19:30",
  "nightCallTime": "20:30",
  "retryEnabled": true,
  "maxRetries": 2,
  "retryIntervalMinutes": null,
  "retryOnlyForStatuses": ["no_answer", "busy"]
}
```

**Timezone handling:** Cloud Scheduler fires at 5:00 AM IST. The `enqueue-daily-calls` handler computes each task's exact fire time in the patient's timezone using Luxon.

**One call per day:** `hasCallToday()` prevents more than one primary call per day (retries are allowed). Based on `scheduledAt` date in patient's timezone.

---

## Voice Stack Routing

Two voice stacks, selected via `VOICE_STACK` env var:

| Stack | Components | Default |
|---|---|---|
| `elevenlabs` | ElevenLabs Conversational AI → Twilio SIP → Patient phone | Yes |
| `sarvam` | LiveKit + Sarvam STT/TTS + Gemini → Twilio SIP → Patient phone | No |

Both stacks use the same call record schema, retry system, and webhook flow.

---

## Cost Tracking

Each completed call records:
- `twilioCharges`: ₹3.56/min (US→India mobile outbound)
- `elevenlabsCharges`: ₹17.42 per 1000 ElevenLabs credits
- `totalCharges`: sum of above

---

## End-to-End Flow Example

Here's what happens for a patient with `nightCallTime: "20:30"` in `Asia/Kolkata`:

```
23:30 UTC (5:00 AM IST):
  Cloud Scheduler → POST /internal/enqueue-daily-calls
  → Reads all active call configs
  → Patient has nightCallTime=20:30, timezone=Asia/Kolkata
  → Enqueues Cloud Task: ID=call-2026-02-21-{patientId}-night
    scheduled for 20:30 IST (15:00 UTC)

15:00 UTC (20:30 IST):
  Cloud Tasks → POST /internal/trigger-call { patientId, timing: "night" }
  → Checks: isPaused? hasCallToday? isActive?
  → Creates call record (status=scheduled)
  → Calls ElevenLabs/Sarvam → patient's phone rings
  → Updates call to in_progress
  → Enqueues timeout task: ID=timeout-{callId}, fires at 15:10 UTC

Case A — Patient answers (within 10 min):
  15:05 UTC: Post-call webhook arrives
  → Transcript parsed by Gemini
  → Medicine responses extracted
  → Call marked as completed
  → Post-call report sent to caregiver
  15:10 UTC: Timeout task fires
  → Finds call status=completed → no-op

Case B — Patient doesn't answer:
  15:03 UTC: Webhook arrives with no_answer indicators
  → Call marked as no_answer
  → retryHandler.handleNoAnswer(callId)
    → Creates retry record (scheduledAt = 15:33 UTC = T+30min)
    → Enqueues retry task: ID=retry-{retryCallId}-1
  15:33 UTC: Retry task fires
  → POST /internal/trigger-call { patientId, callId, isRetry: true }
  → claimForProcessing() → success
  → Patient's phone rings again (retry #1)

Case C — No webhook at all (technical failure):
  15:10 UTC: Timeout task fires
  → Call still in_progress
  → markStaleAsNoAnswer() → atomic update
  → hasCompletedCallToday() → false
  → retryHandler.handleNoAnswer(callId)
  → Retry task enqueued
```

---

## Cron Fallback (USE_CLOUD_TASKS=false)

When `USE_CLOUD_TASKS=false`, the system falls back to 4 cron jobs in `CallSchedulerService`:

| Cron | Schedule | Purpose |
|---|---|---|
| `processScheduledCalls` | Every 1 min | Poll all configs, find due calls, initiate |
| `processRetries` | Every 30 min | Find due retry records, process them |
| `cleanupStaleCalls` | Every 2 min | Find calls stuck in_progress >10min |
| `checkPausedPatients` | Every 30 min | Resume patients with expired pauses |

Each cron is protected by a distributed lock (MongoDB-based) to prevent duplicate execution across Cloud Run instances. This mode requires 6 distributed locks and 7 dedup layers.

**To switch back:**
```bash
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "USE_CLOUD_TASKS=false"
```

Cloud Scheduler jobs should also be paused when using cron fallback:
```bash
gcloud scheduler jobs pause enqueue-daily-calls --location=us-central1
gcloud scheduler jobs pause check-paused-patients --location=us-central1
```

---

## Monitoring & Debugging

```bash
# View Cloud Tasks queue status
gcloud tasks queues describe daily-calls --location=us-central1

# List pending tasks in queue
gcloud tasks list --queue=daily-calls --location=us-central1

# View Cloud Scheduler job status
gcloud scheduler jobs describe enqueue-daily-calls --location=us-central1

# Manually trigger the daily enqueue (testing)
gcloud scheduler jobs run enqueue-daily-calls --location=us-central1

# View API logs
gcloud run services logs read discipline-ai-api --region us-central1 --limit 100

# Check current env var values
gcloud run services describe discipline-ai-api --region us-central1 --format="yaml(spec.template.spec.containers[0].env)"
```

---

## Incident History: Retry Cascade (2026-02-21)

### What happened
Stale test calls created multiple retry records. `processRetries` cron fired ALL retries at once → calls went to patients across multiple accounts.

### Root cause
1. No per-patient dedup in `processRetries()` batch
2. No `hasPendingRetry()` check before creating retries
3. No `hasCompletedCallToday()` in stale cleanup

### Resolution
Migrated from cron-based polling to Cloud Tasks event-driven architecture. Cloud Tasks provides natural dedup through task IDs and eliminates the need for distributed locks and multi-layer dedup.
