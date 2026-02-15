# Technical Specification

## Health Discipline AI

**Version:** 1.0  
**Date:** 2026-02-14  
**Status:** Draft  
**Related:** [BRD-health-discipline-ai.md](BRD-health-discipline-ai.md) | [epics-and-stories.md](epics-and-stories.md)

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-------------|---------|
| **Frontend** | Next.js (React, App Router) | Dashboard, onboarding UI, admin/billing screens |
| **Backend** | NestJS | REST API, business logic, auth, integrations |
| **Database** | MongoDB | Users, patients, medicines, calls, subscriptions |
| **AI Voice** | ElevenLabs | Text-to-speech, natural voice for calls |
| **Telephony** | Twilio | Outbound calls to patients (India numbers) |
| **Payment** | Razorpay + Stripe | B2C/B2B subscriptions (TBD) |
| **Hosting** | TBD | Vercel/AWS/GCP (TBD) |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Dashboard   │  │  Onboarding  │  │  Admin       │  │  Settings   │  │
│  │  (Web)       │  │  (Web)       │  │  / Billing   │  │  / Profile  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         └─────────────────┼─────────────────┼─────────────────┘         │
│                            │   HTTPS / REST   │                           │
│                            ▼                 ▼                           │
└────────────────────────────┼─────────────────┼───────────────────────────┘
                             │                 │
┌────────────────────────────┼─────────────────┼───────────────────────────┐
│                        BACKEND (NestJS)       │                           │
│  ┌─────────────────────────┴─────────────────┴───────────────────────┐  │
│  │  API Gateway / Controllers (Auth, Patients, Medicines, Calls, etc.)│  │
│  └─────────────────────────────┬─────────────────────────────────────┘  │
│  ┌─────────────────────────────┴─────────────────────────────────────┐  │
│  │  Services (Business Logic) + Modules                               │  │
│  └──┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┘  │
│     │          │          │          │          │          │              │
│  ┌──┴──┐   ┌───┴───┐  ┌──┴──┐   ┌───┴───┐  ┌──┴──┐   ┌───┴───┐         │
│  │Mongo│   │Twilio │  │11Labs│   │Cron   │  │Razor-│   │Stripe │         │
│  │ DB  │   │       │  │      │   │Scheduler│  │pay  │   │       │         │
│  └──┬──┘   └───┬───┘  └──┬───┘   └───┬───┘  └──┬──┘   └───┬───┘         │
└─────┼──────────┼─────────┼───────────┼──────────┼──────────┼─────────────┘
      │          │         │           │          │          │
      ▼          ▼         ▼           ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ (Payment gateways)
│ MongoDB  │ │ Twilio │ │ElevenLabs│ │ Call    │
│ Atlas    │ │ API    │ │ API     │ │ Queue   │
└──────────┘ └────────┘ └─────────┘ └─────────┘
```

---

## 3. Frontend (Next.js)

### 3.1 Responsibilities

- Dashboard (patient list, adherence, calendar, reports)
- Onboarding flows (payer/patient setup, medicine entry)
- Admin and billing screens (B2B, subscription management)
- Authentication UI (login, registration, session handling)
- Settings and profile management

### 3.2 Key Choices

| Item | Choice |
|------|--------|
| Framework | Next.js 14+ with **App Router** |
| UI | React components; consider Tailwind CSS / component library |
| Data fetching | Server Components where possible; `fetch` to NestJS API for client data |
| Auth | JWT stored (httpOnly cookie or secure storage); sent to NestJS on each request |
| API base URL | Configured via `NEXT_PUBLIC_API_URL` (e.g. `https://api.healthdiscipline.ai`) |

### 3.3 Suggested Folder Structure

```
frontend/                    # or project root if monorepo
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   ├── patients/
│   ├── onboarding/
│   └── api/                 # optional: proxy or webhook pass-through only
├── components/
├── lib/
│   ├── api.ts               # NestJS API client
│   └── auth.ts
├── public/
└── next.config.js
```

### 3.4 Environment Variables (Frontend)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | NestJS backend base URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_ENV` | Environment name | `development` / `staging` / `production` |

---

## 4. Backend (NestJS)

### 4.1 Responsibilities

- REST API for all app features (auth, patients, medicines, calls, subscriptions)
- Authentication and authorization (JWT, roles: payer, hospital_admin)
- MongoDB access via Mongoose (or native driver)
- Integration with Twilio (outbound calls) and ElevenLabs (voice)
- Call scheduler (cron) and retry logic
- Payment webhooks and subscription lifecycle (Razorpay, Stripe)
- WhatsApp integration for onboarding and notifications (when applicable)

### 4.2 Key Choices

| Item | Choice |
|------|--------|
| Framework | NestJS (Node.js) |
| API style | REST; JSON request/response |
| Database driver | Mongoose (MongoDB ODM) |
| Auth | JWT (e.g. `@nestjs/jwt`); passport strategies for B2C (e.g. phone/WhatsApp) and B2B (email/password) |
| Validation | `class-validator` + `class-transformer`; DTOs per endpoint |
| Config | `@nestjs/config`; env-based (see below) |

### 4.3 Suggested Module Structure

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/           # guards, decorators, filters, interceptors
│   ├── config/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   └── dto/
│   ├── users/
│   ├── patients/
│   ├── medicines/
│   ├── calls/
│   ├── subscriptions/
│   ├── call-scheduler/   # cron, retry, Twilio + ElevenLabs orchestration
│   ├── integrations/
│   │   ├── twilio/
│   │   ├── elevenlabs/
│   │   └── whatsapp/
│   └── health/           # health check for DB, external services
├── test/
├── package.json
└── nest-cli.json
```

### 4.4 Environment Variables (Backend)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Environment | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for signing JWTs | (secure random string) |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `TWILIO_ACCOUNT_SID` | Twilio account | — |
| `TWILIO_AUTH_TOKEN` | Twilio auth | — |
| `TWILIO_PHONE_NUMBER` | Outbound caller ID (India) | — |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | — |
| `ELEVENLABS_VOICE_ID_*` | Voice IDs (male/female, language) | — |
| `RAZORPAY_*` / `STRIPE_*` | Payment keys (when implemented) | — |
| `FRONTEND_URL` | Next.js origin (CORS, redirects) | `http://localhost:3000` |

---

## 5. Database (MongoDB)

### 5.1 Hosting

- **MongoDB Atlas** recommended (managed, backups, scaling).
- Connection from NestJS via `MONGODB_URI`.

### 5.2 Collections (Summary)

| Collection | Purpose |
|------------|---------|
| `users` | Account holders (payers, hospital admins); roles, credentials, contact |
| `patients` | Patient profiles (name, preferred name, phone, language, timezone, conditions) |
| `medicines` | Medicine list per patient; brand/generic, timing, food, nickname |
| `calls` | Call records: patient, timestamp, duration, responses, vitals, mood, status |
| `subscriptions` | Billing and subscription status per user/patient |
| `callConfigs` | Per-patient call schedule, retry settings, pause/resume |

Detailed field-level design remains in BRD §7.4 and can be expanded in a separate **data model** doc.

### 5.3 Indexes (Recommended)

- `users`: `phone` (unique for B2C), `email` (unique for B2B).
- `patients`: `userId`, `phone`.
- `medicines`: `patientId`, `patientId + timing`.
- `calls`: `patientId`, `patientId + createdAt` (date range queries).
- `subscriptions`: `userId`, `patientId`, `status`.
- `callConfigs`: `patientId`.

---

## 6. Frontend–Backend Communication

### 6.1 Protocol

- **HTTPS** in production.
- **REST**: JSON request body and response.
- **Auth**: `Authorization: Bearer <JWT>` (or cookie, if same approach chosen on both sides).

### 6.2 CORS

- NestJS allows origin from `FRONTEND_URL` only (and optionally staging URLs).

### 6.3 Example API Surface (NestJS)

- `POST /auth/register/payer` — B2C registration (e.g. phone/WhatsApp).
- `POST /auth/register/hospital` — B2B registration (email/password).
- `POST /auth/login` — Login; returns JWT.
- `GET/POST/PUT/DELETE /patients` — Patient CRUD.
- `GET/POST/PUT/DELETE /patients/:id/medicines` — Medicine CRUD (per BRD/epics).
- `GET /patients/:id/adherence` — Daily adherence.
- `GET /patients/:id/calls` — Call history.
- `POST /patients/:id/pause`, `POST /patients/:id/resume` — Pause/resume calls.
- `GET /subscriptions`, `POST /subscriptions` — Plan selection and lifecycle.
- Webhooks (e.g. `/webhooks/twilio`, `/webhooks/razorpay`) as needed.

Exact routes and DTOs to be aligned with epics and BRD functional requirements.

---

## 7. Deployment (High Level)

| Component | Option | Notes |
|-----------|--------|--------|
| Frontend (Next.js) | Vercel, or static/Node on AWS/GCP | Use `NEXT_PUBLIC_API_URL` for backend |
| Backend (NestJS) | AWS (ECS/Lambda), GCP (Cloud Run), or VM | Persistent process for cron/scheduler |
| MongoDB | Atlas (shared or dedicated cluster) | Same `MONGODB_URI` for backend |
| Cron / Scheduler | NestJS `@nestjs/schedule`, or external (e.g. AWS EventBridge) | Must run in same env as backend that talks to DB and Twilio |

---

## 8. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-14 | Initial technical spec: Next.js frontend, NestJS backend, MongoDB |

---

**Next steps:** Align API contract (OpenAPI/Swagger) with this spec and epics; define exact DTOs and error formats; document WhatsApp/Telephony and payment webhook payloads when integrations are finalized.
