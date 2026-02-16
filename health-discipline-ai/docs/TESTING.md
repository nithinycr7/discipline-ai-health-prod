# Testing Guide

## Test User & Patient

### Payer (User)
| Field | Value |
|-------|-------|
| Name | Nithin Yakateela |
| Phone | `9902352425` |
| Role | `payer` |
| Location | Vijayawada, Andhra Pradesh |
| Timezone | `Asia/Calcutta` |
| User ID | `699169d7647a1e6b948fd177` |

### Patient — Gopi
| Field | Value |
|-------|-------|
| Full Name | Gopala rao |
| Preferred Name | gopi |
| Age | 55 |
| Phone | `+919902352425` |
| Language | `hi` (Hindi) |
| Digital Tier | 1 (feature phone) |
| Conditions | diabetes |
| Glucometer | No |
| BP Monitor | No |
| Voice Gender | female |
| Patient ID | `699169ff647a1e6b948fd181` |

### Medicines
| Brand Name | Dosage | Timing | Nickname | Food | Medicine ID |
|-----------|--------|--------|----------|------|-------------|
| Hp1 | 10mg | morning | — | after | `69916a29647a1e6b948fd18f` |
| Amlodipine | 5mg | evening | BP tablet | after | `6992d0afa9be540d233d4b1e` |

---

## API Base URLs

| Environment | URL |
|------------|-----|
| Production | `https://discipline-ai-api-337728476024.us-central1.run.app` |
| Local Dev | `http://localhost:3001` |
| API Prefix | `/api/v1` |

---

## Quick Test Commands

### 1. Health Check (no auth)
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/health
```

### 2. ElevenLabs Status (no auth)
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/admin/elevenlabs/status
```

### 3. Login (get JWT token)
```bash
curl -X POST https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "9902352425"}'
```
Response includes `token` and `refreshToken`. Use the `token` as Bearer token for authenticated endpoints.

### 4. List Patients (auth required)
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/patients \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Get Gopi's Details (auth required)
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/patients/699169ff647a1e6b948fd181 \
  -H "Authorization: Bearer <TOKEN>"
```

### 6. Get Today's Adherence (auth required)
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/patients/699169ff647a1e6b948fd181/adherence/today \
  -H "Authorization: Bearer <TOKEN>"
```

### 7. Get Monthly Adherence Calendar (auth required)
```bash
curl "https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/patients/699169ff647a1e6b948fd181/adherence/calendar?month=2026-02" \
  -H "Authorization: Bearer <TOKEN>"
```

### 8. Trigger Test Call to Gopi (no auth — admin endpoint)
```bash
curl -X POST https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/admin/elevenlabs/test-call \
  -H "Content-Type: application/json" \
  -d '{"patientId": "699169ff647a1e6b948fd181"}'
```
**Response:**
```json
{
  "success": true,
  "callId": "<new-call-id>",
  "conversationId": "<elevenlabs-conv-id>",
  "callSid": "<twilio-sid>",
  "message": "Call initiated to +919902352425 for patient gopi"
}
```

### 9. Check Call Status (auth required)
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/calls/<CALL_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Endpoint Summary

### Public Endpoints (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/login` | Login (phone or email) |
| POST | `/api/v1/auth/register/payer` | Register B2C payer |
| POST | `/api/v1/auth/register/hospital` | Register B2B hospital |
| POST | `/api/v1/auth/refresh` | Refresh JWT token |
| GET | `/api/v1/admin/elevenlabs/status` | ElevenLabs agent status |
| POST | `/api/v1/admin/elevenlabs/test-call` | Trigger test call |
| POST | `/api/v1/webhooks/elevenlabs/post-call` | Post-call webhook (ElevenLabs) |

### Authenticated Endpoints (Bearer token required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/patients` | List user's patients |
| POST | `/api/v1/patients` | Create patient |
| GET | `/api/v1/patients/:id` | Get patient details |
| PUT | `/api/v1/patients/:id` | Update patient |
| POST | `/api/v1/patients/:id/pause` | Pause patient calls |
| POST | `/api/v1/patients/:id/resume` | Resume patient calls |
| POST | `/api/v1/patients/:id/family-members` | Add family member |
| GET | `/api/v1/patients/:id/family-members` | List family members |
| POST | `/api/v1/patients/:id/test-call/preview` | Audio preview of call script |
| GET | `/api/v1/patients/:patientId/calls` | Patient call history |
| GET | `/api/v1/patients/:patientId/adherence/today` | Today's adherence |
| GET | `/api/v1/patients/:patientId/adherence/calendar` | Monthly adherence calendar |
| GET | `/api/v1/calls/:callId` | Single call detail |

---

## Call Flow (How Calls Work)

1. **Scheduler** (`CallSchedulerService`) runs every minute via cron
2. Checks each patient's `CallConfig` for scheduled time slots (morning, afternoon, evening, night)
3. If current time matches a slot → creates a "due call"
4. **Orchestrator** (`CallOrchestratorService.initiateCall()`) picks it up:
   - Creates a `Call` document (status: `scheduled`)
   - Calls `ElevenLabsAgentService.makeOutboundCall()` via Twilio SIP → Exotel
5. **During call**: ElevenLabs AI agent converses with patient
6. **After call**: ElevenLabs sends webhook to `POST /api/v1/webhooks/elevenlabs/post-call`
   - Updates call status → `completed`
   - Stores transcript, medicine responses (fuzzy matched), vitals, complaints, mood
   - Fetches conversation from ElevenLabs API → extracts cost (credits)
   - Calculates charges: Twilio (duration × ₹0.72/min) + ElevenLabs (credits/1000 × ₹85)
   - Sends post-call WhatsApp report to payer

---

## Test Call Results (2026-02-16)

### Call #1 — Telugu (before prompt fix)
| Field | Value |
|-------|-------|
| Call ID | `6992bcd2b577cc2bf75aa83d` |
| Duration | 23 seconds |
| Issue | AI rushed through questions, didn't wait for answers |

### Call #2 — Telugu (after prompt fix)
| Field | Value |
|-------|-------|
| Call ID | `6992be5cb577cc2bf75aa85d` |
| Duration | 35 seconds |
| Result | AI properly asked one question at a time, waited for answers |

### Call #3 — Hindi (language changed + prompt fix)
| Field | Value |
|-------|-------|
| Call ID | `6992c0d4b577cc2bf75aa883` |
| Duration | 68 seconds |
| Result | Full natural Hindi conversation. Asked each medicine separately, waited for answers, even asked "can you hear?" when patient was silent. Captured mood as "okay". |

### Call #4 — Hindi (exact medicine name prompt + fuzzy matching)
| Field | Value |
|-------|-------|
| Duration | ~60 seconds |
| Changes | Added prompt instruction to use EXACT medicine names from `medicines_list`. Added `fuzzyMedicineMatch()` in webhook. |
| Result | AI still extracted `"Hp one:taken"` (ignored exact-name instruction). Fuzzy matching caught it — Hp1 matched via number word normalization (`one` → `1`). |

### Call #5 — Hindi (2 medicines + caring closing)
| Field | Value |
|-------|-------|
| Duration | 61 seconds |
| Changes | Added Amlodipine (BP tablet) as second medicine. Added "I have noted everything" + warm goodbye + ask to disconnect. |
| Result | Both medicines asked separately. Caring closing worked well. However, Hp1 still `pending` in DB due to `norm()` ordering bug (spaces stripped before word-boundary replacements fired). Amlodipine matched correctly as `taken`. |
| Bug Found | `norm()` did `replace(/[^a-z0-9]/g, '')` before `replace(/\bone\b/g, '1')`, so `"hpone"` had no word boundary for `\bone\b`. |

### Call #6 — Hindi (norm() bug fixed + cost tracking)
| Field | Value |
|-------|-------|
| Duration | 65 seconds |
| Changes | Fixed `norm()` ordering (number words replaced BEFORE stripping non-alphanumeric). Deployed cost tracking (Twilio + ElevenLabs charges). |
| Result | **Full pipeline working.** Both Hp1 and Amlodipine marked `taken`. Cost stored: Twilio ₹0.78, ElevenLabs ₹39.02, Total ₹39.80. Transcript, mood, complaints all captured. |
| Deploy | Cloud Run revision `discipline-ai-api-00022-rkn` |

---

## Fixes Applied During Testing

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| AI rushes through questions | Prompt lacked pacing rules | Added CRITICAL CONVERSATION RULES (one question per turn, wait for answer) |
| Language mismatch | Patient set to Telugu, responded in Hindi | Updated `preferredLanguage` to `hi` + prompt auto-switches on mismatch |
| Medicine response stays `pending` | AI transliterates numbers ("1" → "ek"/"one") | Added `fuzzyMedicineMatch()` with number word normalization |
| Fuzzy match fails for "Hp one" | `norm()` stripped spaces before word-boundary replacements | Reordered: number words replaced BEFORE stripping non-alphanumeric |
| No cost data stored | Webhook didn't fetch ElevenLabs conversation API | Added `getConversation()` call in webhook to fetch credits + calculate charges |
| Prompt changes not reflected in prod | Cloud Run still had old code | Created `scripts/update-agent-prompt.js` to PATCH ElevenLabs API directly |
