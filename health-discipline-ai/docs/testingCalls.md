# Testing Calls - Test Call Endpoint Documentation

## Overview
The test call endpoint allows you to trigger immediate test calls to assess call quality using the same production call orchestration system.

## Endpoint Details

**URL:** `POST /api/v1/patients/:id/test-call`

**Base URLs:**
- Local: `http://localhost:3001`
- Production: `https://discipline-ai-api-mk6mqe2kta-uc.a.run.app`

## Authentication

**Header:** `Authorization: Bearer <JWT_TOKEN>`

The endpoint requires a valid JWT token from authenticated users. Only users can trigger calls for their own patients.

## Request Body (Optional)

```json
{
  "timing": "test"
}
```

**Timing Options:**
- `morning` - Morning call slot
- `afternoon` - Afternoon call slot
- `evening` - Evening call slot
- `night` - Night call slot
- `test` - Default test timing

## Response Format

**Success (200):**
```json
{
  "status": "ok",
  "message": "Test call initiated",
  "patientId": "6999ad9dfc5d7bd858eedee7",
  "timing": "test"
}
```

**Error (400):**
```json
{
  "status": "error",
  "reason": "No medicines configured for this patient"
}
```

## Pre-requisites

For the endpoint to work, the patient must have:
- ✅ Active call configuration
- ✅ At least one medicine configured
- ✅ Valid phone number

## Usage Examples

### Get JWT Token
```bash
curl -X POST "https://discipline-ai-api-mk6mqe2kta-uc.a.run.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+919902352425"
  }'
```

### Trigger Test Call (Production)
```bash
curl -X POST "https://discipline-ai-api-mk6mqe2kta-uc.a.run.app/api/v1/patients/6999ad9dfc5d7bd858eedee7/test-call" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timing":"test"}'
```

### Trigger Test Call (Local)
```bash
curl -X POST "http://localhost:3001/api/v1/patients/6999ad9dfc5d7bd858eedee7/test-call" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"timing":"test"}'
```

## Voice Stack Configuration

- **Current Stack:** Sarvam (configured in `.env` as `VOICE_STACK=sarvam`)
- **Webhook Endpoint:** `/api/v1/webhooks/sarvam/post-call`
- **Dynamic Prompts:** Enabled (`DYNAMIC_PROMPT_ENABLED=true`)

## Call Flow

1. User authenticates and gets JWT token
2. Calls `/api/v1/patients/:id/test-call` endpoint
3. Endpoint validates:
   - User owns the patient
   - Patient has active call configuration
   - Patient has medicines configured
4. CallOrchestratorService initiates call via Sarvam
5. Call connects to patient's phone number
6. Sarvam agent follows dynamic prompt based on patient config
7. Call webhook receives post-call data at `/api/v1/webhooks/sarvam/post-call`

## Implementation Details

**File:** `apps/api/src/patients/patients.controller.ts`

**Key Components:**
- **PatientsController.testCall()** - HTTP endpoint handler
- **CallOrchestratorService.initiateCall()** - Call initiation logic
- **ModuleRef** - Runtime service resolution (handles circular dependencies)

**Circular Dependency Resolution:**
- CallSchedulerModule uses `forwardRef(() => PatientsModule)`
- PatientsController uses `ModuleRef.get()` for runtime service resolution

## Deployment Status

✅ **Deployed to Cloud Run**
- Service: `discipline-ai-api`
- Region: `us-central1`
- URL: `https://discipline-ai-api-mk6mqe2kta-uc.a.run.app`
- Last Deployed: 2026-02-21

## Test Patient Exception

Patients tagged with `tag: "test"` bypass the daily call limit, allowing multiple test calls per day.

### Tagging a Patient as Test

**Update Patient Endpoint:**

```bash
curl -X PUT "https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/patients/:id" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tag":"test"}'
```

**Response Example:**
```json
{
  "_id": "6999ad9dfc5d7bd858eedee7",
  "fullName": "Gopi",
  "preferredName": "Nanna",
  "tag": "test",
  ...
}
```

### How It Works

- When a test-tagged patient triggers a call, the `CallOrchestratorService` and internal `trigger-call` endpoint skip the daily call limit check
- The logs will show: `Patient {id} is tagged as 'test', bypassing daily call limit`
- Non-test patients still have the safety mechanism: one non-retry call per patient per day

## Testing Notes

- Calls use the exact same orchestration as production scheduled calls
- Each patient can have only one non-retry call per day (safety mechanism) — EXCEPT test-tagged patients
- Test calls follow the same medicine check flow as production
- Dynamic prompts are enabled for personalized call experience
- To test repeatedly, tag the patient with `tag: "test"` to bypass the daily limit
