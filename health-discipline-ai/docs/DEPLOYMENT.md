# Deployment Guide

## Architecture Overview

```
┌──────────────────────┐  ┌──────────────────────┐
│  Dashboard (Next.js) │  │  Website (Next.js)   │
│  Vercel — auto-deploy│  │  Vercel — manual      │
│  apps/web            │  │  apps/website         │
└──────────┬───────────┘  └──────────────────────┘
           │
           ▼
┌──────────────────────────────────┐     ┌─────────────────────────────┐
│  Backend API (NestJS)            │     │  Sarvam Agent Worker (Py)   │
│  Cloud Run: discipline-ai-api   │     │  Cloud Run: sarvam-agent-   │
│  us-central1 (request-based)    │     │  worker  (always-on, min=1) │
└──────────┬───────────────────────┘     └──────────┬──────────────────┘
           │                                        │
   ┌───────┼──────────┐               ┌─────────────┼─────────────┐
   ▼       ▼          ▼               ▼             ▼             ▼
┌───────┐┌─────────┐┌──────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐
│MongoDB││ElevenLabs││Twilio│  │ LiveKit  │  │ Sarvam AI │  │ Gemini  │
│Azure  ││Voice AI  ││      │  │ Cloud    │  │ STT + TTS │  │ LLM     │
└───────┘└─────────┘└──────┘  └──────────┘  └───────────┘  └─────────┘
```

- **Monorepo**: Turborepo with npm workspaces
- **Dashboard**: Next.js 14 → Vercel (auto-deploy from `master`)
- **Website**: Next.js 14 → Vercel (static export, manual deploy)
- **Backend API**: NestJS 10 → Google Cloud Run (source deploy, no Docker)
- **Sarvam Agent Worker**: Python → Google Cloud Run (always-on, Dockerfile)
- **Database**: MongoDB on Azure Cosmos DB
- **Voice — ElevenLabs stack**: ElevenLabs Conversational AI (managed STT/LLM/TTS)
- **Voice — Sarvam stack**: LiveKit + Sarvam STT/TTS + Gemini LLM (self-hosted agent)
- **Telephony**: Twilio (outbound calls to India)
- **Voice stack toggle**: `VOICE_STACK` env var on API (`elevenlabs` or `sarvam`)

---

## Prerequisites

- Node.js >= 18, npm >= 9
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- [Vercel CLI](https://vercel.com/docs/cli) (optional — can deploy via dashboard)
- GitHub repo: `https://github.com/nithinycr7/discipline-ai-health-prod`

---

## 1. Backend — Google Cloud Run

### Project Info

| Setting        | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| GCP Project ID | `discipline-ai-health`                                       |
| Region         | `us-central1`                                                |
| Service Name   | `discipline-ai-api`                                          |
| Service URL    | `https://discipline-ai-api-337728476024.us-central1.run.app` |

### How It Works

Cloud Run uses **Buildpacks** (no Dockerfile needed):

- `Procfile` tells Cloud Run the start command: `web: node apps/api/dist/main.js`
- `gcp-build` script in root `package.json` builds the API: `npx turbo run build --filter=@health-discipline/api...`
- `.gcloudignore` excludes web app, docs, and dev files from the upload

### Environment Variables

Create an `env.yaml` file (DO NOT commit this):

```yaml
NODE_ENV: 'production'
MONGODB_URI: 'mongodb+srv://...'
JWT_SECRET: 'your-jwt-secret'
JWT_EXPIRES_IN: '15m'
JWT_REFRESH_SECRET: 'your-refresh-secret'
JWT_REFRESH_EXPIRES_IN: '7d'
API_BASE_URL: 'https://discipline-ai-api-337728476024.us-central1.run.app'
FRONTEND_URL: 'https://discipline-ai-health-prod.vercel.app'
TWILIO_ACCOUNT_SID: 'AC...'
TWILIO_AUTH_TOKEN: '...'
TWILIO_PHONE_NUMBER: '+1...'
ELEVENLABS_API_KEY: 'sk_...'
ELEVENLABS_VOICE_ID_FEMALE: '...'
ELEVENLABS_AGENT_ID: 'agent_...'
ELEVENLABS_PHONE_NUMBER_ID: 'phnum_...'
EXOTEL_API_KEY: '...'
EXOTEL_API_TOKEN: '...'
EXOTEL_ACCOUNT_SID: '...'
EXOTEL_CALLER_ID: '...'
EXOTEL_BASE_URL: 'https://api.exotel.com/v1/Accounts'
EXOTEL_SIP_ADDRESS: 'pstn.in2.exotel.com:5070'
```

> **Note:** Do NOT set `PORT` — Cloud Run auto-sets it to 8080.

### Deploy Commands

**Directory:** You must run `gcloud` from the **monorepo root** (`health-discipline-ai/`).

**gcloud path on this machine:**

```
/c/Users/nithi/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud
```

```bash
# cd to monorepo root first
cd /c/Users/nithi/repos/discipline\ health/health-discipline-ai

# First time only: authenticate and set project
gcloud auth login
gcloud config set project discipline-ai-health
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Deploy (from monorepo root — uses --source .)
gcloud run deploy discipline-ai-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# First deploy or when env vars change — add env vars file
gcloud run deploy discipline-ai-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file env.yaml

# Update just env vars without redeploying code
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "KEY=value"
```

**Quick copy-paste deploy command (full path):**

```bash
"/c/Users/nithi/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud" run deploy discipline-ai-api --source . --region us-central1 --allow-unauthenticated
```

### After Deploy — Verify

```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/health
# Expected: {"status":"ok", ...}

# Swagger docs
open https://discipline-ai-api-337728476024.us-central1.run.app/api/docs
```

**Delete `env.yaml` after deployment** — it contains secrets.

---

## 2. Frontend — Vercel

### Project Info

| Setting        | Value                                          |
| -------------- | ---------------------------------------------- |
| Vercel Project | `discipline-ai-health-prod`                    |
| Framework      | Next.js (auto-detected)                        |
| Root Directory | `health-discipline-ai/apps/web`                |
| Production URL | `https://discipline-ai-health-prod.vercel.app` |

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

| Variable              | Value                                                        |
| --------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL` | `https://discipline-ai-api-337728476024.us-central1.run.app` |

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

## 3. Website (Landing Page) — Vercel

### Project Info

| Setting        | Value                                          |
| -------------- | ---------------------------------------------- |
| Vercel Project | `health-discipline-website`                    |
| Vercel Org     | `nithinycr7s-projects`                         |
| Framework      | Next.js 14 (static export)                     |
| Directory      | `apps/website/`                                |
| Production URL | `https://health-discipline-website.vercel.app` |
| Project ID     | `prj_Lzl8aFVM7PkluBKER7kIMawbveHs`             |
| Dev Port       | `3001`                                         |

### Deploy

```bash
# From the website app directory:
cd apps/website

# Production deploy
vercel --prod --yes

# Preview deploy (for testing before going live)
vercel --yes
```

### Local Development

```bash
cd apps/website
npm run dev
# Opens at http://localhost:3001
```

### Pages

| Route        | Description                                        |
| ------------ | -------------------------------------------------- |
| `/`          | Homepage — B2C landing page targeting NRI families |
| `/hospitals` | B2B landing page for hospitals and clinics         |

### After Deploy — Verify

Open `https://health-discipline-website.vercel.app` and check:

- Hero section loads with correct messaging
- Pricing toggle (Monthly/Yearly) works
- "For Hospitals" link navigates to `/hospitals`
- No console errors

---

## 4. Sarvam Agent Worker — Google Cloud Run (always-on)

### Project Info

| Setting        | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| GCP Project ID | `discipline-ai-health`                                               |
| Region         | `us-central1`                                                        |
| Service Name   | `sarvam-agent-worker`                                                |
| Source Dir     | `services/sarvam-agent/`                                             |
| Service URL    | `https://sarvam-agent-worker-337728476024.us-central1.run.app`       |
| Type           | Always-on (min-instances=1, no CPU throttling)                       |

### How It Works

Unlike the API service (request-based), the Sarvam agent worker is a **long-running WebSocket client**:

1. On startup, a background thread runs an HTTP health server on `$PORT` (Cloud Run requirement)
2. The main thread runs the LiveKit agents SDK, connecting to LiveKit Cloud via WebSocket
3. When the NestJS API creates a LiveKit room (via `SarvamAgentService.makeOutboundCall()`), the worker picks it up
4. The worker reads patient metadata from the room, conducts the voice conversation (Sarvam STT → Gemini LLM → Sarvam TTS), then POSTs results to `/api/v1/webhooks/sarvam/post-call`

### Environment Variables

Set these on the Cloud Run service (via `--set-env-vars` or Secret Manager):

| Variable             | Description                          |
| -------------------- | ------------------------------------ |
| `LIVEKIT_URL`        | `wss://discipline-ai-health-ar6qouku.livekit.cloud` |
| `LIVEKIT_API_KEY`    | LiveKit API key                      |
| `LIVEKIT_API_SECRET` | LiveKit API secret                   |
| `SARVAM_API_KEY`     | Sarvam AI API key                    |
| `GOOGLE_API_KEY`     | Google AI key (Gemini LLM + data extraction) |
| `API_BASE_URL`       | `https://discipline-ai-api-337728476024.us-central1.run.app` |

### Deploy Command

**Directory:** Run from the **monorepo root** (`health-discipline-ai/`), pointing `--source` at the Python service directory.

```bash
gcloud run deploy sarvam-agent-worker \
  --source services/sarvam-agent \
  --region us-central1 \
  --min-instances 1 \
  --no-cpu-throttling \
  --memory 1Gi \
  --cpu 1 \
  --no-allow-unauthenticated \
  --project discipline-ai-health
```

**Quick copy-paste deploy command (full gcloud path):**

```bash
"/c/Users/nithi/AppData/Local/Google/Cloud SDK/google-cloud-sdk/bin/gcloud" run deploy sarvam-agent-worker --source services/sarvam-agent --region us-central1 --min-instances 1 --no-cpu-throttling --memory 1Gi --cpu 1 --no-allow-unauthenticated --project discipline-ai-health
```

**Important flags:**
- `--min-instances 1` — Keeps the worker alive (persistent WebSocket connection to LiveKit)
- `--no-cpu-throttling` — Prevents CPU throttle when idle (needed for WebSocket keepalive)
- `--no-allow-unauthenticated` — Worker doesn't serve public traffic (only internal LiveKit connection)

### After Deploy — Verify

```bash
# Check Cloud Run logs
gcloud run services logs read sarvam-agent-worker --region us-central1 --limit 50

# Look for: "Health check server listening on :8080" and LiveKit connection messages
```

### Switching Voice Stacks

The NestJS API uses the `VOICE_STACK` env var to decide which voice stack to use for outbound calls:

```bash
# Switch to Sarvam stack
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "VOICE_STACK=sarvam"

# Switch back to ElevenLabs stack
gcloud run services update discipline-ai-api \
  --region us-central1 \
  --update-env-vars "VOICE_STACK=elevenlabs"
```

Additional env vars needed on `discipline-ai-api` when using Sarvam stack:

| Variable               | Description                          |
| ---------------------- | ------------------------------------ |
| `VOICE_STACK`          | `sarvam` (or `elevenlabs`)           |
| `LIVEKIT_URL`          | Same as worker                       |
| `LIVEKIT_API_KEY`      | Same as worker                       |
| `LIVEKIT_API_SECRET`   | Same as worker                       |
| `LIVEKIT_SIP_TRUNK_ID` | `ST_Twm6jTkqopYJ` (Twilio outbound trunk) |

---

## 5. Key API Endpoints

| Endpoint                                     | Description                                  |
| -------------------------------------------- | -------------------------------------------- |
| `GET /api/v1/health`                         | Health check                                 |
| `GET /api/docs`                              | Swagger documentation                        |
| `POST /api/v1/admin/elevenlabs/test-call`    | Trigger a test call `{ "patientId": "..." }` |
| `GET /api/v1/admin/elevenlabs/status`        | ElevenLabs agent status                      |
| `POST /api/v1/webhooks/elevenlabs/post-call` | ElevenLabs post-call webhook (auto-called)   |
| `POST /api/v1/webhooks/sarvam/post-call`     | Sarvam post-call webhook (sent by agent worker) |

---

## 6. ElevenLabs Webhook Setup

The post-call webhook must be configured in ElevenLabs to send conversation data back to our API.

1. **ElevenLabs Dashboard** → Settings → Webhooks → Add Webhook
   - Name: `health-discipline-post-call`
   - URL: `https://discipline-ai-api-337728476024.us-central1.run.app/api/v1/webhooks/elevenlabs/post-call`
   - Auth: HMAC

2. **Attach to Agent** (via API or dashboard):
   - Agent → Settings → Webhooks → Select the webhook
   - Event: `transcript`

---

## 7. Local Development

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

## 8. Updating an Existing Deployment

### Backend (Cloud Run)

```bash
# From monorepo root (health-discipline-ai/):
cd /c/Users/nithi/repos/discipline\ health/health-discipline-ai

gcloud run deploy discipline-ai-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

> Env vars persist across deploys. Only use `--env-vars-file` when you need to change them.

### Frontend Dashboard (Vercel)

```bash
# If auto-deploy is connected: just push to master
git push origin master

# Otherwise:
cd health-discipline-ai/apps/web && npx vercel --prod
```

### Website Landing Page (Vercel)

```bash
cd health-discipline-ai/apps/website && vercel --prod --yes
```

### Sarvam Agent Worker (Cloud Run)

```bash
# From monorepo root:
gcloud run deploy sarvam-agent-worker \
  --source services/sarvam-agent \
  --region us-central1 \
  --min-instances 1 \
  --no-cpu-throttling \
  --memory 1Gi --cpu 1 \
  --no-allow-unauthenticated \
  --project discipline-ai-health
```

> Env vars persist across deploys. Only use `--set-env-vars` when you need to change them.

---

## 9. Troubleshooting

| Issue                                          | Fix                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| "Failed to fetch" on frontend                  | Check `NEXT_PUBLIC_API_URL` in Vercel env vars                                                                     |
| "No Output Directory named 'public'" on Vercel | Ensure `"framework": "nextjs"` is in `vercel.json`                                                                 |
| Cloud Run deploy fails with PORT error         | Don't set `PORT` env var — Cloud Run sets it automatically                                                         |
| `&` in MongoDB URI breaks deploy               | Use `--env-vars-file env.yaml` instead of inline `--set-env-vars`                                                  |
| CORS errors                                    | Check `FRONTEND_URL` env var on Cloud Run matches your Vercel domain                                               |
| Webhook not updating calls                     | Verify webhook is attached to agent in ElevenLabs dashboard                                                        |
| Calls not auto-triggering                      | Check that patient has a `callconfig` document in MongoDB                                                          |
| `node: command not found` on Cloud Run         | A non-Node.js directory (e.g. `services/` with Python files) is confusing the buildpack. Add it to `.gcloudignore` |
| Buildpack detects Python instead of Node.js    | Check `.gcloudignore` — any directory with `requirements.txt` or `.py` files must be excluded                      |
| Sarvam worker not picking up rooms             | Check Cloud Run logs for LiveKit connection. Verify `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` are set |
| Sarvam worker killed by Cloud Run              | Ensure `--min-instances 1` and `--no-cpu-throttling` are set. Worker needs persistent CPU for WebSocket keepalive  |
| Calls ring but no agent voice                  | Check `VOICE_STACK` env var on API. If `sarvam`, verify the agent worker is running and connected to LiveKit       |
| Sarvam call in wrong language                  | Check patient's `preferredLanguage` in DB. Worker maps to Sarvam lang codes (e.g., `te` → `te-IN`)                |
