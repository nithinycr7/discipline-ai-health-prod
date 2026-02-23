# Cocarely - System Architecture

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Monorepo Structure](#monorepo-structure)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [AI Voice Call Flow (End-to-End)](#ai-voice-call-flow-end-to-end)
7. [AI Agent & Prompt Control](#ai-agent--prompt-control)
8. [Dynamic Prompt Assembly](#dynamic-prompt-assembly)
9. [Call Scheduler & Retry Logic](#call-scheduler--retry-logic)
10. [WhatsApp Onboarding Flow](#whatsapp-onboarding-flow)
11. [Notifications System](#notifications-system)
12. [Weekly Reports](#weekly-reports)
13. [Subscription & Billing](#subscription--billing)
14. [API Reference](#api-reference)
15. [Environment Configuration](#environment-configuration)
16. [Deployment & Scaling](#deployment--scaling)

---

## Overview

Cocarely is an AI-powered medication adherence monitoring platform that makes automated voice calls to elderly patients in India to check if they've taken their daily medicines.

**Target Users:**
- **B2C (Payers):** NRI children living abroad who want to monitor their elderly parents' medicine intake
- **B2B (Hospitals):** Hospital administrators managing multiple patients

**Core Value Proposition:** Bridge the gap between elderly patients and their children through AI voice calls — the most inclusive interface requiring zero tech skills from the patient.

**How It Works:**
1. Payer registers and adds their parent's details + medicines via WhatsApp or dashboard
2. AI calls the patient daily at their configured time (e.g., 8:30 AM IST)
3. AI asks about each medicine by name in Hindi, checks vitals, and assesses mood
4. After the call, a report is sent to the payer via WhatsApp
5. Payer can view detailed adherence data, trends, and transcripts on the dashboard

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14+ (App Router) | Dashboard, auth, patient management |
| **Backend** | NestJS (TypeScript) | REST API, business logic, scheduling |
| **Database** | MongoDB Atlas (Mongoose ODM) | All persistent data |
| **AI Voice** | ElevenLabs Conversational AI | Autonomous voice agent for patient calls |
| **TTS** | ElevenLabs v3 Conversational (`eleven_v3_conversational`) | Multilingual text-to-speech for voice generation |
| **LLM (Agent)** | Google Gemini 2.5 Flash (`gemini-2.5-flash`) | Fast, low-cost LLM for voice conversations + post-call extraction |
| **Telephony** | Twilio | Outbound phone calls, WhatsApp messaging |
| **Build System** | Turborepo | Monorepo management |
| **Styling** | Tailwind CSS + Shadcn UI | Component library |
| **Auth** | JWT (localStorage) | Access + refresh token authentication |
| **Scheduling** | @nestjs/schedule (Cron) | Minute-by-minute call scheduler |
| **Timezone** | Luxon | Patient timezone conversions |
| **Payments** | Razorpay (India) + Stripe (International) | Subscription billing |

---

## Monorepo Structure

```
health-discipline-ai/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   ├── src/
│   │   │   ├── main.ts               # App bootstrap, Swagger, CORS, validation
│   │   │   ├── app.module.ts          # Root module
│   │   │   │
│   │   │   ├── auth/                  # Authentication
│   │   │   │   ├── auth.controller.ts     # POST /auth/register/payer, /auth/register/hospital, /auth/login
│   │   │   │   ├── auth.service.ts        # JWT generation, bcrypt password hashing
│   │   │   │   ├── dto/                   # RegisterPayerDto, RegisterHospitalDto, LoginDto
│   │   │   │   └── strategies/jwt.strategy.ts  # Passport JWT strategy
│   │   │   │
│   │   │   ├── users/                 # User management
│   │   │   │   ├── users.service.ts       # User CRUD operations
│   │   │   │   └── schemas/user.schema.ts # User model (phone, email, role, timezone)
│   │   │   │
│   │   │   ├── patients/              # Patient management
│   │   │   │   ├── patients.controller.ts # CRUD endpoints
│   │   │   │   ├── patients.service.ts    # Business logic + first-call tracking
│   │   │   │   └── schemas/patient.schema.ts  # Patient model (preferredName, health data)
│   │   │   │
│   │   │   ├── medicines/             # Medicine management
│   │   │   │   ├── medicines.controller.ts    # CRUD endpoints
│   │   │   │   ├── medicines.service.ts       # Medicine CRUD + catalog lookup
│   │   │   │   ├── medicine-catalog.service.ts # Reference database of medicines
│   │   │   │   └── schemas/
│   │   │   │       ├── medicine.schema.ts         # Per-patient medicine (brandName, timing, nicknames)
│   │   │   │       └── medicine-catalog.schema.ts # Medicine reference catalog
│   │   │   │
│   │   │   ├── calls/                 # Call records
│   │   │   │   ├── calls.controller.ts    # Query call history, adherence
│   │   │   │   ├── calls.service.ts       # Call CRUD, adherence calculations, cost tracking
│   │   │   │   └── schemas/call.schema.ts # Call model (medicines checked, vitals, transcript)
│   │   │   │
│   │   │   ├── call-configs/          # Per-patient call schedules
│   │   │   │   ├── call-configs.service.ts    # Call config CRUD
│   │   │   │   └── schemas/call-config.schema.ts # Morning/evening time, timezone, retry settings, dynamicPromptEnabled
│   │   │   │
│   │   │   ├── call-scheduler/        # Automated call scheduling
│   │   │   │   ├── call-scheduler.service.ts    # Cron (every minute) - finds due calls
│   │   │   │   ├── call-orchestrator.service.ts # Initiates calls via ElevenLabs/Sarvam + dynamic prompt assembly
│   │   │   │   └── retry-handler.service.ts     # Retry logic (2 retries, 30 min intervals)
│   │   │   │
│   │   │   ├── dynamic-prompt/        # Dynamic prompt assembly (anti-fatigue)
│   │   │   │   ├── prompt-assembler.service.ts       # ** CORE ** Orchestrates context + variant + tone + screening
│   │   │   │   ├── context-builder.service.ts        # Aggregates 14-day call data from MongoDB
│   │   │   │   ├── flow-variant-selector.service.ts  # Deterministic variant + tone selection
│   │   │   │   ├── screening-question-selector.service.ts  # Condition-specific health questions
│   │   │   │   ├── dynamic-prompt.module.ts           # NestJS module
│   │   │   │   ├── index.ts                           # Barrel exports
│   │   │   │   └── types/
│   │   │   │       └── prompt-context.types.ts        # Enums, interfaces, screening schedule constants
│   │   │   │
│   │   │   ├── integrations/          # External service integrations
│   │   │   │   ├── elevenlabs/
│   │   │   │   │   ├── elevenlabs-agent.service.ts     # ** CORE ** AI agent management + outbound calls
│   │   │   │   │   ├── elevenlabs.service.ts           # TTS audio generation
│   │   │   │   │   ├── elevenlabs-setup.controller.ts  # Admin: setup-agent, import-phone, test-call
│   │   │   │   │   └── elevenlabs-webhook.controller.ts # Post-call webhook (transcript + data extraction)
│   │   │   │   │
│   │   │   │   ├── twilio/
│   │   │   │   │   ├── twilio.service.ts              # Voice call + SMS sending
│   │   │   │   │   └── twilio-webhook.controller.ts   # Twilio status callbacks
│   │   │   │   │
│   │   │   │   ├── whatsapp/
│   │   │   │   │   ├── whatsapp.service.ts            # WhatsApp message sending via Twilio
│   │   │   │   │   ├── onboarding-flow.service.ts     # 14-phase onboarding state machine
│   │   │   │   │   └── whatsapp-webhook.controller.ts # Incoming WhatsApp messages
│   │   │   │   │
│   │   │   │   ├── sarvam/                             # Sarvam AI voice stack (LiveKit-based)
│   │   │   │   │   ├── sarvam-agent.service.ts          # Sarvam outbound call initiation + LiveKit room
│   │   │   │   │   ├── sarvam-webhook.controller.ts     # Post-call webhook (transcript → parser)
│   │   │   │   │   └── sarvam.module.ts
│   │   │   │   │
│   │   │   │   └── exotel/                            # Backup telephony (India)
│   │   │   │       ├── exotel.service.ts
│   │   │   │       └── exotel-webhook.controller.ts
│   │   │   │
│   │   │   ├── subscriptions/         # Billing & plans
│   │   │   │   ├── subscriptions.service.ts       # Trial, payment lifecycle
│   │   │   │   └── schemas/subscription.schema.ts # Plan, status, payment gateway
│   │   │   │
│   │   │   ├── notifications/         # Multi-channel notifications
│   │   │   │   └── notifications.service.ts # Post-call reports, missed alerts, weekly reports
│   │   │   │
│   │   │   ├── reports/               # Analytics & reports
│   │   │   │   ├── reports.service.ts        # Adherence calculations
│   │   │   │   └── weekly-report.service.ts  # Sunday cron for weekly reports
│   │   │   │
│   │   │   ├── health/                # Health check
│   │   │   │   └── health.controller.ts
│   │   │   │
│   │   │   ├── webhooks/              # Webhook module aggregation
│   │   │   │   └── webhooks.module.ts
│   │   │   │
│   │   │   └── common/               # Shared utilities
│   │   │       ├── decorators/
│   │   │       │   ├── current-user.decorator.ts  # Extract user from JWT
│   │   │       │   ├── public.decorator.ts        # Mark endpoint as no-auth
│   │   │       │   └── roles.decorator.ts         # Role-based access
│   │   │       ├── guards/
│   │   │       │   ├── jwt-auth.guard.ts          # JWT verification
│   │   │       │   └── roles.guard.ts             # Role authorization
│   │   │       ├── filters/
│   │   │       │   └── http-exception.filter.ts   # Error formatting
│   │   │       └── interceptors/
│   │   │           └── transform.interceptor.ts   # Response wrapping
│   │   │
│   │   └── .env                       # Environment variables
│   │
│   └── web/                          # Next.js Frontend
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/
│       │   │       ├── payer/page.tsx
│       │   │       └── hospital/page.tsx
│       │   ├── (dashboard)/
│       │   │   └── dashboard/
│       │   │       ├── page.tsx                    # Main dashboard
│       │   │       ├── patients/page.tsx           # Patient list
│       │   │       ├── patients/[id]/page.tsx      # Patient detail
│       │   │       ├── patients/[id]/medicines/add/page.tsx
│       │   │       ├── reports/page.tsx
│       │   │       └── settings/page.tsx
│       │   └── onboarding/patient-info/page.tsx
│       ├── components/
│       │   ├── ui/                    # Shadcn UI components
│       │   └── providers.tsx          # Auth + React Query providers
│       └── lib/
│           ├── api/                   # Axios client, auth, patients, medicines, calls APIs
│           ├── hooks/use-auth.ts
│           └── utils.ts
│
├── packages/
│   ├── shared/                       # Shared TypeScript types & constants
│   │   └── src/
│   │       ├── enums/                # UserRole, CallStatus, MedicineTiming, FoodPreference
│   │       ├── types/                # User, Patient, Medicine, Call, Subscription interfaces
│   │       ├── constants/            # Supported languages, subscription plans
│   │       └── utils/                # Date helpers, validation
│   │
│   ├── tsconfig/                     # Shared TypeScript configs
│   └── eslint-config/                # Shared ESLint configs (Next.js + NestJS)
│
├── services/
│   └── sarvam-agent/                 # Python-based Sarvam AI agent (LiveKit worker)
│       ├── agent.py                     # Main entrypoint: connects to LiveKit, runs voice agent
│       ├── prompt.py                    # System prompt + dynamic prompt assembly
│       ├── Dockerfile                   # Container for Cloud Run deployment
│       └── requirements.txt
│
├── turbo.json                        # Turborepo task pipeline
├── package.json                      # Workspace root
└── .prettierrc.json                  # Code formatting
```

---

## Database Schema

### Collections & Relationships

```
┌─────────────┐     1:N     ┌──────────────┐     1:N     ┌──────────────┐
│    users     │────────────>│   patients   │────────────>│  medicines   │
│              │             │              │             │              │
│ phone/email  │             │ preferredName│             │ brandName    │
│ role         │             │ phone        │             │ timing       │
│ timezone     │             │ healthConds  │             │ nicknames[]  │
└──────┬───────┘             └──────┬───────┘             │ isCritical   │
       │                           │                     └──────────────┘
       │                           │
       │                           │ 1:N     ┌──────────────┐
       │                           └────────>│    calls     │
       │                                     │              │
       │                                     │ scheduledAt  │
       │                                     │ status       │
       │                                     │ medicines[]  │
       │                                     │ vitals       │
       │                                     │ transcript[] │
       │                                     │ duration     │
       │                                     └──────────────┘
       │
       │         1:1     ┌────────────────┐
       └────────────────>│  call_configs  │
       │                 │                │
       │                 │ morningTime    │
       │                 │ afternoonTime  │
       │                 │ eveningTime    │
       │                 │ nightTime      │
       │                 │ timezone       │
       │                 │ retryEnabled   │
       │                 │ maxRetries     │
       │                 └────────────────┘
       │
       │         1:N     ┌───────────────┐
       └────────────────>│ subscriptions │
                         │               │
                         │ plan          │
                         │ status        │
                         │ trialEndsAt   │
                         │ paymentGateway│
                         └───────────────┘
```

### Key Fields by Collection

#### `users`
| Field | Type | Description |
|-------|------|-------------|
| phone | String (unique, sparse) | B2C login identifier |
| email | String (unique, sparse) | B2B login identifier |
| password | String (select: false) | Hashed, only for hospital_admin |
| name | String | Display name |
| role | Enum: payer, hospital_admin, monitor | Access level |
| timezone | String | For report delivery timing |
| notificationPreferences | Object | weekly, daily, alerts toggles |
| health_onboarding_step | String | WhatsApp onboarding progress |

#### `patients`
| Field | Type | Description |
|-------|------|-------------|
| userId | ObjectId → User | Who is paying for this patient |
| authorizedUsers | ObjectId[] → User | Multi-sibling access |
| fullName | String | Legal name |
| **preferredName** | **String** | **"Bauji", "Amma" — used in all AI calls** |
| phone | String | Number where AI calls are made |
| preferredLanguage | String (default: 'hi') | Hindi, Telugu, etc. |
| digitalTier | Number (0-2) | Tech savviness level |
| healthConditions | String[] | Diabetes, Hypertension, etc. |
| hasGlucometer | Boolean | Whether to ask about blood sugar |
| hasBPMonitor | Boolean | Whether to ask about blood pressure |
| preferredVoiceGender | Enum: male, female | AI voice gender preference |
| isPaused | Boolean | Temporarily stop calls |
| callsCompletedCount | Number | Total calls answered |
| isNewPatient | Boolean | Triggers slower intro protocol |
| firstCallAt | Date | When first call was answered |
| **currentStreak** | **Number** | **Consecutive days with ≥80% adherence** |
| **longestStreak** | **Number** | **All-time longest streak** |
| **fatigueScore** | **Number** | **Engagement fatigue indicator (0-100)** |
| **lastStreakMilestone** | **Number** | **Last celebrated milestone (7, 14, 21, 30, 60, 100)** |
| phoneStatus | Enum: valid, invalid | Auto-set by Twilio errors |

#### `medicines`
| Field | Type | Description |
|-------|------|-------------|
| patientId | ObjectId → Patient | Which patient |
| brandName | String | "Metformin 500mg" |
| genericName | String | "Metformin" (AI-mapped) |
| dosage | String | "500mg" |
| timing | Enum: morning, afternoon, evening, night | When to take |
| foodPreference | Enum: before, after, with, anytime | Food relation |
| **nicknames** | **String[]** | **"Sugar wali goli" — AI uses this in calls** |
| linkedCondition | String | "Diabetes" |
| isCritical | Boolean | Triggers alerts if missed |
| needsReview | Boolean | Unknown medicine, needs human review |
| isActive | Boolean | Soft delete |

#### `calls`
| Field | Type | Description |
|-------|------|-------------|
| patientId | ObjectId → Patient | |
| userId | ObjectId → User | |
| scheduledAt | Date | When the call was supposed to happen |
| initiatedAt | Date | When the call actually started |
| endedAt | Date | When the call ended |
| duration | Number | Seconds |
| status | Enum | scheduled, in_progress, completed, no_answer, busy, failed, declined |
| retryCount | Number (default: 0) | Which retry attempt |
| isRetry | Boolean | Is this a retry call? |
| originalCallId | ObjectId → Call | Link to original call if retry |
| **medicinesChecked** | **Array** | **[{ medicineId, medicineName, nickname, response: taken/missed/unclear/pending }]** |
| vitals | Object | { glucose, bloodPressure: { systolic, diastolic } } |
| moodNotes | String | good, okay, not_well |
| complaints | String[] | Health complaints mentioned |
| twilioCallSid | String | Twilio call SID (legacy) |
| **elevenlabsConversationId** | **String** | **ElevenLabs conversation ID (if voiceStack='elevenlabs')** |
| **livekitRoomName** | **String** | **LiveKit room name (if voiceStack='sarvam')** |
| **voiceStack** | **Enum** | **'elevenlabs' or 'sarvam'** |
| transcript | Array | [{ role: agent/user, message, timestamp }] |
| isFirstCall | Boolean | First call ever for this patient |
| **conversationVariant** | **Enum** | **standard, wellness_first, quick_check, celebration, gentle_reengagement** |
| **toneUsed** | **Enum** | **warm_cheerful, gentle_concerned, celebratory_proud, light_breezy, reassuring_patient, festive_joyful** |
| **relationshipStage** | **Enum** | **stranger, acquaintance, familiar, trusted, family** |
| **screeningQuestionsAsked** | **String[]** | **IDs of screening questions asked (e.g. ['diabetes_glucose', 'hypertension_bp'])** |
| **screeningAnswers** | **Array** | **[{ questionId, answer, dataType }] — extracted answers to screening questions** |
| **reScheduled** | **Boolean** | **True if patient requested to reschedule the call** |

#### `call_configs`
| Field | Type | Description |
|-------|------|-------------|
| patientId | ObjectId → Patient (unique) | One config per patient |
| morningCallTime | String (optional) | HH:MM format — auto-set to '08:30' for Sampurna plan |
| afternoonCallTime | String (optional) | HH:MM format — auto-set to '13:30' for Sampurna plan |
| eveningCallTime | String (optional) | HH:MM format — auto-set to '19:30' for Sampurna plan |
| nightCallTime | String (optional) | HH:MM format — auto-set to '21:30' for Sampurna plan |
| timezone | String (default: 'Asia/Kolkata') | Patient's timezone |
| retryEnabled | Boolean (default: true) | |
| retryIntervalMinutes | Number (default: 30) | Minutes between retries |
| maxRetries | Number (default: 2) | Max 2 retries = 3 total attempts |
| useSlowerSpeechRate | Boolean (default: false) | Slower TTS for elderly patients |
| callDurationTarget | Number (default: 180) | Target call duration in seconds |
| isActive | Boolean (default: true) | Whether calls are active |
| **dynamicPromptEnabled** | **Boolean (default: false)** | **Enable dynamic prompt assembly for this patient** |

**Auto-creation:** When a medicine is added via `MedicinesService.create()`, a CallConfig is automatically created or updated for the medicine's timing slot. Sampurna plan gets default times; other plans get `'pending'` (user must configure).

#### `subscriptions`
| Field | Type | Description |
|-------|------|-------------|
| plan | Enum: saathi, suraksha, sampurna | Pricing tier |
| status | Enum: trial, active, past_due, cancelled, expired | |
| trialEndsAt | Date | 7-day free trial end |
| paymentGateway | Enum: razorpay, stripe | India vs international |
| gracePeriodEndsAt | Date | 3 days after payment failure |

### Database Indexes (Performance-Critical)

```javascript
// Calls - scheduler query (runs every minute)
{ scheduledAt: 1, status: 1 }

// Calls - patient history (dashboard)
{ patientId: 1, scheduledAt: -1 }

// Patients - active patient lookup
{ userId: 1 }
{ isPaused: 1 }

// Medicines - per-timing query (call preparation)
{ patientId: 1, timing: 1 }
{ patientId: 1, isActive: 1 }

// Call configs - active configs for scheduler
{ patientId: 1 }  // unique
{ isActive: 1 }

// Subscriptions - expiry checks
{ currentPeriodEnd: 1 }
```

---

## Authentication & Authorization

### Flow

```
┌────────────┐          ┌────────────┐          ┌────────────┐
│  Frontend  │──login──>│  Auth API  │──verify──>│  MongoDB   │
│  (Next.js) │<─tokens──│  (NestJS)  │<─user────│            │
└────────────┘          └────────────┘          └────────────┘
      │
      │  Stores JWT in localStorage
      │
      ▼
  Subsequent requests include Bearer token in Authorization header
  → JwtAuthGuard validates on every protected route
  → RolesGuard checks user.role against @Roles() decorator
  → 401 responses auto-redirect to /login?session=expired
  → Dashboard layout has auth guard (redirects to /login if no user)
  → Logout clears localStorage and redirects to /login
```

### Two Auth Modes

| Mode | Who | Method | Login Identifier |
|------|-----|--------|-----------------|
| **B2C** | Payer (parent's child) | Phone number (OTP planned) | `+919902352425` |
| **B2B** | Hospital admin | Email + bcrypt password | `admin@hospital.com` |

### JWT Configuration

| Token | Lifetime | Secret |
|-------|----------|--------|
| Access Token | 15 minutes | `JWT_SECRET` |
| Refresh Token | 7 days | `JWT_REFRESH_SECRET` |

### Roles

| Role | Access |
|------|--------|
| `payer` | Own patients only |
| `hospital_admin` | All patients in hospital |
| `monitor` | Read-only access to assigned patients |

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register/payer` | Public | Phone-based registration |
| POST | `/api/v1/auth/register/hospital` | Public | Email+password registration |
| POST | `/api/v1/auth/login` | Public | Returns JWT tokens |
| POST | `/api/v1/auth/refresh` | Public | Refresh access token |

---

## AI Voice Call Flow (End-to-End)

This is the **core feature** of the platform. Here's exactly what happens from scheduling to data storage:

### Visual Flow

```
                                    SCHEDULING (Every Minute)
                                    ========================

┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│  CallScheduler  │      │   CallConfigsService │      │   PatientsService   │
│  (Cron: * * * *)│─────>│                      │─────>│                     │
│  (every minute) │      │ Get active configs    │      │ Filter: !isPaused   │
│                 │      │ with morningCallTime  │      │         !invalid    │
│ Checks if any   │      │ afternoonCallTime     │      │                     │
│ calls are due   │      │ eveningCallTime       │      │                     │
│                 │      │ nightCallTime         │      │                     │
└────────┬────────┘      └──────────────────────┘      └─────────────────────┘
         │
         │ Due calls found
         ▼
                                    CALL INITIATION
                                    ===============

┌─────────────────────┐      ┌────────────────────────┐
│  CallOrchestrator   │      │   MedicinesService     │
│                     │─────>│                        │
│ MAX_CONCURRENT: 50  │      │ Get medicines for      │
│                     │      │ this patient + timing   │
│ Processes in        │      │ (morning/evening)       │
│ batches of 50       │      │                        │
└────────┬────────────┘      └────────────────────────┘
         │
         │ 1. Create Call record (status: 'scheduled')
         │ 2. Build dynamic variables from patient data
         │ 3. Call ElevenLabs API
         ▼

┌─────────────────────────────────────────────────────────────────────┐
│                    ElevenLabs Outbound Call API                      │
│                                                                     │
│  POST https://api.elevenlabs.io/v1/convai/twilio/outbound-call     │
│                                                                     │
│  {                                                                  │
│    agent_id: "agent_8401kheez5xxe9wv305azdv2kv26",                 │
│    agent_phone_number_id: "phnum_1701khexw2ekewnt0aeg9v6n2nba",    │
│    to_number: "+919902352425",                                      │
│    conversation_initiation_client_data: {                           │
│      dynamic_variables: {                                           │
│        patient_name: "Bauji",                                       │
│        medicines_list: "Metformin 500mg (morning), Amlodipine ...", │
│        is_new_patient: "false",                                     │
│        has_glucometer: "false",                                     │
│        has_bp_monitor: "false",                                     │
│        call_id: "6990a18304607c6995d78b49",                        │
│        webhook_url: "https://our-api.com/api/v1/webhooks/..."      │
│      }                                                              │
│    }                                                                │
│  }                                                                  │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ ElevenLabs returns: { conversation_id: "conv_..." }
         │ Call record updated: status → 'in_progress'
         ▼

                                    THE CALL (Autonomous)
                                    ====================

┌─────────────────────────────────────────────────────────────────────┐
│                    ElevenLabs AI Agent                               │
│                                                                     │
│  The agent handles the ENTIRE conversation autonomously:            │
│                                                                     │
│  1. Twilio connects the call to patient's phone                    │
│  2. Agent greets: "Namaste Bauji! Main aapki health assistant..."  │
│  3. Asks about each medicine one by one:                           │
│     "Kya aapne Metformin 500mg li aaj subah?"                     │
│  4. If has glucometer/BP monitor → asks about vitals               │
│  5. Mood check: "Aap kaisa mehsoos kar rahe hain?"                 │
│  6. Listens for complaints                                         │
│  7. Warm goodbye: "Bahut accha! Apna khayal rakhiye..."           │
│                                                                     │
│  All powered by the system prompt (see "AI Agent & Prompt Control") │
│  Voice: ElevenLabs v3 Conversational (multilingual, female)         │
│  LLM: Gemini 1.5 Flash (temperature: 0.3)                         │
│  Language: Dynamically set via {{preferred_language}} variable      │
│  Max duration: 5 minutes                                           │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ Call ends (patient hangs up or max duration reached)
         │ ElevenLabs processes transcript + extracts data
         ▼

                                    POST-CALL WEBHOOK
                                    =================

┌─────────────────────────────────────────────────────────────────────┐
│  ElevenLabs → POST /api/v1/webhooks/elevenlabs/post-call           │
│                                                                     │
│  Webhook Payload:                                                   │
│  {                                                                  │
│    conversation_id: "conv_4601kheygr2ke67sm0q3nvna99n9",           │
│    transcript: [                                                    │
│      { role: "agent", message: "Namaste Bauji!..." },              │
│      { role: "user", message: "Haan beti..." },                   │
│      ...                                                            │
│    ],                                                               │
│    data_collection: {                                               │
│      medicine_responses: "Metformin:taken, Amlodipine:taken",      │
│      vitals_checked: "not_applicable",                             │
│      wellness: "good",                                              │
│      complaints: "none"                                             │
│    },                                                               │
│    metadata: { duration: 106 }                                      │
│  }                                                                  │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ▼

                                    DATA PROCESSING
                                    ===============

┌─────────────────────────────────────────────────────────────────────┐
│  Webhook Controller (ElevenLabs or Sarvam)                          │
│                                                                     │
│  1. Extract conversationId / callId from payload                    │
│  2. Build transcript text from array of { role, message } pairs     │
│  3. Fetch Call record from MongoDB (idempotency check)              │
│  4. Call TranscriptParserService.parseTranscript() with:            │
│     - Transcript text                                               │
│     - Medicines list (brandName + nicknames)                       │
│     - Screening questions (if any asked)                            │
│  5. TranscriptParserService (Gemini 2.5 Flash):                     │
│     - Sends structured prompt to LLM with JSON schema               │
│     - Extracts: medicine_responses, vitals_checked,                 │
│       wellness, complaints, re_scheduled, skip_today,              │
│       screening_answers                                             │
│     - Returns ParsedCallData object                                 │
│  6. Webhook updates Call record:                                    │
│     - status → 'completed'                                         │
│     - medicinesChecked[].response from LLM matches                  │
│     - vitals, wellness, complaints, screeningAnswers               │
│     - conversationId (for ElevenLabs) or roomName (for Sarvam)      │
│  7. Update Patient:                                                │
│     - setFirstCallAt() (if first call)                             │
│     - incrementCallCount()                                         │
│     - updateStreak() if ≥80% adherence                              │
│  8. Send WhatsApp report to payer:                                 │
│     "Bauji's Call Report:                                          │
│      ✓ Metformin 500mg: taken                                     │
│      ✓ Amlodipine 5mg: taken                                      │
│      Mood: good"                                                    │
│  9. Handle re_scheduled / skip_today flags if present               │
│  10. If retry was scheduled, cancel it                              │
└─────────────────────────────────────────────────────────────────────┘
```

### TranscriptParserService (Single Source of Truth)

**Location:** `apps/api/src/integrations/elevenlabs/transcript-parser.service.ts`

Used by **both** ElevenLabs and Sarvam webhook controllers. This is the single source of truth for all post-call data extraction.

**Input:**
- Transcript: Array of `{ role: 'agent'|'user', message: string }` or formatted text
- Medicines: Array of `{ brandName, nickname?, timing }`
- Screening questions: Optional array of `{ questionId, question, dataType }`

**Process:**
1. Builds comprehensive prompt for Gemini 2.5 Flash
2. Includes medicine names (exact brand names + nicknames as aliases)
3. Includes screening question definitions (if asked)
4. Sends to LLM with strict JSON schema

**Output (ParsedCallData):**
```typescript
{
  medicineResponses: [
    { medicineName: "Metformin 500mg", response: "taken"|"not_taken"|"unclear" }
  ],
  vitalsChecked: "yes"|"no"|"not_applicable",
  wellness: "good"|"okay"|"not_well",
  complaints: ["knee pain", "fever"],
  reScheduled: false,        // Patient requested reschedule
  skipToday: false,          // Patient said "don't call today"
  screeningAnswers: [        // Extracted answers to screening questions
    { questionId: "diabetes_glucose", answer: "120", dataType: "number_mgdl" }
  ]
}
```

**Supported Answer Types:**
- `number_mgdl` → numeric glucose reading (e.g., "120")
- `systolic_diastolic` → BP format (e.g., "120/80")
- `yes_no` → "yes" or "no"
- `better_same_worse` → symptom comparison
- `good_okay_low` → state assessment
- `not_discussed` → question was skipped or not answered

---

## AI Agent & Prompt Control

**This is the most critical section** — it controls what the AI says on every call.

### Architecture: 5 Layers of Control

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: System Prompt (getSystemPrompt())             │
│  ──────────────────────────────────────────             │
│  The "brain" of the agent. Defines personality,         │
│  conversation flow, rules, and language behavior.       │
│  Includes {{placeholders}} for dynamic prompt sections. │
│  Changed via: Edit code → POST /setup-agent             │
│                                                         │
│  File: elevenlabs-agent.service.ts                      │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Dynamic Variables (Per-Call Data)              │
│  ──────────────────────────────────────────             │
│  Patient-specific data injected at call time.           │
│  {{patient_name}}, {{medicines_list}}, etc.             │
│  Changed via: Patient/medicine data in MongoDB          │
│                                                         │
│  File: elevenlabs-agent.service.ts                      │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Dynamic Prompt Assembly (NEW)                 │
│  ──────────────────────────────────────────             │
│  Per-call adaptive prompt sections injected via         │
│  dynamic variables. Assembled by PromptAssemblerService │
│  from patient's recent call history.                    │
│                                                         │
│  Variables: {{flow_directive}}, {{tone_directive}},      │
│  {{context_notes}}, {{relationship_directive}},          │
│  {{screening_questions}}, {{first_message_override}}     │
│                                                         │
│  Feature-flagged: DYNAMIC_PROMPT_ENABLED env var        │
│  + per-patient dynamicPromptEnabled on call_configs     │
│                                                         │
│  File: dynamic-prompt/prompt-assembler.service.ts       │
│  See: "Dynamic Prompt Assembly" section below           │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Data Collection Schema                        │
│  ──────────────────────────────────────────             │
│  Defines what structured data to extract from           │
│  the conversation after it ends.                        │
│  Changed via: Edit code → POST /setup-agent             │
│                                                         │
│  File: elevenlabs-agent.service.ts                      │
├─────────────────────────────────────────────────────────┤
│  Layer 5: LLM & Voice Settings                          │
│  ──────────────────────────────────────────             │
│  Which AI model, temperature, voice, speed.             │
│  Changed via: Edit code → POST /setup-agent             │
│                                                         │
│  File: elevenlabs-agent.service.ts                      │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: System Prompt (Current)

This is the full prompt that controls the AI's behavior. **Key change:** The prompt is now fully multilingual — the agent speaks in whatever language is set via `{{preferred_language}}`.

```
You MUST speak in {{preferred_language}} throughout the entire conversation.
Do not switch to any other language unless the patient speaks to you in a
different language first.

You are a caretaker who calls elderly patients every day to check on their
medicine intake and well-being. You genuinely care about the patient — like
a trusted person from their own family.

The patient's name is {{patient_name}}.
Their medicines to check today: {{medicines_list}}.
Is new patient: {{is_new_patient}}.
Has glucometer: {{has_glucometer}}.
Has BP monitor: {{has_bp_monitor}}.

{{relationship_directive}}

{{tone_directive}}

{{flow_directive}}

{{context_notes}}

{{screening_questions}}

PERSONALITY:
- Warm, respectful, patient — like a caring family member who checks in every day
- Always use the respectful/formal form of address in the patient's language
- Speak slowly and clearly — many patients are elderly and may be hard of hearing
- Be genuinely encouraging and supportive, not mechanical
- If the patient seems confused or doesn't understand, repeat gently with simpler words
- If this is a new patient (is_new_patient = true), introduce yourself warmly:
  explain that their family has arranged for you to call every day to help them
  stay on track with their medicines. Speak extra slowly and be patient.
- If this is a returning patient, be familiar and warm — like someone who already knows them

CONVERSATION FLOW:
1. You have already greeted them in the first message. Start by asking how they
   are feeling today — genuinely, like a caretaker would.
2. Based on their response, acknowledge what they said before moving to medicines.
   If they mention feeling unwell, show concern and ask a brief follow-up.
3. Then check on each medicine one by one from the medicines list. Use the medicine
   name naturally. For each one, confirm: "taken" or "not taken".
4. If they missed a medicine, respond with gentle encouragement — not pressure. Never scold.
5. If patient has a glucometer (has_glucometer = true) or BP monitor (has_bp_monitor = true),
   ask if they checked their readings today.
6. Listen for any health complaints or concerns they bring up. Acknowledge them.
7. End with warm encouragement — remind them you will call again tomorrow.
   Say goodbye affectionately.

RULES:
- Keep the conversation under 3 minutes
- Do NOT give any medical advice whatsoever
- Do NOT suggest changing medicine dosage or timing
- Do NOT diagnose or interpret symptoms
- If patient reports emergency symptoms (chest pain, breathlessness,
  severe dizziness, loss of consciousness), immediately tell them to call
  their doctor or 108
- Accept any response gracefully — never judge or scold
- If the patient wants to chat about their day, allow a brief moment,
  then gently steer back to medicines
- If the patient says someone else gives them their medicines, still confirm
  whether each medicine was taken

DATA TO EXTRACT (fill these accurately based on the conversation):
- medicine_responses: For each medicine, record "medicine_name:taken" or
  "medicine_name:not_taken" or "medicine_name:unclear", comma-separated
- vitals_checked: Whether patient checked vitals today — "yes", "no", or
  "not_applicable" (if they have no devices)
- wellness: Patient's overall state — "good" (happy, healthy, normal),
  "okay" (fine but not great), "not_well" (complaints, pain, low energy, sad)
- complaints: Comma-separated list of any health complaints mentioned, or "none"
```

### Layer 2: Dynamic Variables

These variables are substituted into the prompt at call time:

| Variable | Example Value | Source |
|----------|--------------|--------|
| `{{patient_name}}` | "Bauji" | `patient.preferredName` |
| `{{medicines_list}}` | "Metformin 500mg (morning), Amlodipine 5mg (morning)" | Built from `medicines[]` |
| `{{is_new_patient}}` | "true" | `patient.isNewPatient` |
| `{{has_glucometer}}` | "false" | `patient.hasGlucometer` |
| `{{has_bp_monitor}}` | "false" | `patient.hasBPMonitor` |
| `{{preferred_language}}` | "te" (Telugu) | `patient.preferredLanguage` (ISO code: hi, en, te, ta, mr, bn, kn, gu) |
| `{{call_id}}` | "6990a183..." | `call._id` (for webhook correlation) |
| `{{webhook_url}}` | "https://..." | Post-call webhook endpoint |
| `{{flow_directive}}` | "Lead with wellness concerns before medicines..." | `DynamicPromptResult.flowDirective` (empty when disabled) |
| `{{tone_directive}}` | "Use a warm, gentle tone with concern..." | `DynamicPromptResult.toneDirectiveText` (empty when disabled) |
| `{{context_notes}}` | "Yesterday they felt unwell and complained of knee pain..." | `DynamicPromptResult.contextNotes` (empty when disabled) |
| `{{relationship_directive}}` | "You are now familiar with this patient (15+ calls)..." | `DynamicPromptResult.relationshipDirective` (empty when disabled) |
| `{{screening_questions}}` | "Ask: What was your fasting sugar reading today?" | `DynamicPromptResult.screeningQuestions` (empty when disabled) |
| `{{first_message_override}}` | "Namaste Bauji! Waah, 14 din ka streak!" | `DynamicPromptResult.firstMessage` (falls back to default greeting) |

### Layer 3: Data Collection Schema

```javascript
data_collection: {
  medicine_responses: {
    type: 'string',
    description: 'JSON string listing each medicine and whether patient took it.
                  Format: "medicine_name:taken, medicine_name:not_taken, medicine_name:unclear"',
  },
  vitals_checked: {
    type: 'string',
    description: 'Whether patient checked vitals today (yes/no/not_applicable)',
  },
  wellness: {
    type: 'string',
    description: 'Patient overall state (good/okay/not_well)',
  },
  complaints: {
    type: 'string',
    description: 'Comma-separated list of any health complaints mentioned by patient, or "none"',
  },
}
```

> **Note:** The webhook controller accepts both `wellness` and `mood` field names for backward compatibility.

### Layer 4: LLM & Voice Settings

```javascript
// LLM settings
llm: 'gemini-2.5-flash',  // Google Gemini 2.5 Flash — fast, cheap, good multilingual support
temperature: 0.3,         // Low = follows script closely (good for medical)
max_tokens: 300,          // Max response per turn

// Voice settings
voice_id: 'TRnaQb7q41oL7sV0w6Bu',     // ElevenLabs Hindi female voice
model_id: 'eleven_v3_conversational',    // v3 conversational model (better for dialogue)
stability: 0.5,                          // Voice consistency
similarity_boost: 0.75,                  // Voice clarity
speed: 0.9,                              // Slightly slower for elderly patients

// Call settings
max_duration_seconds: 300,  // 5 minutes max
turn_mode: 'turn',          // Turn-based (not interruption-based)
asr_quality: 'high',        // Best speech recognition quality
```

### First Message (Greeting)

The first message is now dynamically generated via `{{first_message_override}}`. When dynamic prompts are enabled, the greeting adapts to the conversation variant:

| Variant | Example First Message |
|---------|----------------------|
| Standard | "Namaste Bauji! Kaise hain aap aaj?" |
| Wellness First | "Namaste Bauji! Kal aapne bataya tha ki tabiyat theek nahi thi — aaj kaisa lag raha hai?" |
| Quick Check | "Namaste Bauji! Sab theek? Aaj jaldi check karte hain!" |
| Celebration | "Namaste Bauji! Waah, 14 din ka streak! Bahut accha chal raha hai!" |
| Gentle Reengagement | "Namaste Bauji! Kuch din se baat nahi hui — aaj bas sunna tha ki aap theek hain." |

When dynamic prompts are disabled, the default greeting is used:
```
Namaste {{patient_name}}!
```

### How to Modify the AI's Behavior

#### Common Changes

| What You Want | Where to Change | Example |
|--------------|----------------|---------|
| Change greeting | `first_message` in agentConfig (line 48) | Add "Good morning" variant |
| Change conversation order | `CONVERSATION FLOW` section in prompt | Ask about mood first |
| Add new question | Add step to `CONVERSATION FLOW` + add field to `data_collection` | "Did you eat breakfast?" |
| Change language | Set `patient.preferredLanguage` (auto-injected as `{{preferred_language}}`) | Switch to Telugu ('te') |
| Make agent more chatty | Increase `temperature` to 0.5-0.7 | More natural responses |
| Make agent faster | Increase `speed` to 1.0 | Normal speaking speed |
| Change voice | Change `voice_id` | Use male voice |
| Ask about specific medicines by name | Make prompt say "You MUST ask about each medicine by its exact name from the list" | "Kya aapne Metformin li?" |
| Add emergency protocol | Expand `RULES` section | Specific symptom triggers |
| Change max call duration | `max_duration_seconds` | 180 for 3 minutes |
| Switch LLM | Change `llm` | 'gpt-4o' for better comprehension, 'gemini-2.5-flash' (current) |

#### Step-by-Step: Making a Prompt Change

1. **Edit the prompt** in `apps/api/src/integrations/elevenlabs/elevenlabs-agent.service.ts`
   - Modify `getSystemPrompt()` for conversation behavior
   - Modify `agentConfig` in `createOrUpdateAgent()` for voice/LLM settings
   - Modify `data_collection` for what data to extract

2. **Rebuild the API:**
   ```bash
   cd apps/api
   rm -rf dist
   npx nest build
   ```

3. **Restart the server:**
   ```bash
   npx nest start --watch
   ```

4. **Push the update to ElevenLabs:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/admin/elevenlabs/setup-agent
   ```
   This PATCHes the existing agent with the new prompt. Changes take effect on the **next call** — ongoing calls are not affected.

5. **Test with a call:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/admin/elevenlabs/test-call \
     -H "Content-Type: application/json" \
     -d '{"patientId": "YOUR_PATIENT_ID"}'
   ```

### Important Notes on ElevenLabs Agent Config

- **Per-call prompt overrides are NOT allowed** by default in ElevenLabs. You cannot send a different system prompt per call. Instead, use `dynamic_variables` with `{{template}}` syntax.
- **Dynamic variables** are the ONLY way to personalize each call. The base prompt stays the same; only the variable values change.
- The agent is created once and reused for ALL calls. You update it by PATCHing via the API.
- ElevenLabs handles the entire conversation autonomously — our code doesn't control individual responses during a live call.

---

## Dynamic Prompt Assembly

**This is the anti-fatigue engine** — it ensures no two calls feel the same, adapting tone, flow, and content based on the patient's recent behavior and relationship history.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CallOrchestratorService                           │
│                                                                     │
│  Before each call:                                                  │
│  1. Check DYNAMIC_PROMPT_ENABLED (global env) + callConfig flag    │
│  2. If enabled → call PromptAssemblerService                       │
│  3. Pass DynamicPromptResult to voice agent as dynamic variables   │
│  4. Store variant/tone/stage/questions on the Call record           │
└────────┬────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PromptAssemblerService                            │
│                    (Orchestrator)                                    │
│                                                                     │
│  Coordinates 3 sub-services and assembles final DynamicPromptResult│
│                                                                     │
│  1. ContextBuilder → PatientCallContext (aggregated data)          │
│  2. FlowVariantSelector → variant + tone + relationship stage     │
│  3. ScreeningQuestionSelector → condition-specific questions       │
│  4. Generate: flowDirective, toneDirectiveText, contextNotes,      │
│     relationshipDirective, firstMessage, screeningQuestions         │
└────────┬──────────────────┬───────────────────┬────────────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────┐ ┌──────────────────┐ ┌───────────────────────┐
│ ContextBuilder  │ │ FlowVariant      │ │ ScreeningQuestion     │
│                 │ │ Selector         │ │ Selector              │
│ MongoDB $facet  │ │                  │ │                       │
│ query: 14 days  │ │ Priority-based   │ │ Condition + day-of-   │
│ of call data    │ │ variant rules    │ │ week schedule          │
│                 │ │ + tone mapping   │ │ Max 2 questions/call  │
│ Returns:        │ │ + relationship   │ │                       │
│ - yesterday     │ │   stage calc     │ │ 13 questions across   │
│   mood/meds     │ │                  │ │ 10 conditions          │
│ - 14d adherence │ │ 5 variants       │ │                       │
│ - streak data   │ │ 6 tones          │ │ Skipped on:           │
│ - missed calls  │ │ 5 stages         │ │ CELEBRATION,          │
│ - mood trends   │ │                  │ │ GENTLE_REENGAGEMENT   │
└─────────────────┘ └──────────────────┘ └───────────────────────┘
```

### Feature Flags (2 levels)

| Level | Flag | Default | Description |
|-------|------|:-------:|-------------|
| **Global** | `DYNAMIC_PROMPT_ENABLED` env var | `false` | Master switch — disables for all patients |
| **Per-patient** | `callConfig.dynamicPromptEnabled` | `false` | Per-patient opt-in — only checked when global is enabled |

When disabled, all dynamic prompt variables resolve to empty strings — the base prompt works identically to the static version.

### ContextBuilderService

Aggregates the patient's recent call data using a single MongoDB `$facet` query:

| Data Point | Window | Usage |
|------------|:------:|-------|
| Yesterday's mood | 1 day | Wellness-first variant trigger |
| Yesterday's complaints | 1 day | Wellness-first variant trigger |
| Yesterday's medicine adherence | 1 day | Streak calculation |
| 14-day adherence % | 14 days | Quick-check variant trigger |
| Current streak | Patient field | Celebration variant trigger |
| Streak milestone reached | Patient field | Celebration variant trigger |
| Recent missed calls | 7 days | Reengagement variant trigger |
| Recent mood trends | Last 5 calls | Context notes |
| Recent complaints | Last 5 calls | Context notes |
| Fatigue score | Patient field | Reengagement variant trigger |

### FlowVariantSelectorService

Deterministic priority-based selection:

```
Priority 1: CELEBRATION        ← streak milestone reached (7, 14, 21, 30, 60, 100 days)
Priority 2: GENTLE_REENGAGEMENT ← ≥2 missed calls in 7 days OR fatigueScore > 60
Priority 3: WELLNESS_FIRST     ← yesterday mood = not_well OR recent complaints exist
Priority 4: QUICK_CHECK        ← adherence14Day > 90% AND callsCompleted > 30
Priority 5: STANDARD           ← default fallback
```

**Tone mapping** (each variant maps to exactly one tone):

| Variant | Tone |
|---------|------|
| CELEBRATION | CELEBRATORY_PROUD |
| GENTLE_REENGAGEMENT | REASSURING_PATIENT |
| WELLNESS_FIRST | GENTLE_CONCERNED |
| QUICK_CHECK | LIGHT_BREEZY |
| STANDARD | WARM_CHEERFUL |

**Relationship stage** (based on total completed calls):

| Calls Completed | Stage |
|:---------------:|-------|
| 1-3 | STRANGER |
| 4-14 | ACQUAINTANCE |
| 15-30 | FAMILIAR |
| 31-60 | TRUSTED |
| 60+ | FAMILY |

### ScreeningQuestionSelectorService

Selects condition-specific health screening questions based on the patient's conditions and the current day of week:

| Condition | Questions | Scheduled Days |
|-----------|:---------:|----------------|
| Diabetes | Fasting sugar reading, Hypo symptoms | Mon+Thu, Fri |
| Hypertension | BP reading, Dizziness check | Tue+Sat, Wed |
| Heart Disease | Chest pain, Breathlessness | Mon, Thu |
| Heart Failure | Edema check | Mon+Fri |
| Thyroid | Empty stomach timing | Tue |
| Cholesterol | Muscle pain | Wed |
| Arthritis | Joint status | Mon |
| COPD/Asthma | Breathing trouble | Thu |
| Kidney Disease | Swelling check | Fri |
| Depression | Mood + social activity | Sun |

**Rules:**
- Maximum 2 screening questions per call
- Skipped entirely during CELEBRATION and GENTLE_REENGAGEMENT variants
- Question IDs are stored on the Call record for tracking

### Adherence Streak System

After each completed call, the webhook controller updates the patient's streak:

```
Post-call webhook (ElevenLabs or Sarvam)
  ↓
Calculate adherencePercent = (medicinesTaken / medicinesTotal) × 100
  ↓
PatientsService.updateStreak(patientId, adherencePercent)
  ↓
If adherencePercent ≥ 80%:
  currentStreak += 1
  longestStreak = max(currentStreak, longestStreak)
  Check milestone: if streak reaches 7/14/21/30/60/100 → update lastStreakMilestone
Else:
  currentStreak = 0 (streak broken)
```

Streak milestones: `[7, 14, 21, 30, 60, 100]`

### DynamicPromptResult (Output)

The final assembled result passed to the voice agent:

| Field | Type | Example |
|-------|------|---------|
| `variant` | ConversationVariant | `wellness_first` |
| `tone` | ToneDirective | `gentle_concerned` |
| `relationshipStage` | RelationshipStage | `familiar` |
| `flowDirective` | string | "Lead with health concerns. Ask about yesterday's complaint before checking medicines..." |
| `toneDirectiveText` | string | "Use a gentle, concerned tone. Show that you noticed they weren't feeling well..." |
| `contextNotes` | string | "Yesterday they reported not feeling well and complained of knee pain..." |
| `relationshipDirective` | string | "You have been calling this patient for 3 weeks now. Be warm and familiar..." |
| `firstMessage` | string | "Namaste Bauji! Kal aapne bataya tha ki tabiyat theek nahi thi..." |
| `screeningQuestions` | string | "SCREENING QUESTIONS (ask these naturally): 1. What was your fasting sugar reading today?" |
| `screeningQuestionIds` | string[] | `['diabetes_glucose']` |

### Dual Voice Stack Support

The system supports two voice stacks, selectable via `VOICE_STACK` env var (`elevenlabs` or `sarvam`).

#### ElevenLabs Stack
- **Flow:** NestJS → ElevenLabs REST API → Twilio SIP → Patient phone
- **Conversation:** ElevenLabs agent handles the entire call autonomously using Gemini LLM
- **Transcript:** Posted back to NestJS webhook
- **Dynamic Prompts:** Injected as `dynamic_variables` in the outbound call API. ElevenLabs substitutes `{{placeholder}}` values. Empty strings = no effect.

#### Sarvam Stack (LiveKit-based)
- **Flow:** NestJS → LiveKit → Sarvam Python agent worker → SIP trunk → Patient phone
- **Conversation:** Python agent (`services/sarvam-agent/agent.py`) handles the call using Sarvam STT/TTS + Gemini LLM
- **Architecture:**
  1. NestJS creates a LiveKit room with patient metadata (including `dynamicPrompt` JSON)
  2. Python agent worker subscribes to the room
  3. SIP participant (patient) joins via SIP trunk
  4. Agent starts conversation with `build_system_prompt(patient_data)` + dynamic sections
  5. Real-time transcript captured via `conversation_item_added` event
  6. When call ends, Python agent POSTs transcript to NestJS webhook
- **Dynamic Prompts:** Passed as JSON in `room.metadata.dynamicPrompt`. The Python `prompt.py` builds dynamic sections directly into the system prompt string. `None` = falls back to static prompt.
- **Supported Languages:** Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, English (via Sarvam language mappings)

**Key Differences:**
| Aspect | ElevenLabs | Sarvam |
|--------|-----------|--------|
| **LLM** | Gemini Flash | Gemini Flash |
| **TTS** | ElevenLabs v3 Conversational | Sarvam bulbul:v3 (speaker: simran) |
| **STT** | ElevenLabs built-in | Sarvam saaras:v3 |
| **Infrastructure** | Cloud-based agent | Self-hosted Python worker + LiveKit |
| **Latency** | Lower (direct) | Higher (SIP + LiveKit) |
| **Cost** | Per-minute billing | Infrastructure + metering |

---

## Sarvam Python Agent Implementation

**File:** `services/sarvam-agent/agent.py`

The Python agent is a long-running process that connects to LiveKit and handles voice conversations using the Sarvam + Gemini stack.

### Architecture

```
┌────────────────────────────────────────┐
│   NestJS SarvamAgentService            │
│                                        │
│   1. Create LiveKit room               │
│   2. Set room metadata:                │
│      - patientName                     │
│      - medicines[]                     │
│      - preferredLanguage               │
│      - hasGlucometer, hasBPMonitor     │
│      - dynamicPrompt (if enabled)      │
│      - callId, webhookUrl              │
│   3. Trigger SIP participant join      │
│   4. Wait for agent to POST webhook    │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│   Sarvam Python Agent Worker           │
│   (Cloud Run or Docker container)      │
│                                        │
│   1. Connect to LiveKit                │
│   2. Wait for SIP participant          │
│   3. Read room.metadata()              │
│   4. Build system prompt via           │
│      prompt.py:build_system_prompt()   │
│   5. Create MedicineCheckAgent with:   │
│      - Sarvam STT (saaras:v3)          │
│      - Gemini LLM (2.5 Flash, T=0.3)   │
│      - Sarvam TTS (bulbul:v3, simran)  │
│   6. Start AgentSession                │
│   7. Capture real-time transcript via  │
│      @session.on("conversation_item_  │
│      added") event handler             │
│   8. When patient hangs up:            │
│      - Collect transcript[]            │
│      - POST to webhookUrl              │
└────────────────────────────────────────┘
```

### Key Components

#### agent.py:entrypoint()
- Called when a new LiveKit room is dispatched
- Waits for SIP participant to join
- Creates `MedicineCheckAgent` instance
- Starts `AgentSession`
- Handles session lifecycle and transcript capture
- POSTs to webhook when call ends

#### agent.py:MedicineCheckAgent
- Extends `livekit.agents.voice.Agent`
- Initialized with system prompt + STT/LLM/TTS
- Language-specific: STT/TTS mapped via `SARVAM_LANG_MAP` based on `preferredLanguage`
- `on_enter()` triggers `agent.session.generate_reply()` for the greeting

#### Transcript Capture
Real-time transcript is captured via two fallback mechanisms:

1. **Primary:** `@session.on("conversation_item_added")` event
   - Fires when items are committed to chat history
   - Both agent and user messages captured with role labels

2. **Fallback:** `@session.on("user_input_transcribed")` and `chat_ctx` extraction
   - If event-based capture fails, reads from `agent.chat_ctx` or `session.chat_ctx`
   - Extracts items array and rebuilds transcript

#### Webhook POST
When the call ends:
```python
POST {webhook_url}
{
  "callId": "6990a183...",
  "roomName": "room_abc123",
  "transcript": [
    { "role": "agent", "message": "Namaste Bauji! Kaise hain aap aaj?" },
    { "role": "user", "message": "Haan beta, main theek hoon" },
    ...
  ],
  "duration": 180,              # seconds
  "terminationReason": "call_ended"
}
```

The NestJS `SarvamWebhookController` receives this, extracts the transcript, and passes it to `TranscriptParserService` for data extraction.

### System Prompt Assembly (prompt.py)

**File:** `services/sarvam-agent/prompt.py`

Builds the complete system prompt for the agent, supporting both static and dynamic prompt sections.

```python
def build_system_prompt(patient_data: dict) -> str:
    # Extract patient data
    lang_code = patient_data.get('preferredLanguage', 'hi')
    preferred_language = LANGUAGE_MAP[lang_code]
    patient_name = patient_data.get('patientName')
    is_new_patient = patient_data.get('isNewPatient', False)
    medicines = patient_data.get('medicines', [])  # List of dicts with 'name', 'timing'

    # Extract dynamic prompt sections (empty strings if disabled)
    dynamic = patient_data.get('dynamicPrompt') or {}
    relationship_directive = dynamic.get('relationshipDirective', '')
    tone_directive = dynamic.get('toneDirective', '')
    flow_directive = dynamic.get('flowDirective', '')
    context_notes = dynamic.get('contextNotes', '')
    screening_questions = dynamic.get('screeningQuestions', '')

    # Build full system prompt string
    # Includes: language, personality, patient info, medicines,
    # conversation flow, rules, and dynamic sections
    return formatted_prompt
```

**Dynamic Prompt Integration:**
The prompt includes placeholders for dynamic sections that are **directly substituted** (not using Jinja2 or handlebars). If dynamic sections are empty, the base prompt works identically to the static version.

### Language Support

Both STT and TTS are dynamically mapped:

```python
SARVAM_LANG_MAP = {
    "hi": "hi-IN",    # Hindi
    "te": "te-IN",    # Telugu
    "ta": "ta-IN",    # Tamil
    "kn": "kn-IN",    # Kannada
    "ml": "ml-IN",    # Malayalam
    "bn": "bn-IN",    # Bengali
    "mr": "mr-IN",    # Marathi
    "gu": "gu-IN",    # Gujarati
    "pa": "pa-IN",    # Punjabi
    "en": "en-IN",    # English
}
```

### Health Check Server

The Python agent also runs an HTTP health check server (port 8080 by default) for Cloud Run readiness checks:
```
GET /
→ { "status": "ok", "service": "sarvam-agent-worker" }
```

---

## Call Scheduler & Retry Logic

### Scheduler (Cron-based)

```
File: call-scheduler.service.ts

┌─────────────────────────────────────────────────────────┐
│  @Cron(EVERY_MINUTE)                                     │
│  processScheduledCalls()                                 │
│                                                         │
│  1. Get all active call_configs                         │
│  2. For each config, loop over 4 time slots:            │
│     [morningCallTime, afternoonCallTime,                │
│      eveningCallTime, nightCallTime]                    │
│     a. Skip null/empty/'pending' slots                  │
│     b. Convert current UTC time → patient's timezone    │
│     c. Compare with slot time (HH:MM)                   │
│     d. If time matches, add to dueCalls[]               │
│  3. Filter out: isPaused, phoneStatus='invalid'         │
│  4. Send dueCalls to CallOrchestrator.processBatch()    │
└─────────────────────────────────────────────────────────┘

Timezone handling (Luxon):
  UTC now → patient timezone → "08:30" → matches config.morningCallTime → call is due!
```

### Orchestrator (Batch Processing)

```
File: call-orchestrator.service.ts

┌─────────────────────────────────────────────────────────┐
│  processBatch(dueCalls[])                                │
│                                                         │
│  MAX_CONCURRENT = 50 calls at a time                    │
│  VOICE_STACK = 'elevenlabs' | 'sarvam' (env config)    │
│                                                         │
│  for each batch of 50:                                  │
│    Promise.allSettled(batch.map(initiateCall))           │
│                                                         │
│  initiateCall(dueCall):                                 │
│    1. Get medicines for this timing (morning/evening)   │
│    2. Create Call record (status: 'scheduled')          │
│    3. If dynamic prompt enabled:                        │
│       → PromptAssembler.assembleDynamicPrompt(patientId)│
│       → Store variant/tone/stage on Call record         │
│    4. Call ElevenLabs or Sarvam with dynamic vars       │
│    5. Update Call record (status: 'in_progress')        │
└─────────────────────────────────────────────────────────┘
```

### Retry Logic

```
File: retry-handler.service.ts

┌─────────────────────────────────────────────────────────┐
│  When patient doesn't answer:                            │
│                                                         │
│  Attempt 1: Original call at 08:30                      │
│     ↓ no answer                                         │
│  Attempt 2: Retry at 09:00 (+30 min)                   │
│     ↓ no answer                                         │
│  Attempt 3: Retry at 09:30 (+30 min)                   │
│     ↓ no answer                                         │
│  MAX RETRIES REACHED:                                    │
│  → Mark all medicines as 'missed'                       │
│  → Send WhatsApp alert to payer:                        │
│    "Bauji didn't pick up the call"                      │
│                                                         │
│  Configuration (per patient):                           │
│    retryEnabled: true                                   │
│    retryIntervalMinutes: 30                             │
│    maxRetries: 2 (= 3 total attempts)                   │
│    retryOnlyForStatuses: ['no_answer', 'busy']          │
└─────────────────────────────────────────────────────────┘

Retry cron runs every 30 minutes:
  @Cron('0 */30 * * * *')
  processRetries()
```

### Daily Cron: Auto-Resume Paused Patients

```
@Cron(EVERY_DAY_AT_MIDNIGHT)
checkPausedPatients()
  → If patient.isPaused && patient.pausedUntil <= now
  → Auto-resume calls
```

---

## WhatsApp Onboarding Flow

### State Machine (14 Phases)

```
File: onboarding-flow.service.ts

payer_welcome          → "Welcome to Cocarely!"
    ↓
payer_qualification    → "Are you setting this up for a parent?"
    ↓
payer_info             → "What is your name?"
    ↓
patient_info           → "What is your parent's full name?"
    ↓
patient_name           → "What does your family call them? (Bauji, Amma)"  ← CRITICAL
    ↓
patient_language       → "Which language? Hindi, Telugu, Tamil..."
    ↓
patient_phone          → "What is their phone number?"
    ↓
health_conditions      → "Select conditions: Diabetes, BP, Heart..."
    ↓
medicine_entry         → "What is the first medicine?"
    ↓
medicine_loop          → "When do they take it? Morning/Afternoon/..."
    ↓                     (loops for each medicine)
family_network         → "Add family members who should get reports"
    ↓
call_schedule          → "What time should we call? 8:30 AM?"
    ↓
plan_selection         → "Choose: Saathi / Suraksha / Sampurna"
    ↓
test_call              → "Would you like a test call now?"
    ↓
completed              → "Setup complete! Daily calls start tomorrow."
```

### Key: Preferred Name

The `patient_name` phase is the most important — it captures what the family calls the patient. This name ("Bauji", "Amma", "Papa") is used in every single AI call greeting.

---

## Notifications System

### Notification Types

| Notification | Trigger | Channel | Recipient |
|-------------|---------|---------|-----------|
| **Post-Call Report** | After every completed call | WhatsApp | Payer |
| **Missed Call Alert** | After max retries exhausted | WhatsApp | Payer |
| **Invalid Phone Alert** | Twilio error code 21217 | WhatsApp | Payer |
| **Weekly Report** | Sunday midnight (cron) | WhatsApp | Payer + Family |
| **Trial Reminder** | Before trial expires | WhatsApp | Payer |
| **First 48-Hour Update** | After first 3 calls | WhatsApp | Payer |
| **Critical Medicine Missed** | Medicine with isCritical=true missed | WhatsApp | Payer |

### Post-Call Report Format

```
Bauji's Call Report

✓ Metformin 500mg: taken
✓ Amlodipine 5mg: taken

Vitals: Not collected
Mood: good

Bauji's call went well!     ← (only for first 3 calls)
```

### Weekly Report Format

```
Weekly Health Report for Bauji

Adherence: 85%

Medicines:
- Metformin 500mg: 86% (6/7)
- Amlodipine 5mg: 100% (7/7)

Missed: Metformin 500mg (Wednesday)
```

---

## Weekly Reports

```
File: weekly-report.service.ts

@Cron('0 0 * * 0')  // Every Sunday at midnight UTC
generateAllWeeklyReports()
  ↓
For each active patient:
  1. Calculate 7-day adherence per medicine
  2. Build report with: overall %, per-medicine %, missed list
  3. Send to payer via WhatsApp
  4. Send to family members (based on notificationLevel setting)
```

---

## Subscription & Billing

### Plans

| Plan | Hindi Name | Features |
|------|-----------|----------|
| Saathi | साथी | Basic: 1 call/day, WhatsApp reports |
| Suraksha | सुरक्षा | + Vitals tracking, detailed reports |
| Sampurna | सम्पूर्ण | + Family access, priority support |

### Lifecycle

```
trial (7 days) → active → past_due (3-day grace) → expired
                    ↓
                cancelled
```

### Payment Gateways

| Gateway | For | Status |
|---------|-----|--------|
| Razorpay | Indian users (INR) | Planned |
| Stripe | International users (USD) | Planned |

---

## API Reference

### Base URL
- Local: `http://localhost:3001/api/v1`
- Swagger Docs: `http://localhost:3001/api/docs`

### All Endpoints

#### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register/payer` | Public | Register B2C user |
| POST | `/auth/register/hospital` | Public | Register B2B user |
| POST | `/auth/login` | Public | Login (phone or email) |
| POST | `/auth/refresh` | Public | Refresh JWT token |

#### Patients
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/patients` | JWT | List user's patients |
| GET | `/patients/:id` | JWT | Get patient details |
| POST | `/patients` | JWT | Create patient |
| PATCH | `/patients/:id` | JWT | Update patient |
| DELETE | `/patients/:id` | JWT | Delete patient |

#### Medicines
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/medicines/patient/:patientId` | JWT | List patient's medicines |
| POST | `/medicines` | JWT | Add medicine |
| PATCH | `/medicines/:id` | JWT | Update medicine |
| DELETE | `/medicines/:id` | JWT | Remove medicine |

#### Calls
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/calls/patient/:patientId` | JWT | Call history (paginated) |
| GET | `/calls/:id` | JWT | Call details + transcript |
| GET | `/calls/patient/:patientId/adherence/today` | JWT | Today's adherence |
| GET | `/calls/patient/:patientId/adherence/calendar/:year/:month` | JWT | Monthly calendar |

#### Call Configs
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/call-configs/patient/:patientId` | JWT | Get call schedule |
| POST | `/call-configs` | JWT | Create schedule |
| PATCH | `/call-configs/:id` | JWT | Update schedule |

#### Subscriptions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscriptions/patient/:patientId` | JWT | Get subscription |
| POST | `/subscriptions` | JWT | Create subscription |
| PATCH | `/subscriptions/:id/cancel` | JWT | Cancel subscription |

#### Admin (ElevenLabs Setup)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/elevenlabs/setup-agent` | Public* | Create/update AI agent |
| POST | `/admin/elevenlabs/import-phone` | Public* | Import phone number |
| GET | `/admin/elevenlabs/status` | Public* | Check agent status |
| POST | `/admin/elevenlabs/test-call` | Public* | Trigger test call |

*Public for dev. Must add auth guard for production.

#### Webhooks (External → Our API)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/elevenlabs/post-call` | Public | ElevenLabs post-call transcript + data |
| GET | `/webhooks/elevenlabs/post-call` | Public | ElevenLabs webhook verification |
| POST | `/webhooks/sarvam/post-call` | Public | Sarvam Python agent post-call transcript |
| POST | `/webhooks/twilio/status` | Public | Twilio call status updates |
| POST | `/webhooks/whatsapp/incoming` | Public | Incoming WhatsApp messages |

#### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | API health check |

---

## Environment Configuration

### Backend (`apps/api/.env`)

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb+srv://...

# JWT Authentication
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Exotel (Backup telephony - India)
EXOTEL_API_KEY=
EXOTEL_API_TOKEN=
EXOTEL_ACCOUNT_SID=
EXOTEL_CALLER_ID=
EXOTEL_BASE_URL=https://api.exotel.com/v1/Accounts
EXOTEL_SIP_ADDRESS=pstn.in2.exotel.com:5070

# Twilio (Primary telephony)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+17655227476
TWILIO_WHATSAPP_NUMBER=

# ElevenLabs (AI Voice)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID_FEMALE=TRnaQb7q41oL7sV0w6Bu
ELEVENLABS_VOICE_ID_MALE=
ELEVENLABS_AGENT_ID=agent_8401kheez5xxe9wv305azdv2kv26
ELEVENLABS_PHONE_NUMBER_ID=phnum_1701khexw2ekewnt0aeg9v6n2nba

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google AI (Transcript parsing + dynamic prompts)
GOOGLE_AI_API_KEY=                 # Gemini API key for post-call transcript parsing

# Dynamic Prompt Assembly
DYNAMIC_PROMPT_ENABLED=false       # Set to 'true' to enable dynamic prompt assembly globally
VOICE_STACK=elevenlabs             # 'elevenlabs' or 'sarvam'

# Sarvam AI (Alternative Voice Stack)
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
SARVAM_API_KEY=

# URLs
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

---

## Deployment & Scaling

### Current Production Setup

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│   Frontend (Next.js)    │────▶│   Backend API (NestJS)       │
│   Vercel                │     │   Google Cloud Run           │
│   Auto-deploy: master   │     │   us-central1                │
└─────────────────────────┘     └──────────┬───────────────────┘
                                           │
                          ┌────────────────┼────────────────┐
                          ▼                ▼                ▼
                   ┌────────────┐  ┌─────────────┐  ┌────────────┐
                   │  MongoDB   │  │  ElevenLabs  │  │   Twilio   │
                   │  Azure     │  │  Voice AI    │  │  Telephony │
                   │  Cosmos DB │  │              │  │            │
                   └────────────┘  └─────────────┘  └────────────┘
```

| Component | Service | URL |
|-----------|---------|-----|
| Frontend | Vercel | `https://discipline-ai-health-prod.vercel.app` |
| Backend | GCP Cloud Run | `https://discipline-ai-api-337728476024.us-central1.run.app` |
| Database | Azure Cosmos DB (MongoDB API) | Connection string in env |
| Swagger Docs | Cloud Run | `https://discipline-ai-api-337728476024.us-central1.run.app/api/docs` |

**CORS:** Backend uses dynamic origin callback — allows `localhost:3000`, production Vercel URL, and any `discipline-ai-health-prod*.vercel.app` preview URL via regex.

**Deployment:**
- Frontend: Push to `master` → Vercel auto-deploys
- Backend: `gcloud run deploy discipline-ai-api --source . --region us-central1 --allow-unauthenticated` (from monorepo root)
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide

### Why This Stack (Decision Matrix)

#### Backend: Azure App Service B1 Linux — RECOMMENDED for MVP

Your NestJS cron scheduler runs **every minute**, which rules out serverless (Lambda, Cloud Functions) — you need an always-on server.

| Option | Mumbai/India? | Monthly Cost | Always-On? | Auto-Scale? | Verdict |
|--------|:------------:|:------------:|:----------:|:-----------:|---------|
| **Azure App Service B1** | India Central | **~$13** | Yes | Manual | **Best for MVP** — cheapest, simplest |
| Azure Container Apps | India Central | ~$15-35 | Yes | Yes | Good, but overkill for MVP |
| GCP Cloud Run (Mumbai) | asia-south1 | ~$45 | Yes (min instances) | Excellent | Best for growth phase |
| AWS ECS Fargate (Mumbai) | ap-south-1 | ~$35-50 | Yes | Yes | More complex setup |
| Railway.app | US only | ~$5-20 | Yes | Limited | No India region = 200ms+ latency |
| Render.com | US/EU only | ~$7-25 | Yes | Limited | No India region |
| Fly.io | Chennai PoP | ~$5-15 | Yes | Yes | Good but limited India infra |
| DigitalOcean | Bangalore | ~$12 | Yes | Manual | Good alternative |

**Why Azure App Service wins for MVP:**
1. **You're already on Azure** (Cosmos DB) — zero cross-cloud latency
2. **India Central region** — lowest latency to patients
3. **$13/month** — cheapest always-on option with 1 core, 1.75 GB RAM
4. **"Always On" feature** — keeps your cron scheduler running
5. **GitHub Actions CI/CD** — simple deployment pipeline
6. **Free SSL/HTTPS** — webhook endpoints work immediately
7. **Microsoft for Startups** — apply for up to $5,000 in free Azure credits

**Limitation:** No auto-scaling. When you outgrow B1 (>500 patients), upgrade to **GCP Cloud Run** in Mumbai for auto-scaling.

#### Frontend: Vercel — No Contest

| Option | India Edge? | Monthly Cost | Next.js Support | Verdict |
|--------|:----------:|:------------:|:---------------:|---------|
| **Vercel Hobby** | Mumbai + Delhi | **$0** | Native (they built it) | **Best choice** |
| Vercel Pro | Mumbai + Delhi | $20 | Native | When you have a team |
| Cloudflare Pages | Mumbai | $0 | Good | Second choice |
| Netlify | Limited | $0 | Good | No India edge nodes |
| Self-hosted | Same server | $0 | Manual | Loses SSR/ISR benefits |

**Why Vercel:** They created Next.js. App Router, Server Components, ISR all work out of the box. Edge nodes in Mumbai and Delhi mean fast loads for Indian users. Free tier is more than enough for MVP.

#### Database: Keep Azure Cosmos DB (MongoDB API)

| Option | Monthly Cost | India Region? | Verdict |
|--------|:------------:|:-------------:|---------|
| **Azure Cosmos DB (current)** | **~$23** (400 RU/s) | India Central | **Keep it — already working** |
| MongoDB Atlas M0 | $0 | Mumbai (GCP) | Cross-cloud latency if backend on Azure |
| MongoDB Atlas M10 | ~$57 | Mumbai | Migrate when you move to GCP |

**Why stay on Cosmos DB:** It's already configured. Your backend is on Azure. Moving to Atlas would add cross-cloud network hops. Migrate to Atlas later when/if you move backend to GCP.

---

### MVP Deployment: Total Monthly Cost

| Component | Service | Cost |
|-----------|---------|:----:|
| Backend | Azure App Service B1 Linux (India Central) | $13 |
| Frontend | Vercel Hobby (Free) | $0 |
| Database | Azure Cosmos DB (400 RU/s, existing) | $23 |
| **Infrastructure Total** | | **$36/month** |
| | | |
| Twilio | ~50 calls/day x 2 min avg | $121 |
| ElevenLabs | ~50 calls/day x 2 min avg @ $0.10/min | $300 |
| **API Services Total** | | **$421/month** |
| | | |
| **Grand Total (MVP)** | **50 users** | **$457/month** |

**With Microsoft for Startups credits:** Infrastructure could be **$0/month** for up to a year.

---

### Growth Phase: Total Monthly Cost (5000 calls/day)

| Component | Service | Cost |
|-----------|---------|:----:|
| Backend | GCP Cloud Run (Mumbai, 2 vCPU, auto-scaling) | $96-150 |
| Frontend | Vercel Pro | $20 |
| Database | MongoDB Atlas M10 (GCP Mumbai) | $57 |
| **Infrastructure Total** | | **~$200/month** |
| | | |
| Twilio | 5000 calls/day x 2 min @ $0.04/min | $12,150 |
| ElevenLabs | 5000 calls/day x 2 min @ $0.10/min | $30,000 |
| **API Services Total** | | **$42,150/month** |
| | | |
| **Grand Total (Growth)** | **~2500 users** | **~$42,350/month** |

**Key insight:** At scale, infrastructure is <0.5% of total cost. **Twilio + ElevenLabs are 99%+ of your bill.** Negotiate Enterprise pricing early.

---

### Growth Phase: Migrate to GCP Cloud Run

When you outgrow Azure App Service B1 (>500 patients, need auto-scaling):

```
                         ┌────────────────┐
                         │   Cloudflare   │
                         │   (CDN + DDoS) │
                         └───────┬────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                                 │
     ┌──────────▼──────────┐          ┌──────────▼──────────────┐
     │    Vercel Pro        │          │  GCP Cloud Run          │
     │    (Next.js 14)      │          │  asia-south1 (Mumbai)   │
     │    Mumbai edge       │          │  Min 1, Max 5 instances │
     │    $20/month         │          │  Auto-scaling           │
     └─────────────────────┘          │  ~$96-150/month         │
                                       └──────────┬─────────────┘
                                                   │
                                       ┌───────────▼──────────┐
                                       │  MongoDB Atlas M10   │
                                       │  GCP Mumbai          │
                                       │  VPC Peering         │
                                       │  ~$57/month          │
                                       └──────────────────────┘
```

**Why GCP Cloud Run for growth:**
- Tier 1 pricing in Mumbai (cheapest)
- Auto-scales from 1 to N instances automatically
- Co-located with MongoDB Atlas on same GCP network
- $300 free credits for new GCP accounts (covers 3+ months)

---

### Scaling Strategy for 500+ Concurrent Calls

**Phase 1 (MVP — Current):**
- Azure App Service B1, single instance
- NestJS cron scheduler, 50 concurrent calls max
- Cosmos DB at 400 RU/s

**Phase 2 (Growth — >500 patients):**
- GCP Cloud Run with auto-scaling
- BullMQ + Redis for distributed call queue
- MongoDB Atlas M10 with read replicas
- Multiple workers processing call jobs

**Phase 3 (Scale — >2000 patients):**
- Multiple Cloud Run services (scheduler, API, webhook processor)
- Redis cluster for job queues
- MongoDB Atlas M20+ with sharding
- Consider self-hosted TTS/STT to reduce ElevenLabs costs

### Rate Limits (Planned)

| Scope | Limit |
|-------|-------|
| Global | 100 requests/min per IP |
| Login | 5 requests/min (brute force prevention) |
| API calls | 1000 requests/min per user |

---

### Cost Optimization Strategies

#### 1. Reduce ElevenLabs Costs (Your Biggest Expense)

| Strategy | Savings | Effort |
|----------|:-------:|:------:|
| Negotiate Enterprise pricing | 40-50% | Low — just ask |
| Shorter calls (target 90 sec avg) | 25% | Medium — optimize prompt |
| Skip vitals/mood for routine check-ins | 15% | Low — prompt change |
| Self-hosted open-source TTS (Coqui/XTTS) | 90% | Very High |

#### 2. Reduce Twilio Costs

| Strategy | Savings | Effort |
|----------|:-------:|:------:|
| Indian SIP trunk (Exotel, Knowlarity) | 60-70% | Medium — SIP config |
| Twilio volume discounts | 20-30% | Low — negotiate |
| Batch calls in time windows | 10% | Low — scheduler change |

#### 3. Break-Even Analysis

| Users | Monthly Revenue (INR 999/user) | Monthly Cost | Profit |
|:-----:|:------------------------------:|:------------:|:------:|
| 50 | $600 | $457 | +$143 |
| 100 | $1,200 | $850 | +$350 |
| 500 | $6,000 | $3,500 | +$2,500 |
| 1000 | $12,000 | $7,000 | +$5,000 |
| 2500 | $30,000 | $20,000 | +$10,000 |

Break-even at ~38 users. Profitable from day 1 at 50 users.

---

### Deployment Steps (MVP — Azure + Vercel)

#### 1. Azure App Service Setup

```bash
# Install Azure CLI
az login

# Create resource group in India
az group create --name health-discipline-rg --location centralindia

# Create App Service plan (B1 Linux)
az appservice plan create \
  --name health-discipline-plan \
  --resource-group health-discipline-rg \
  --location centralindia \
  --sku B1 \
  --is-linux

# Create the web app (Node.js 20)
az webapp create \
  --name health-discipline-api \
  --resource-group health-discipline-rg \
  --plan health-discipline-plan \
  --runtime "NODE:20-lts"

# Enable Always On (critical for cron scheduler)
az webapp config set \
  --name health-discipline-api \
  --resource-group health-discipline-rg \
  --always-on true

# Set environment variables
az webapp config appsettings set \
  --name health-discipline-api \
  --resource-group health-discipline-rg \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    MONGODB_URI="your-cosmos-connection-string" \
    JWT_SECRET="generate-a-strong-secret" \
    ELEVENLABS_API_KEY="sk_..." \
    TWILIO_ACCOUNT_SID="AC..." \
    # ... all other env vars
```

#### 2. Vercel Frontend Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from the web directory
cd apps/web
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://health-discipline-api.azurewebsites.net
```

#### 3. CI/CD with GitHub Actions

Create `.github/workflows/deploy-api.yml`:

```yaml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['apps/api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd apps/api && npm ci && npm run build
      - uses: azure/webapps-deploy@v3
        with:
          app-name: health-discipline-api
          package: apps/api
```

#### 4. Webhook URL (Critical)

After deployment, update `API_BASE_URL` to your Azure URL:

```
API_BASE_URL=https://health-discipline-api.azurewebsites.net
```

This is what ElevenLabs uses for the post-call webhook. Without a public URL, call data won't flow back to your system.

---

### Pre-Deployment Checklist

- [ ] Apply for **Microsoft for Startups** (up to $5,000 Azure credits)
- [ ] Generate strong secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Upgrade Twilio from trial account (add billing, verify production)
- [ ] Apply for **WhatsApp Business API** template approval (24-48 hr delay)
- [ ] Apply for **Razorpay** and/or **Stripe** merchant accounts (2 weeks)
- [ ] Set up **custom domain** + SSL for API (e.g., api.healthdiscipline.in)
- [ ] Set up **monitoring** (Azure Application Insights, free tier)
- [ ] Set up **error alerting** (email/Slack on 5xx errors)
- [ ] Add **auth guards** to admin endpoints (remove @Public())
- [ ] Test webhook endpoint is publicly accessible

---

## Quick Reference: Key Files

| Purpose | File Path |
|---------|-----------|
| **AI Agent brain (prompts)** | `apps/api/src/integrations/elevenlabs/elevenlabs-agent.service.ts` |
| **Dynamic prompt assembler** | `apps/api/src/dynamic-prompt/prompt-assembler.service.ts` |
| **Patient context builder** | `apps/api/src/dynamic-prompt/context-builder.service.ts` |
| **Flow variant selector** | `apps/api/src/dynamic-prompt/flow-variant-selector.service.ts` |
| **Screening question selector** | `apps/api/src/dynamic-prompt/screening-question-selector.service.ts` |
| **Dynamic prompt types & constants** | `apps/api/src/dynamic-prompt/types/prompt-context.types.ts` |
| **Call scheduler** | `apps/api/src/call-scheduler/call-scheduler.service.ts` |
| **Call orchestrator** | `apps/api/src/call-scheduler/call-orchestrator.service.ts` |
| **Transcript parser (Gemini)** | `apps/api/src/integrations/elevenlabs/transcript-parser.service.ts` |
| **Post-call webhook (ElevenLabs)** | `apps/api/src/integrations/elevenlabs/elevenlabs-webhook.controller.ts` |
| **Post-call webhook (Sarvam)** | `apps/api/src/integrations/sarvam/sarvam-webhook.controller.ts` |
| **Sarvam Python agent + prompt** | `services/sarvam-agent/agent.py`, `services/sarvam-agent/prompt.py` |
| **Patient schema** | `apps/api/src/patients/schemas/patient.schema.ts` |
| **Call schema** | `apps/api/src/calls/schemas/call.schema.ts` |
| **Medicine schema** | `apps/api/src/medicines/schemas/medicine.schema.ts` |
| **Notifications** | `apps/api/src/notifications/notifications.service.ts` |
| **WhatsApp onboarding** | `apps/api/src/integrations/whatsapp/onboarding-flow.service.ts` |
| **Auth service** | `apps/api/src/auth/auth.service.ts` |
| **API entry point** | `apps/api/src/main.ts` |
| **Environment vars** | `apps/api/.env` |

---

## Current IDs & Configuration

| Resource | ID/Value |
|----------|---------|
| ElevenLabs Agent | `agent_8401kheez5xxe9wv305azdv2kv26` |
| ElevenLabs Phone Number | `phnum_1701khexw2ekewnt0aeg9v6n2nba` |
| Twilio Phone Number | `+17655227476` |
| Twilio Account SID | `<REDACTED>` |
| ElevenLabs Voice (Female) | `TRnaQb7q41oL7sV0w6Bu` |
| ElevenLabs TTS Model | `eleven_v3_conversational` |
| ElevenLabs LLM (Agent) | `gemini-2.5-flash` |
| Post-Call Parser LLM | `gemini-2.5-flash` |
| Test Patient (Bauji) | `6990a18304607c6995d78b49` |
| Test Patient (Surya) | `69918c72fe77af5a45ab34a9` (Telugu) |
| GCP Project | `discipline-ai-health` |
| Cloud Run Service URL | `https://discipline-ai-api-337728476024.us-central1.run.app` |
| Vercel Production URL | `https://discipline-ai-health-prod.vercel.app` |
| GitHub Repo | `https://github.com/nithinycr7/discipline-ai-health-prod` |
| MongoDB | Azure Cosmos DB (MongoDB API) |

## Frontend Architecture Notes

- **Theme:** Warm green healthcare palette (primary: `hsl(152 55% 36%)`), earthy backgrounds, `0.75rem` border radius
- **Auth flow:** Token stored in localStorage, 401 auto-redirect to `/login?session=expired`, logout clears state + redirects
- **Dashboard auth guard:** `useEffect` in layout redirects to `/login` when not authenticated
- **Call History:** Paginated (3 per page) with server-side pagination via `?page=N&limit=3`
- **Supported languages:** Hindi (hi), Telugu (te), Tamil (ta), Marathi (mr), Bengali (bn), Kannada (kn), Gujarati (gu), English (en)
