# Deployment Checklist & Status Report

## Summary
✅ **Code Updates**: Cost analysis updated with published pricing (destination-based Twilio, 2-minute calls)
✅ **Build Test**: API builds successfully with Turborepo (`npm run gcp-build`)
✅ **Container Build**: Buildpacks successfully created Docker image
❌ **Startup**: Container crashes due to missing environment variables

---

## Status Report

### What Was Completed
1. **Cost Analysis Updated** (`docs/COST-ANALYSIS.md`)
   - Twilio: Updated to destination-based pricing ($0.0405/min mobile)
   - Gemini: Verified 1.5 Flash pricing ($0.075/$0.30 per 1M tokens)
   - Call Duration: Updated from 2.5 min to 2 min actual
   - Break-even: Improved to ~34 patients (vs ~50 before)
   - Both plans now profitable with 42% (Suraksha) and 13% (Sampurna) margins

2. **Deployment Guide Created** (`DEPLOYMENT.md` at root)
   - Comprehensive Cloud Run deployment instructions
   - Environment variable template
   - Verification commands

3. **Build Verified**
   ```bash
   npm run gcp-build  # ✅ SUCCESS
   ```

4. **Container Build Verified**
   - Buildpacks successfully compiled NestJS application
   - Image layers created and pushed to Cloud Run registry

---

## Next Steps: Deployment with Environment Variables

### Step 1: Create `env.yaml` (DO NOT COMMIT)

Create file `env.yaml` in the monorepo root with these secrets:

```yaml
NODE_ENV: "production"
MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/db"
JWT_SECRET: "your-jwt-secret-key"
JWT_EXPIRES_IN: "15m"
JWT_REFRESH_SECRET: "your-refresh-secret"
JWT_REFRESH_EXPIRES_IN: "7d"
API_BASE_URL: "https://discipline-ai-api-337728476024.us-central1.run.app"
FRONTEND_URL: "https://discipline-ai-health-prod.vercel.app"
TWILIO_ACCOUNT_SID: "AC..."
TWILIO_AUTH_TOKEN: "..."
TWILIO_PHONE_NUMBER: "+1..."
ELEVENLABS_API_KEY: "sk_..."
ELEVENLABS_VOICE_ID_FEMALE: "..."
ELEVENLABS_AGENT_ID: "agent_..."
ELEVENLABS_PHONE_NUMBER_ID: "phnum_..."
EXOTEL_API_KEY: "..."
EXOTEL_API_TOKEN: "..."
EXOTEL_ACCOUNT_SID: "..."
EXOTEL_CALLER_ID: "..."
EXOTEL_BASE_URL: "https://api.exotel.com/v1/Accounts"
EXOTEL_SIP_ADDRESS: "pstn.in2.exotel.com:5070"
```

**Required Secrets:**
- [ ] MONGODB_URI — Azure Cosmos DB connection string
- [ ] JWT_SECRET — Random 32-char secret for JWT signing
- [ ] TWILIO_ACCOUNT_SID — From Twilio console
- [ ] TWILIO_AUTH_TOKEN — From Twilio console
- [ ] ELEVENLABS_API_KEY — From ElevenLabs dashboard
- [ ] ELEVENLABS_AGENT_ID — Agent ID from ElevenLabs (agent_8401kheez5xxe9wv305azdv2kv26)
- [ ] EXOTEL credentials — From Exotel dashboard

### Step 2: Deploy with Environment Variables

```bash
cd /c/Users/nithi/repos/discipline\ health/health-discipline-ai

gcloud run deploy discipline-ai-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml
```

### Step 3: Verify Deployment

```bash
# Health check endpoint
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/health

# Swagger documentation
open https://discipline-ai-api-337728476024.us-central1.run.app/api/docs
```

### Step 4: Clean Up

```bash
# IMPORTANT: Delete the env.yaml file after deployment
rm env.yaml
```

---

## Current Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| Cost Analysis | ✅ Updated | Destination-based Twilio, 2-min calls |
| Code Build | ✅ Passing | Turborepo + NestJS build successful |
| Container Build | ✅ Passing | Buildpacks successfully created image |
| Environment Setup | ⏳ Pending | Requires secrets from respective services |
| Cloud Run Deploy | ⏳ Pending | Waiting for env.yaml with production secrets |
| Frontend (Vercel) | ✅ Auto-deployed | Will auto-deploy from `master` branch when ready |

---

## Key Improvements in This Version

### Cost Analysis Updates
- **Per-call cost**: ₹25.91 (was ₹32.23 with old Twilio rates)
- **Profitability**: Both plans now profitable at 2-minute calls
- **Break-even**: 34 patients (down from ~50)
- **Sarvam Stack**: 65% per-call savings (₹9.17 vs ₹25.91)

### Scenario Analysis (100 Patients)
- ElevenLabs: ₹156,607/month cost → barely breaks even (+₹893)
- Sarvam: ₹101,573/month cost → strong profit (+₹55,927)
- **Difference: ₹55K/month swing in favor of Sarvam**

---

## Deployment Architecture

```
┌─────────────────────────┐
│   Frontend (Next.js)    │ ← Vercel (auto-deploy from master)
│   NEXT_PUBLIC_API_URL   │
└────────────┬────────────┘
             │
             ▼ (HTTP/HTTPS)
┌─────────────────────────┐
│  Backend (NestJS)       │ ← Google Cloud Run
│  :8080 (auto-assigned)  │ ← MongoDB, ElevenLabs, Twilio, Exotel
└─────────────────────────┘
```

---

## Commits Created

1. **a367a97**: Update cost analysis with published pricing
   - Twilio destination-based rates
   - Gemini pricing verification
   - 2-minute call duration baseline

2. **7df263a**: Add deployment guide for Cloud Run backend
   - Comprehensive DEPLOYMENT.md
   - Environment variable documentation
   - Verification procedures

---

## Next Actions

1. **Gather Production Secrets** from:
   - Azure Cosmos DB (MONGODB_URI)
   - Twilio console (ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER)
   - ElevenLabs dashboard (API_KEY, AGENT_ID, PHONE_NUMBER_ID)
   - Exotel dashboard (API credentials)

2. **Create env.yaml** with all secrets (locally, never commit)

3. **Deploy to Cloud Run** with `--env-vars-file env.yaml`

4. **Verify** using health check and Swagger endpoints

5. **Update Vercel** frontend env var if API URL changes

6. **Configure ElevenLabs Webhook** as per DEPLOYMENT.md section 4

---

## Git Status

```
Branch: frontend-redesign
Commits: 2 new
Files modified: docs/COST-ANALYSIS.md
Files created: DEPLOYMENT.md (root), DEPLOYMENT-CHECKLIST.md (this file)
Remote: Pushed ✅
```
