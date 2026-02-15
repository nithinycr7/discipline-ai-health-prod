# Deployment Guide

## Backend API Deployment (Cloud Run)

The Health Discipline AI backend is deployed on Google Cloud Run. Always deploy from the **monorepo root**, not from the `apps/api/` directory.

### Prerequisites
- Google Cloud SDK installed and configured
- Authenticated with: `gcloud auth login`
- Project set: `gcloud config set project discipline-ai-health`

### Deployment Command

```bash
gcloud run deploy discipline-ai-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Key Points:**
- `--source .` — Deploy from monorepo root
- The root `package.json` has a `gcp-build` script that builds the API with turbo
- Service URL: https://discipline-ai-api-337728476024.us-central1.run.app

### Environment Variables

Set the following in Cloud Run's environment variables:
- `ELEVENLABS_API_KEY` — ElevenLabs API key for voice synthesis
- `GOOGLE_API_KEY` — Google Cloud API key (Gemini)
- `MONGODB_URI` — Azure Cosmos DB connection string
- `JWT_SECRET` — JWT signing secret
- `TWILIO_ACCOUNT_SID` — Twilio account SID
- `TWILIO_AUTH_TOKEN` — Twilio auth token
- `LIVEKIT_API_KEY` — LiveKit API key
- `LIVEKIT_API_SECRET` — LiveKit API secret
- `LIVEKIT_URL` — LiveKit server URL
- `SARVAM_API_KEY` — Sarvam AI API key (for Sarvam stack)
- `VOICE_STACK` — Either `elevenlabs` or `sarvam` (default: `elevenlabs`)

### Build Process

The `gcp-build` script runs:
```bash
npx turbo run build --filter=@health-discipline/api...
```

This builds the API and all its dependencies using Turbo.

### Monitoring

After deployment, monitor logs:
```bash
gcloud run logs read discipline-ai-api --region us-central1 --follow
```

### Testing

After deployment, test the health endpoint:
```bash
curl https://discipline-ai-api-337728476024.us-central1.run.app/health
```

## Frontend Deployment (Vercel)

The Next.js frontend auto-deploys from the `master` branch to Vercel. Preview deployments are created for all pull requests.

### Deployment Triggers
- **Production**: Push to `master` branch
- **Preview**: Pull request to any branch

### CORS Configuration

The backend uses dynamic CORS to allow:
- `localhost:3000` (local development)
- All `discipline-ai-health-prod*.vercel.app` preview URLs
- Requests with no origin header

See `apps/api/src/main.ts` for implementation.

## Cost Analysis Updates

The cost analysis document (`docs/COST-ANALYSIS.md`) contains pricing calculations and scenario analysis. It is **not deployed** but is maintained in the repository as reference documentation for:
- Pricing decisions
- Break-even analysis
- Cost optimization strategies

**Latest Update (Feb 2026):**
- Updated with destination-based Twilio pricing ($0.0405/min to India mobile)
- Confirmed Gemini 1.5 Flash pricing from official API docs
- Updated call duration to 2-minute actual measurement
- Both plans now profitable with improved unit economics
