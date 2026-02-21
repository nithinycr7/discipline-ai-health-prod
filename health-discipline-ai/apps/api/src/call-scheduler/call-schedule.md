# Call Scheduling System — Detailed Architecture

> Last updated: 2026-02-21

## Overview

The call scheduling system orchestrates daily AI voice calls to patients for medicine adherence tracking. It runs as a set of cron jobs inside the NestJS API server deployed on Google Cloud Run.

**Key files:**
- `call-scheduler.service.ts` — Cron job orchestrator (4 cron jobs)
- `call-orchestrator.service.ts` — Call initiation logic (new calls + retries)
- `retry-handler.service.ts` — Retry scheduling and execution
- `calls.service.ts` — Database queries for the `calls` collection
- `distributed-lock.service.ts` — MongoDB-based distributed locking
- `elevenlabs-webhook.controller.ts` — Post-call webhook handler

---

## Call Lifecycle

A call goes through these statuses:

```
scheduled → in_progress → completed
                        → no_answer   → (retry scheduled)
                        → failed      → (retry scheduled)
                        → busy        → (retry scheduled)
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

## Cron Jobs

Four cron jobs run on the API server. Each is protected by a **distributed lock** to prevent duplicate execution across Cloud Run instances.

### 1. `processScheduledCalls` — Every Minute

**Purpose:** Check all active call configs, find patients whose scheduled call time is NOW (±5 min catch-up window), and initiate calls.

**Flow:**
```
Every minute:
  1. Kill switch check → abort if DISABLE_ALL_CALLS=true
  2. Acquire lock: cron:processScheduledCalls (TTL: 120s)
  3. Fetch all active call configs (isActive: true)
  4. For each config, convert current UTC time → patient's timezone
  5. Check 4 time slots: morningCallTime, afternoonCallTime, eveningCallTime, nightCallTime
  6. For each slot, if currentTime is within [slotTime, slotTime + 5min]:
     a. Fetch patient record
     b. Skip if patient.isPaused
     c. Skip if patient.phoneStatus === 'invalid'
     d. Skip if hasCallToday() returns true (dedup)
     e. Add to dueCalls batch
  7. Send dueCalls to CallOrchestratorService.processBatch()
  8. Release lock
```

**Catch-up window:** If the cron tick fires 1-5 minutes late (Cloud Run cold start, etc.), the call is still processed. Beyond 5 minutes, it's skipped.

**Dedup check:** `hasCallToday()` looks for ANY non-retry call for this patient today (in patient's timezone). This prevents double-calling if the cron fires twice within the catch-up window.

### 2. `processRetries` — Every 30 Minutes

**Purpose:** Find retry calls that are past their `scheduledAt` time and initiate them.

**Flow:**
```
Every 30 minutes (at :00 and :30):
  1. Kill switch check
  2. Acquire lock: cron:processRetries (TTL: 600s)
  3. Fetch all due retries: status=scheduled, isRetry=true, scheduledAt <= now
  4. Per-patient dedup: only ONE retry per patient per batch (Set<patientId>)
     - Extra retries for same patient → marked as 'failed' (cancelled)
  5. For each retry:
     a. Atomic claim: claimForProcessing(id, 'scheduled') → sets status to 'in_progress'
     b. Skip if claim fails (another instance already claimed it)
     c. Skip if patient.isPaused
     d. Fetch medicines, call config
     e. Initiate via CallOrchestratorService.initiateRetryCall()
  6. Release lock
```

### 3. `cleanupStaleCalls` — Every 2 Minutes

**Purpose:** Find calls stuck in `in_progress` for >10 minutes (webhook never arrived) and mark them as `no_answer`.

**Flow:**
```
Every 2 minutes:
  1. Kill switch check
  2. Acquire lock: cron:cleanupStaleCalls (TTL: 240s)
  3. Find calls: status=in_progress, initiatedAt <= 10 minutes ago
  4. For each stale call:
     a. Atomically mark as no_answer (only if still in_progress) via markStaleAsNoAnswer()
     b. If update returns null → webhook arrived between find and update, skip
     c. Check if patient already has a completed call today via hasCompletedCallToday()
        - If yes → skip retry (prevents stale test calls from creating retry cascades)
     d. Schedule retry via retryHandler.handleNoAnswer()
  5. Release lock
```

**Atomic update:** `markStaleAsNoAnswer()` uses `findOneAndUpdate({ status: 'in_progress' })` — if the webhook arrived and changed the status to `completed` between the find and update, the update returns null and we skip.

### 4. `checkPausedPatients` — Every 30 Minutes

**Purpose:** Auto-resume patients whose `pausedUntil` timestamp has expired (e.g., skip_today pauses).

**Flow:**
```
Every 30 minutes:
  1. Acquire lock: cron:checkPausedPatients (TTL: 600s)
  2. Find patients: isPaused=true, pausedUntil <= now
  3. Resume each patient
  4. Release lock
```

**Note:** This cron does NOT check the kill switch — it's safe to run even when calls are disabled, since it only resumes patients without initiating calls.

---

## Call Initiation

### New Calls (CallOrchestratorService.initiateCall)

When the scheduler identifies a due call, the orchestrator handles initiation:

```
initiateCall(dueCall):
  1. Acquire per-patient lock: call:{patientId} (TTL: 60s)
     - If locked → another call is being initiated for this patient, skip
  2. Re-check hasCallToday() INSIDE the lock (double-check pattern)
     - Prevents race where two cron ticks both pass the scheduler's dedup check
  3. Fetch patient's medicines
     - If no medicines → skip
  4. Create call record (status: 'scheduled')
     - Records: patientId, userId, scheduledAt, isFirstCall, voiceStack, medicinesChecked[]
  5. Assemble dynamic prompt (if DYNAMIC_PROMPT_ENABLED=true)
     - Per-patient opt-out: config.dynamicPromptEnabled !== false
  6. Route to voice stack:
     - VOICE_STACK=elevenlabs → ElevenLabsAgentService.makeOutboundCall()
     - VOICE_STACK=sarvam → SarvamAgentService.makeOutboundCall()
  7. Update call status → 'in_progress' with conversationId/roomName
  8. On error:
     - Mark call as 'failed'
     - Schedule retry via retryHandler.handleFailed()
  9. Release per-patient lock (in finally block)
```

### Retry Calls (CallOrchestratorService.initiateRetryCall)

When processRetries triggers a retry, the orchestrator re-initiates the call using the existing call record:

```
initiateRetryCall(call, patient, config, medicines):
  1. Build patientData from patient + medicines
  2. Assemble dynamic prompt (if enabled)
  3. Route to voice stack (same as new calls)
  4. Update call status → 'in_progress' with conversationId
  5. On error → throw (caller handles failure)
```

### Batching

Calls are processed in batches of `MAX_CONCURRENT = 50` using `Promise.allSettled()`. This ensures one failing call doesn't block others.

---

## Retry System

### Retry Delays

| Scenario | Default Delay | Description |
|---|---|---|
| `no_answer` | 30 min | Patient didn't pick up |
| `re_scheduled` | 60 min | Patient said "call me later" |
| `busy` | 15 min | Twilio busy signal |
| `failed` | 10 min | Technical error |

Configurable per-patient via `config.retryIntervalMinutes` (overrides defaults).

### Retry Scheduling Flow

```
scheduleRetry(callId, reason):
  1. Fetch call record and call config
  2. Check config.retryEnabled → skip if false
  3. Check config.retryOnlyForStatuses → skip if reason not in allowed list
     - Default allowed: ['no_answer', 'busy']
  4. Acquire per-patient lock: retry:{patientId} (TTL: 30s)
  5. Check hasPendingRetry() → skip if patient already has a scheduled/in_progress retry
  6. Check retryCount >= maxRetries → if exceeded:
     a. Send missed call alert notification
     b. Mark all pending medicines as 'missed'
     c. Return (no more retries)
  7. Create new call record:
     - status: 'scheduled'
     - scheduledAt: now + delayMinutes
     - isRetry: true
     - retryCount: originalCall.retryCount + 1
     - originalCallId: points back to first call
     - medicinesChecked: reset all responses to 'pending'
  8. Release per-patient lock
```

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
  1. Unwrap envelope if present (body.data vs body)
  2. Extract conversationId and callId from dynamic variables
  3. Idempotency check: skip if call.status is already 'completed' or 'no_answer'
  4. Build transcript text from message array
  5. Parse transcript via Gemini (TranscriptParserService):
     - Medicine responses (taken/missed/pending)
     - Vitals (glucose, BP)
     - Wellness/mood notes
     - Complaints
     - reScheduled flag (patient said "call me later")
     - skipToday flag (patient doesn't want more calls today)
     - Screening question answers
  6. Calculate costs:
     - Twilio: ₹3.56/min (US→India mobile)
     - ElevenLabs: ₹17.42 per 1000 credits
  7. Determine no_answer:
     - All medicines still 'pending' AND
     - Not reScheduled AND not skipToday AND
     - (duration < 30s OR terminationReason matches no_answer/voicemail pattern)
  8. If no_answer:
     - Update call status → 'no_answer'
     - Schedule retry
     - Return early
  9. If completed:
     - Update call with all extracted data, costs, transcript
     - Track first call + increment patient.callsCompletedCount
     - Update adherence streak
     - Send post-call report notification to payer
     - If skipToday → pause patient until end of today IST
     - If reScheduled → schedule retry
```

---

## Safety Mechanisms

### 1. Kill Switch

**Env var:** `DISABLE_ALL_CALLS=true`

Checked at the top of every cron job (`processScheduledCalls`, `processRetries`, `cleanupStaleCalls`) and the test-call endpoint. When active, no outbound calls are initiated.

**How to toggle:**
```bash
# Disable all calls
gcloud run services update discipline-ai-api --set-env-vars DISABLE_ALL_CALLS=true --region us-central1

# Re-enable calls
gcloud run services update discipline-ai-api --remove-env-vars DISABLE_ALL_CALLS --region us-central1
```

### 2. Distributed Locks

MongoDB-based distributed locking prevents duplicate cron execution across Cloud Run instances.

**How it works:**
- `cronlocks` collection with unique `lockKey` index
- `findOneAndUpdate` with `upsert: true` — atomic acquire
- TTL index on `expiresAt` — auto-cleanup of expired locks
- Each Cloud Run instance has a unique `instanceId` (random 8 bytes)
- Lock is only acquired if no lock exists OR existing lock has expired

**Lock TTLs:**

| Lock Key | TTL | Purpose |
|---|---|---|
| `cron:processScheduledCalls` | 120s | Scheduler processing all patients |
| `cron:processRetries` | 600s | Retry batch processing |
| `cron:cleanupStaleCalls` | 240s | Stale call cleanup |
| `cron:checkPausedPatients` | 600s | Paused patient auto-resume |
| `call:{patientId}` | 60s | Per-patient call initiation |
| `retry:{patientId}` | 30s | Per-patient retry creation |

### 3. Multi-Layer Dedup (Prevents Duplicate Calls)

**Layer 1 — Scheduler dedup:** `hasCallToday()` in the scheduler cron skips patients who already have a call record today.

**Layer 2 — Orchestrator double-check:** Inside the per-patient lock, `hasCallToday()` is re-checked before creating the call record. Prevents race condition where two cron ticks both pass Layer 1.

**Layer 3 — Retry dedup (hasPendingRetry):** Before creating a retry call, checks if a `scheduled` or `in_progress` retry already exists for this patient. Prevents duplicate retries from concurrent stale cleanup runs.

**Layer 4 — Retry batch dedup (processedPatients Set):** During `processRetries()`, a Set tracks which patients have already been processed in this batch. Extra retries for the same patient are cancelled as `failed`.

**Layer 5 — Atomic claim (claimForProcessing):** `findOneAndUpdate({ status: 'scheduled' })` atomically transitions the retry to `in_progress`. If two processes try to claim the same retry, only one succeeds.

**Layer 6 — Webhook idempotency:** The post-call webhook checks `call.status` — if already `completed` or `no_answer`, the webhook is acknowledged but not re-processed.

**Layer 7 — Stale cleanup guard:** Before creating a retry from a stale call, `hasCompletedCallToday()` checks if the patient already had a successful call today. Prevents stale test calls from triggering unwanted retry cascades.

### 4. Patient-Level Guards

| Guard | Effect |
|---|---|
| `patient.isPaused` | Skipped by scheduler, skipped by retry processing |
| `patient.phoneStatus === 'invalid'` | Skipped by scheduler |
| `config.retryEnabled === false` | No retries scheduled |
| `config.retryOnlyForStatuses` | Only specified reasons trigger retries |
| `config.isActive === false` | Config not returned by `getActiveConfigs()` |

### 5. Test-Call Endpoint Safety

The `/api/v1/elevenlabs/test-call` endpoint also enforces:
- Kill switch check (`DISABLE_ALL_CALLS`)
- Patient pause check (`patient.isPaused`)

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

**Timezone handling:** All time comparisons happen in the patient's timezone. The scheduler converts UTC → patient timezone using Luxon before comparing against slot times.

**One call per day:** Currently, `hasCallToday()` prevents more than one primary call per day (retries are allowed). The check is based on `scheduledAt` date in the patient's timezone.

---

## Voice Stack Routing

The system supports two voice stacks, selected via `VOICE_STACK` env var:

| Stack | Components | Default |
|---|---|---|
| `elevenlabs` | ElevenLabs Conversational AI → Twilio SIP → Patient phone | Yes |
| `sarvam` | LiveKit + Sarvam STT/TTS + Gemini → Twilio SIP → Patient phone | No |

Both stacks use the same call record schema and webhook flow. The only difference is how the call is initiated and which `conversationId` field is used.

---

## Cost Tracking

Each completed call records:
- `twilioCharges`: ₹3.56/min (US→India mobile outbound)
- `elevenlabsCharges`: ₹17.42 per 1000 ElevenLabs credits
- `totalCharges`: sum of above

Daily cost aggregation available via `CallsService.getDailyCostAggregation()`.

---

## Data Flow Diagram

```
                    ┌──────────────────────────────────┐
                    │   CallSchedulerService (Cron)     │
                    │                                    │
                    │  processScheduledCalls (1 min)     │
                    │  processRetries (30 min)           │
                    │  cleanupStaleCalls (2 min)         │
                    │  checkPausedPatients (30 min)      │
                    └────────────┬───────────────────────┘
                                 │
                    ┌────────────▼───────────────────────┐
                    │   CallOrchestratorService           │
                    │                                     │
                    │  initiateCall() ─── per-patient lock│
                    │  initiateRetryCall()                │
                    │  processBatch() ─── max 50 parallel │
                    └──────┬────────────────┬─────────────┘
                           │                │
              ┌────────────▼──┐    ┌────────▼──────────┐
              │ ElevenLabs    │    │  Sarvam/LiveKit    │
              │ Agent Service │    │  Agent Service     │
              └────────┬──────┘    └────────┬───────────┘
                       │                    │
                       │   Twilio SIP       │
                       │  ◄─────────────────┘
                       ▼
              ┌────────────────┐
              │ Patient Phone  │
              └────────┬───────┘
                       │ Call ends
                       ▼
              ┌────────────────────────────────────┐
              │  ElevenLabs Webhook Controller      │
              │  POST /webhooks/elevenlabs/post-call│
              │                                     │
              │  → TranscriptParser (Gemini)        │
              │  → Medicine extraction              │
              │  → Vitals / wellness / complaints   │
              │  → Cost calculation                 │
              │  → no_answer detection              │
              │  → Retry scheduling                 │
              │  → Post-call notification           │
              └────────────────────────────────────┘
                       │
              ┌────────▼───────────────────────────┐
              │  RetryHandlerService                │
              │                                     │
              │  scheduleRetry() ── per-patient lock│
              │  processRetries() ── batch dedup    │
              │  hasPendingRetry() ── atomic check  │
              └─────────────────────────────────────┘
```

---

## Incident: Retry Cascade (2026-02-21)

### What happened
A test call left the call in `in_progress` status. The stale cleanup cron marked it as `no_answer` and created a retry. Multiple stale calls accumulated → each created its own retry → `processRetries` fired ALL retries within seconds → calls went to ALL patients across ALL user accounts.

### Root cause
1. No per-patient dedup in `processRetries()` — all retries fired in parallel
2. No `hasPendingRetry()` check — multiple retries created for same patient
3. No `hasCompletedCallToday()` check in stale cleanup — retries created even after successful call

### Fixes applied
1. **Kill switch** (`DISABLE_ALL_CALLS`) — emergency stop for all outbound calls
2. **`hasPendingRetry()`** — prevents duplicate retry creation
3. **Per-patient distributed lock** on `scheduleRetry()` — atomic check-and-create
4. **`processedPatients` Set** — only one retry per patient per batch
5. **Per-patient lock on `initiateCall()`** — with `hasCallToday()` re-check inside lock
6. **`hasCompletedCallToday()`** in stale cleanup — skips retry if patient already had a successful call
7. **Test-call endpoint** — now checks kill switch and patient pause status
8. **Extended lock TTLs** — prevents lock expiration during long processing runs
