# Deployment Guide

## Architecture Overview

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│   Frontend (Next.js)    │────▶│   Backend API (NestJS)       │
│   Vercel                │     │   Google Cloud Run           │
│   Port: 3000            │     │   Port: 8080 (auto)          │
└─────────────────────────┘     └──────────┬───────────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                ▼                ▼
                   ┌────────────┐  ┌─────────────┐  ┌────────────┐
                   │  MongoDB   │  │  ElevenLabs  │  │   Twilio   │
                   │ Azure      │  │  Voice AI    │  │  Telephony │
                   │ Cosmos DB  │  │              │  │            │
                   └────────────┘  └─────────────┘  └────────────┘
```

- **Monorepo**: Turborepo with npm workspaces
- **Frontend**: Next.js 14 → Vercel
- **Backend**: NestJS 10 → Google Cloud Run (source deploy, no Docker)
- **Database**: MongoDB on Azure Cosmos DB
- **Voice AI**: ElevenLabs Conversational AI Agent
- **Telephony**: Twilio (outbound calls to India)

---

## Prerequisites

- Node.js >= 18, npm >= 9
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- [Vercel CLI](https://vercel.com/docs/cli) (optional — can deploy via dashboard)
- GitHub repo: `https://github.com/nithinycr7/discipline-ai-health-prod`

---

## 1. Backend — Google Cloud Run

### Project Info

| Setting        | Value                                      |
|----------------|--------------------------------------------|
| GCP Project ID | `discipline-ai-health`                     |
| Region         | `us-central1`                              |
| Service Name   | `discipline-ai-api`                        |
| Service URL    | `https://discipline-ai-api-337728476024.us-central1.run.app` |

### How It Works

Cloud Run uses **Buildpacks** (no Dockerfile needed):
- `Procfile` tells Cloud Run the start command: `web: node apps/api/dist/main.js`
- `gcp-build` script in root `package.json` builds the API: `npx turbo run build --filter=@health-discipline/api...`
- `.gcloudignore` excludes web app, docs, and dev files from the upload

### Environment Variables

Create an `env.yaml` file (DO NOT commit this):

```yaml
NODE_ENV: "production"
MONGODB_URI: "mongodb+srv://..."
JWT_SECRET: "your-jwt-secret"
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

> **Note:** Do NOT set `PORT` — Cloud Run auto-sets it to 8080.

### Deploy Commands

```bash
# First time: authenticate and set project
gcloud auth login
gcloud config set project discipline-ai-health

# Enable required APIs (first time only)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy with env vars file
gcloud run deploy discipline-ai-api \
  --source ./health-discipline-ai \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml

# Or update just env vars (no redeploy)
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "KEY=value"
```

### After Deploy — Verify

```bash
# Health check
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/health

# Swagger docs
open https://discipline-ai-api-337728476024.us-central1.run.app/api/docs
```

**Delete `env.yaml` after deployment** — it contains secrets.

---

## 2. Frontend — Vercel

### Project Info

| Setting         | Value                                     |
|-----------------|-------------------------------------------|
| Vercel Project  | `discipline-ai-health-prod`               |
| Framework       | Next.js (auto-detected)                   |
| Root Directory  | `health-discipline-ai/apps/web`           |
| Production URL  | `https://discipline-ai-health-prod.vercel.app` |

### Vercel Configuration

The file `apps/web/vercel.json` configures the build:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "cd ../.. && npx turbo run build --filter=@health-discipline/web..."
}
```

This tells Vercel to:
1. Navigate to the monorepo root
2. Use Turborepo to build only the web app and its dependencies

### Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable              | Value                                                         |
|-----------------------|---------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL` | `https://discipline-ai-api-337728476024.us-central1.run.app`  |

> This is the only env var needed for the frontend. It connects the Next.js app to the backend API.

### Deploy

**Option A: Auto-deploy via GitHub (recommended)**
1. Connect the GitHub repo in Vercel dashboard
2. Set **Root Directory** to `health-discipline-ai/apps/web`
3. Every push to `master` auto-deploys

**Option B: Manual deploy via CLI**
```bash
cd health-discipline-ai/apps/web
npx vercel --prod
```

### After Deploy — Verify

Open `https://discipline-ai-health-prod.vercel.app` and check:
- Registration page loads (`/register/payer`)
- No "Failed to fetch" errors in the console
- API calls go to the Cloud Run URL (not localhost)

---

## 3. Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | Health check |
| `GET /api/docs` | Swagger documentation |
| `POST /api/v1/admin/elevenlabs/test-call` | Trigger a test call `{ "patientId": "..." }` |
| `GET /api/v1/admin/elevenlabs/status` | ElevenLabs agent status |
| `POST /api/v1/webhooks/elevenlabs/post-call` | ElevenLabs post-call webhook (auto-called) |

---

## 4. ElevenLabs Webhook Setup

The post-call webhook must be configured in ElevenLabs to send conversation data back to our API.

1. **ElevenLabs Dashboard** → Settings → Webhooks → Add Webhook
   - Name: `health-discipline-post-call`
   - URL: `https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/webhooks/elevenlabs/post-call`
   - Auth: HMAC

2. **Attach to Agent** (via API or dashboard):
   - Agent → Settings → Webhooks → Select the webhook
   - Event: `transcript`

---

## 5. Local Development

```bash
cd health-discipline-ai

# Install all dependencies
npm install

# Run both frontend and backend
npm run dev
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# Swagger:  http://localhost:3001/api/docs

# Run only backend
npx turbo run dev --filter=@health-discipline/api

# Run only frontend
npx turbo run dev --filter=@health-discipline/web

# Build everything
npm run build
```

### Local Environment

Copy `apps/api/.env.example` (or create `apps/api/.env`) with all required variables. For local dev, set:
```
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

---

## 6. Updating an Existing Deployment

### Backend (Cloud Run)
```bash
# Push code to GitHub, then:
gcloud run deploy discipline-ai-api \
  --source ./health-discipline-ai \
  --region us-central1 \
  --allow-unauthenticated
```
> Env vars persist across deploys. Only use `--env-vars-file` when you need to change them.

### Frontend (Vercel)
```bash
# If auto-deploy is connected: just push to master
git push origin master

# Otherwise:
cd health-discipline-ai/apps/web && npx vercel --prod
```

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| "Failed to fetch" on frontend | Check `NEXT_PUBLIC_API_URL` in Vercel env vars |
| "No Output Directory named 'public'" on Vercel | Ensure `"framework": "nextjs"` is in `vercel.json` |
| Cloud Run deploy fails with PORT error | Don't set `PORT` env var — Cloud Run sets it automatically |
| `&` in MongoDB URI breaks deploy | Use `--env-vars-file env.yaml` instead of inline `--set-env-vars` |
| CORS errors | Check `FRONTEND_URL` env var on Cloud Run matches your Vercel domain |
| Webhook not updating calls | Verify webhook is attached to agent in ElevenLabs dashboard |
| Calls not auto-triggering | Check that patient has a `callconfig` document in MongoDB |
