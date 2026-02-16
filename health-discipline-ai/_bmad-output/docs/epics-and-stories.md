# Epics & User Stories

## Health Discipline AI - MVP (Phase 1)

**Scrum Master:** AI-Generated from BRD v1.0
**Date:** 2026-02-14
**Sprint Cadence:** 2 weeks

---

## Epic Overview

| Epic | Name | Stories | Priority | Sprint Target |
|------|------|---------|----------|---------------|
| E-1 | Project Foundation & Auth | 5 | P0 | Sprint 1 |
| E-2 | Patient Onboarding (WhatsApp Flow) | 8 | P0 | Sprint 1-2 |
| E-3 | Medicine Management | 6 | P0 | Sprint 2 |
| E-4 | AI Voice Calling Engine | 9 | P0 | Sprint 3-4 |
| E-5 | Dashboard & Reporting | 7 | P0 | Sprint 4-5 |
| E-6 | Subscription & Billing | 5 | P1 | Sprint 5 |
| E-7 | Self-Service Controls | 4 | P1 | Sprint 6 |
| E-8 | First 48-Hour Experience | 4 | P0 | Sprint 6 |

**Total Stories: 48**

---

## E-1: Project Foundation & Auth

> **Goal:** Set up the Next.js project, MongoDB, and authentication system so payers and hospitals can create accounts.
> **BRD Refs:** FR-01, FR-02, FR-03

### Stories

**E1-S1: Project Setup & Database Connection**
- **As a** developer
- **I want** Next.js (frontend) and NestJS (backend) projects initialized with MongoDB connection
- **So that** all features have a working foundation
- **Acceptance Criteria:**
  - [ ] Next.js app created with App Router (frontend)
  - [ ] NestJS API project created (backend)
  - [ ] MongoDB Atlas connection configured via environment variables (from NestJS)
  - [ ] Frontend: `/app`, `/lib`, `/components`; Backend: modules, services, DTOs
  - [ ] Environment config for dev/staging/prod (see [technical-specification.md](technical-specification.md))
- **Story Points:** 3

**E1-S2: Payer Registration (B2C)**
- **As a** NRI child (payer)
- **I want to** create an account using my WhatsApp number
- **So that** I can set up health monitoring for my parent
- **Acceptance Criteria:**
  - [ ] WhatsApp number captured as primary identifier
  - [ ] User document created in `users` collection with role: `payer`
  - [ ] JWT-based authentication token generated
  - [ ] Duplicate phone number check
- **Story Points:** 5

**E1-S3: Hospital Registration (B2B)**
- **As a** hospital administrator
- **I want to** create an account via web portal with email/password
- **So that** I can manage patient medication tracking
- **Acceptance Criteria:**
  - [ ] Email + password registration via web form
  - [ ] User document created with role: `hospital_admin`
  - [ ] Password hashed with bcrypt
  - [ ] Email verification flow
- **Story Points:** 5

**E1-S4: Role-Based Access Control**
- **As a** system
- **I want** role-based access (payer vs hospital_admin)
- **So that** each user type sees only relevant features
- **Acceptance Criteria:**
  - [ ] Middleware checks user role on protected routes
  - [ ] B2C users see family dashboard; B2B users see hospital dashboard
  - [ ] API routes return 403 for unauthorized role access
- **Story Points:** 3

**E1-S5: Multi-Sibling Access**
- **As a** payer (NRI child)
- **I want to** invite my siblings to also view our parent's health data
- **So that** multiple family members can monitor together
- **Acceptance Criteria:**
  - [ ] Payer can share access via phone number invitation
  - [ ] Invited sibling gets `monitor` role for that patient
  - [ ] Configurable notification level per family member (weekly+alerts / daily)
  - [ ] Patient data visible to all authorized family members
- **Story Points:** 5

---

## E-2: Patient Onboarding (WhatsApp Flow)

> **Goal:** Build the 10-phase conversational onboarding flow so payers can set up their parents' profiles, medicines, and call schedules.
> **BRD Refs:** FR-04 to FR-11, Onboarding Phases 1-9

### Stories

**E2-S1: Payer Welcome & Qualification (Phases 1-2)**
- **As a** NRI child messaging our WhatsApp
- **I want to** be welcomed warmly and asked if I'm setting up for a parent
- **So that** the system understands my intent and collects my basic info
- **Acceptance Criteria:**
  - [ ] Welcome message describes product in one sentence + social proof
  - [ ] Yes/No qualifying question: "Are you setting up for a parent?"
  - [ ] Collect: payer name, location/timezone, relationship to patient
  - [ ] State transitions tracked: `payer_intro` -> `payer_info` -> `patient_info`
- **Story Points:** 5

**E2-S2: Patient Profile Creation (Phase 3)**
- **As a** payer
- **I want to** enter my parent's details including their preferred name
- **So that** the AI can address them personally in every call
- **Acceptance Criteria:**
  - [ ] Collect: full name, preferred name (e.g., "Bauji"), age
  - [ ] Language selection via buttons (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Gujarati, English)
  - [ ] Digital tier detection (WhatsApp / feature phone / no phone)
  - [ ] Patient phone number with validation (must differ from payer's)
  - [ ] Patient document created in `patients` collection
- **Story Points:** 8

**E2-S3: Health Conditions Capture (Phase 4)**
- **As a** payer
- **I want to** select my parent's health conditions
- **So that** the AI knows what to focus on during calls
- **Acceptance Criteria:**
  - [ ] Multi-select buttons: Diabetes, High BP, Heart Disease, Arthritis, Thyroid, Cholesterol, Other
  - [ ] Conditional follow-ups: glucometer question (if diabetes), BP monitor question (if hypertension)
  - [ ] "Other" triggers free-text input, flagged for review
  - [ ] Conditions stored in patient document
- **Story Points:** 3

**E2-S4: Medicine Entry - Manual Path (Phase 5)**
- **As a** payer
- **I want to** enter my parent's medicines one at a time with AI assistance
- **So that** the AI asks about the right medicines by the right name
- **Acceptance Criteria:**
  - [ ] One medicine at a time loop (not "how many?")
  - [ ] AI maps brand name to generic (e.g., "Telma 40" -> "Telmisartan 40mg for BP")
  - [ ] Collect per medicine: brand name, timing (morning/afternoon/evening/night), with food (before/after/with/anytime)
  - [ ] Collect medicine nickname: "What does [patient] CALL this medicine?"
  - [ ] "Add another" / "That's all" buttons
  - [ ] Unknown medicines stored as-is, flagged for 24hr human review
  - [ ] Medicine documents created in `medicines` collection
- **Story Points:** 13

**E2-S5: Family Network Setup (Phase 6)**
- **As a** payer
- **I want to** add other family members who should receive health updates
- **So that** siblings and local relatives can also monitor
- **Acceptance Criteria:**
  - [ ] Optional step: "Add family member" or "Skip, just me"
  - [ ] Collect per member: name, phone, relationship
  - [ ] Notification level: weekly+alerts (default) or daily
  - [ ] Family members stored with appropriate permissions
- **Story Points:** 5

**E2-S6: Call Schedule Configuration (Phase 7)**
- **As a** payer
- **I want to** set call times based on my parent's daily routine
- **So that** calls come at the right time for their medicine schedule
- **Acceptance Criteria:**
  - [ ] Ask about patient's routine: "When does [patient] wake up and have breakfast?"
  - [ ] Map routine to call time (e.g., 8:00-9:00 AM breakfast -> 8:30 AM call)
  - [ ] Morning + evening call times configured
  - [ ] Voice gender preference: female (recommended) or male
  - [ ] Call schedule document created in `callConfigs` collection
- **Story Points:** 5

**E2-S7: Test Call Execution (Phase 9)**
- **As a** payer
- **I want** the AI to place a test call to my parent during onboarding
- **So that** my parent hears the voice, gets introduced, and gives consent
- **Acceptance Criteria:**
  - [ ] "Place test call now" or "Schedule for later" options
  - [ ] AI calls patient in their preferred language using their preferred name
  - [ ] Call script: introduction, explain daily calls, ask for consent, mention family reports
  - [ ] Verbal consent captured and stored (DPDP Act compliance)
  - [ ] Payer notified of test call outcome
  - [ ] If patient doesn't answer: retry logic + ask payer to coordinate
  - [ ] If patient refuses: graceful handling, offer to retry next day
- **Story Points:** 13

**E2-S8: Onboarding State Machine**
- **As a** system
- **I want** a state machine tracking onboarding progress per user
- **So that** users can resume onboarding if they drop off mid-flow
- **Acceptance Criteria:**
  - [ ] `health_onboarding_step` field tracks current phase
  - [ ] Users can resume from where they left off
  - [ ] Incomplete onboardings flagged after 24 hours
  - [ ] All state transitions logged for analytics
- **Story Points:** 5

---

## E-3: Medicine Management

> **Goal:** Build the medicine database, AI-assisted mapping, and edit capabilities.
> **BRD Refs:** FR-12 to FR-20

### Stories

**E3-S1: Medicine Catalog / Knowledge Base**
- **As a** system
- **I want** a medicine catalog mapping brand names to generics
- **So that** AI can confirm "Telma 40 = Telmisartan 40mg for blood pressure"
- **Acceptance Criteria:**
  - [ ] Catalog of common Indian medicines (top 200+)
  - [ ] Brand name -> generic name -> condition mapping
  - [ ] Combination drug mapping (e.g., Telma-AM -> telmisartan + amlodipine)
  - [ ] Fuzzy matching for typos and variations
- **Story Points:** 8

**E3-S2: Medicine CRUD API**
- **As a** payer or hospital admin
- **I want** API endpoints to create, read, update, and delete medicines
- **So that** medicine lists can be managed programmatically
- **Acceptance Criteria:**
  - [ ] POST /api/patients/:id/medicines - Add medicine
  - [ ] GET /api/patients/:id/medicines - List medicines
  - [ ] PUT /api/patients/:id/medicines/:medId - Update medicine
  - [ ] DELETE /api/patients/:id/medicines/:medId - Remove medicine
  - [ ] Validation: required fields (name, timing, food preference)
- **Story Points:** 5

**E3-S3: Medicine Nickname System**
- **As a** system
- **I want** to store and use patient-specific medicine nicknames
- **So that** the AI voice agent uses the patient's own words during calls
- **Acceptance Criteria:**
  - [ ] `nicknames` array field per medicine document
  - [ ] Nickname used in AI call script generation
  - [ ] Editable by payer/hospital from dashboard
- **Story Points:** 3

**E3-S4: Medicine Schedule Engine**
- **As a** system
- **I want** to compute daily call schedules from medicine timing data
- **So that** the right medicines are checked at the right call times
- **Acceptance Criteria:**
  - [ ] Group medicines by timing (morning/evening)
  - [ ] Generate daily call checklist per patient
  - [ ] Handle timezone conversion for scheduling
  - [ ] Recalculate when medicines are added/updated/removed
- **Story Points:** 5

**E3-S5: Edit Medicines from Dashboard**
- **As a** payer
- **I want to** edit my parent's medicines from the web dashboard
- **So that** I can update the list when the doctor changes prescriptions
- **Acceptance Criteria:**
  - [ ] Medicine list view on dashboard with edit/delete buttons
  - [ ] Add new medicine form with same fields as onboarding
  - [ ] Edit: change name, timing, food, nickname
  - [ ] Changes take effect from next scheduled call
- **Story Points:** 5

**E3-S6: Unknown Medicine Flagging**
- **As a** system
- **I want** to flag unrecognized medicines for human review
- **So that** medicine data quality is maintained
- **Acceptance Criteria:**
  - [ ] Medicines not found in catalog get `needs_review: true` flag
  - [ ] Admin dashboard shows flagged medicines queue
  - [ ] Review within 24 hours SLA
  - [ ] Never reject user input - always store as entered
- **Story Points:** 3

---

## E-4: AI Voice Calling Engine

> **Goal:** Build the core AI voice calling system using ElevenLabs and Twilio that makes scheduled outbound calls to patients.
> **BRD Refs:** FR-21 to FR-33

### Stories

**E4-S1: ElevenLabs Voice Integration**
- **As a** system
- **I want** to generate natural AI voice audio using ElevenLabs API
- **So that** patients hear a warm, human-like voice during calls
- **Acceptance Criteria:**
  - [ ] ElevenLabs API integration for text-to-speech
  - [ ] Support for Hindi (primary) + configurable additional languages
  - [ ] Male and female voice options
  - [ ] Audio generated dynamically per patient's medicine list and preferred name
  - [ ] Caching of common phrases to reduce API costs
- **Story Points:** 8

**E4-S2: Twilio Outbound Call Integration**
- **As a** system
- **I want** to place outbound phone calls to Indian mobile numbers via Twilio
- **So that** patients receive AI voice calls at their scheduled times
- **Acceptance Criteria:**
  - [ ] Twilio account configured with Indian phone number
  - [ ] Outbound call API: initiate call to patient's phone
  - [ ] Audio streaming: play ElevenLabs-generated voice during call
  - [ ] Call status webhooks: answered, no-answer, busy, failed
  - [ ] Call duration and cost tracking
- **Story Points:** 8

**E4-S3: Conversation Flow Engine**
- **As a** system
- **I want** a conversation flow engine that drives the AI call script
- **So that** the AI asks about each medicine by name/nickname and captures responses
- **Acceptance Criteria:**
  - [ ] Dynamic script generation per patient: "Namaste [preferred_name]!"
  - [ ] Per medicine question: "[nickname] li kya [timing]?" in patient's language
  - [ ] Response capture: yes/no/unclear per medicine
  - [ ] Vitals prompt if patient has glucometer/BP monitor
  - [ ] Mood/wellbeing check: "Aap kaisi feel kar rahe hain?"
  - [ ] Graceful handling of unexpected responses
- **Story Points:** 13

**E4-S4: Call Scheduler (Cron Engine)**
- **As a** system
- **I want** a scheduler that triggers calls at each patient's configured times
- **So that** calls go out reliably every day without manual intervention
- **Acceptance Criteria:**
  - [ ] Cron job runs every minute, checks for due calls
  - [ ] Timezone-aware: each patient's call time in their local timezone
  - [ ] Batch processing for concurrent calls at peak times (8-9 AM IST)
  - [ ] Skip paused patients
  - [ ] Handle call queue to stay within Twilio concurrent limits
- **Story Points:** 8

**E4-S5: Retry Logic**
- **As a** system
- **I want** configurable retry when a patient doesn't answer
- **So that** missed calls are retried automatically
- **Acceptance Criteria:**
  - [ ] Default: retry after 30 minutes, max 2 retries (configurable per patient)
  - [ ] Retry only on no-answer or busy (not on declined)
  - [ ] Track retry count per call attempt
  - [ ] After max retries: mark as missed, notify payer
- **Story Points:** 5

**E4-S6: Conversation Storage**
- **As a** system
- **I want** every call conversation stored in MongoDB
- **So that** reports can be generated and transcripts viewed
- **Acceptance Criteria:**
  - [ ] `calls` collection document per call attempt
  - [ ] Fields: patient_id, timestamp, duration, medicines_checked, responses (per medicine: taken/missed/unclear), vitals (if collected), mood_notes, call_status, retry_count
  - [ ] Audio recording URL stored (if enabled)
  - [ ] Indexed by patient_id and date for fast queries
- **Story Points:** 5

**E4-S7: First 48-Hour Call Protocol**
- **As a** system
- **I want** the first 3 calls to use extra warm, slow, patient scripts
- **So that** new patients feel comfortable and don't reject future calls
- **Acceptance Criteria:**
  - [ ] Flag: `is_new_patient` for first 3 calls
  - [ ] Extended intro: remind who's calling and why
  - [ ] Slower speech rate for first calls
  - [ ] If patient confused: offer to connect with payer
  - [ ] Track `calls_completed_count` to exit new-patient mode after 3
- **Story Points:** 5

**E4-S8: Immediate Post-Call Report to Payer**
- **As a** payer
- **I want** a WhatsApp message immediately after each call with results
- **So that** I know right away if my parent took their medicines
- **Acceptance Criteria:**
  - [ ] WhatsApp message sent to payer within 2 minutes of call end
  - [ ] Format: medicine name + taken/missed per medicine
  - [ ] Include vitals if collected (glucose, BP)
  - [ ] Include mood notes if captured
  - [ ] Alert icon for missed critical medicines
- **Story Points:** 5

**E4-S9: Call Cost Tracking**
- **As an** admin
- **I want** to track ElevenLabs and Twilio costs per call
- **So that** we can monitor unit economics and optimize
- **Acceptance Criteria:**
  - [ ] Log ElevenLabs characters/minutes used per call
  - [ ] Log Twilio call duration and cost per call
  - [ ] Daily/monthly cost aggregation
  - [ ] Cost per patient per month calculation
- **Story Points:** 3

---

## E-5: Dashboard & Reporting

> **Goal:** Build the web dashboard where payers and hospitals view adherence data, call history, and health reports.
> **BRD Refs:** FR-34 to FR-41

### Stories

**E5-S1: Patient List View**
- **As a** payer
- **I want** to see a list of my parents with today's adherence status
- **So that** I can quickly check if medicines were taken
- **Acceptance Criteria:**
  - [ ] B2C: show "Mom" and "Dad" cards with today's status
  - [ ] B2B: paginated patient list with search/filter
  - [ ] Per patient card: name, preferred name, today's adherence % (e.g., "2/3 taken"), last call time
  - [ ] Color coding: green (all taken), yellow (partial), red (all missed), gray (no call yet today)
- **Story Points:** 5

**E5-S2: Daily Adherence Detail View**
- **As a** payer
- **I want** to see which specific medicines were taken or missed today
- **So that** I know exactly what needs attention
- **Acceptance Criteria:**
  - [ ] Click patient card -> see today's medicine checklist
  - [ ] Per medicine: name, nickname, timing, status (taken/missed/pending)
  - [ ] Vitals display if collected (glucose reading, BP)
  - [ ] Mood/wellbeing notes from AI conversation
  - [ ] Call time and duration shown
- **Story Points:** 5

**E5-S3: Calendar View (Monthly Adherence)**
- **As a** payer
- **I want** a monthly calendar showing green/red days
- **So that** I can see adherence trends over time
- **Acceptance Criteria:**
  - [ ] Calendar grid with color-coded days
  - [ ] Green = all medicines taken, Red = any missed, Gray = no data
  - [ ] Click day -> see that day's detail
  - [ ] Month navigation (previous/next)
  - [ ] Adherence percentage for the month
- **Story Points:** 5

**E5-S4: Conversation History**
- **As a** payer
- **I want** to view past call transcripts for my parent
- **So that** I can see exactly what was discussed
- **Acceptance Criteria:**
  - [ ] List of past calls sorted by date (newest first)
  - [ ] Per call: date, time, duration, summary
  - [ ] Expand to see full conversation transcript
  - [ ] Filter by date range
- **Story Points:** 5

**E5-S5: Weekly Health Report Generation**
- **As a** payer
- **I want** a comprehensive weekly report sent every Sunday evening
- **So that** I get a full picture of my parent's health week
- **Acceptance Criteria:**
  - [ ] Auto-generated every Sunday
  - [ ] Sent at payer's timezone evening (e.g., 7 PM CST)
  - [ ] Content: weekly adherence %, per-medicine breakdown, vitals trends, mood summary, missed medicines highlight
  - [ ] Sent via WhatsApp to payer and all family members with weekly notification enabled
- **Story Points:** 8

**E5-S6: Vitals Trend Charts**
- **As a** payer
- **I want** to see glucose and BP readings over time as a chart
- **So that** I can monitor trends and share with doctors if needed
- **Acceptance Criteria:**
  - [ ] Line chart for glucose readings over 30 days
  - [ ] Line chart for BP readings (systolic/diastolic) over 30 days
  - [ ] Normal range indicators on chart
  - [ ] Only shown if patient has glucometer/BP monitor
- **Story Points:** 5

**E5-S7: Dashboard Layout & Navigation**
- **As a** user
- **I want** a clean, responsive dashboard layout
- **So that** I can navigate easily on mobile and desktop
- **Acceptance Criteria:**
  - [ ] Responsive layout (mobile-first for NRI users)
  - [ ] Navigation: Home / Patients / Reports / Settings
  - [ ] Dark/light mode support
  - [ ] Loading states and error handling
- **Story Points:** 5

---

## E-6: Subscription & Billing

> **Goal:** Implement subscription plans, free trial, and payment processing.
> **BRD Refs:** FR-45 to FR-49

### Stories

**E6-S1: Plan Selection UI**
- **As a** payer
- **I want** to see and select from 2 subscription plans during onboarding
- **So that** I can choose the right level of service
- **Acceptance Criteria:**
  - [ ] Display 2 plans: Suraksha (₹1,350/$15), Sampurna (₹1,800/$20)
  - [ ] "Most Popular" badge on Sampurna
  - [ ] Feature comparison per plan
  - [ ] Daily cost breakdown shown (₹45/day for Suraksha, ₹60/day for Sampurna)
- **Story Points:** 3

**E6-S2: Payment Integration (Razorpay + Stripe)**
- **As a** payer
- **I want** to pay using my Indian or international card
- **So that** payment works regardless of where I bank
- **Acceptance Criteria:**
  - [ ] Razorpay integration for Indian cards/UPI/netbanking
  - [ ] Stripe integration for international cards (US/UK/UAE)
  - [ ] Auto-detect payment method based on card BIN or user location
  - [ ] Payment failure handling: save onboarding data, retry payment later
- **Story Points:** 8

**E6-S3: Free Trial Management**
- **As a** payer
- **I want** 7 days free before being charged
- **So that** I can verify the service works for my parent
- **Acceptance Criteria:**
  - [ ] 7-day trial starts after onboarding completion
  - [ ] Full plan features available during trial
  - [ ] Trial countdown shown on dashboard
  - [ ] Auto-charge on day 8 if not cancelled
  - [ ] Trial expiry reminder on day 5 and day 7
- **Story Points:** 5

**E6-S4: Subscription Lifecycle Management**
- **As a** system
- **I want** to manage subscription states (trial, active, cancelled, expired)
- **So that** calling and features are enabled/disabled correctly
- **Acceptance Criteria:**
  - [ ] States: trial -> active -> cancelled/expired
  - [ ] Calls stop when subscription expires
  - [ ] Grace period: 3 days after payment failure before suspending
  - [ ] Reactivation: resume calls when payment succeeds
- **Story Points:** 5

**E6-S5: Cancel Anytime**
- **As a** payer
- **I want** to cancel my subscription with one message
- **So that** I'm not locked in if the service doesn't work
- **Acceptance Criteria:**
  - [ ] Cancel via WhatsApp message ("cancel") or dashboard button
  - [ ] Immediate confirmation of cancellation
  - [ ] Service continues until end of current billing period
  - [ ] Cancellation reason survey (optional)
  - [ ] Data retained for 30 days post-cancellation
- **Story Points:** 3

---

## E-7: Self-Service Controls

> **Goal:** Enable payers and patients to control their call settings.
> **BRD Refs:** FR-42 to FR-44

### Stories

**E7-S1: Pause/Resume Calls**
- **As a** payer
- **I want** to pause calls for my parent temporarily
- **So that** calls stop during hospital stays or travel
- **Acceptance Criteria:**
  - [ ] Pause button on dashboard per patient
  - [ ] Optional: pause reason and expected resume date
  - [ ] Calls immediately stop when paused
  - [ ] Resume button to restart calls
  - [ ] Auto-resume reminder after 7 days if still paused
- **Story Points:** 3

**E7-S2: Edit Call Schedule**
- **As a** payer
- **I want** to change call times from the dashboard
- **So that** I can adjust when my parent's routine changes
- **Acceptance Criteria:**
  - [ ] Edit morning and evening call times
  - [ ] Changes take effect from next day
  - [ ] Timezone displayed correctly
- **Story Points:** 3

**E7-S3: Edit Patient Profile**
- **As a** payer
- **I want** to update my parent's profile details
- **So that** information stays current
- **Acceptance Criteria:**
  - [ ] Edit: preferred name, language, phone number, voice gender
  - [ ] Phone number change requires verification
  - [ ] Language change updates AI call scripts immediately
- **Story Points:** 3

**E7-S4: Add Second Parent**
- **As a** payer
- **I want** to add my other parent (e.g., Mom after already adding Dad)
- **So that** both parents are monitored under one account
- **Acceptance Criteria:**
  - [ ] "Add another parent" option on dashboard
  - [ ] Full onboarding flow for second patient
  - [ ] Both patients visible on dashboard
  - [ ] Separate subscription per patient
- **Story Points:** 5

---

## E-8: First 48-Hour Experience

> **Goal:** Ensure the critical first 48 hours after onboarding deliver immediate value to lock in retention.
> **BRD Refs:** Phase 10, FR-33, FR-38

### Stories

**E8-S1: Day 1 Morning - First Real Call**
- **As a** system
- **I want** the first real call to use the warm onboarding protocol
- **So that** the patient's first experience is positive and comfortable
- **Acceptance Criteria:**
  - [ ] Extra warm greeting referencing payer by name: "[preferred_name], [payer_name] beta ne shuru kiya tha, yaad hai?"
  - [ ] Slower speech rate
  - [ ] Shorter call duration (under 3 minutes)
  - [ ] Immediate WhatsApp report to payer after call
- **Story Points:** 5

**E8-S2: Immediate Value Delivery to Payer**
- **As a** payer
- **I want** a detailed WhatsApp summary within minutes of the first call
- **So that** I immediately see value from the service
- **Acceptance Criteria:**
  - [ ] WhatsApp sent within 2 minutes of call completion
  - [ ] Per medicine: taken/missed with medicine name
  - [ ] Vitals if collected
  - [ ] Mood/wellbeing notes
  - [ ] Encouraging message: "Bauji's first call went well!"
- **Story Points:** 3

**E8-S3: Day 2 Engagement Tracking**
- **As a** system
- **I want** to track whether the patient picked up all 3 calls in first 48 hours
- **So that** I can send a confidence-building message to the payer
- **Acceptance Criteria:**
  - [ ] Track: calls_completed in first 48 hours
  - [ ] After 3 successful calls: send payer "Bauji has picked up all 3 calls! Adherence at X%"
  - [ ] If patient misses Day 1 call: ask payer to remind patient
  - [ ] Track first_report_sent flag
- **Story Points:** 3

**E8-S4: Missed Call Recovery Protocol**
- **As a** system
- **I want** a recovery protocol when the patient doesn't answer in first 48 hours
- **So that** we don't lose the customer before they experience value
- **Acceptance Criteria:**
  - [ ] Patient doesn't answer -> retry per E4-S5 retry logic
  - [ ] After max retries -> WhatsApp to payer: "Bauji didn't pick up. Could you remind him?"
  - [ ] Payer becomes active participant (increases their engagement)
  - [ ] If patient still unreachable after 48 hours: offer to reschedule test call
- **Story Points:** 3

---

## Sprint Planning Recommendation

| Sprint | Duration | Epics | Key Deliverable |
|--------|----------|-------|-----------------|
| Sprint 1 | 2 weeks | E-1, E-2 (start) | Project setup, auth, onboarding phases 1-4 |
| Sprint 2 | 2 weeks | E-2 (complete), E-3 | Full onboarding flow, medicine management |
| Sprint 3 | 2 weeks | E-4 (start) | ElevenLabs + Twilio integration, conversation flow |
| Sprint 4 | 2 weeks | E-4 (complete), E-5 (start) | Call scheduler, retry logic, dashboard start |
| Sprint 5 | 2 weeks | E-5 (complete), E-6 | Dashboard complete, billing integration |
| Sprint 6 | 2 weeks | E-7, E-8 | Self-service controls, first 48-hour experience |

**MVP Target: 12 weeks (6 sprints)**

---

## Definition of Done (DoD)

- [ ] Code reviewed and merged to main
- [ ] Unit tests written for business logic
- [ ] API endpoints tested with Postman/Thunder Client
- [ ] Responsive UI tested on mobile and desktop
- [ ] MongoDB indexes created for query performance
- [ ] Environment variables documented
- [ ] No console errors or warnings in production build

---

## Story Point Reference

| Points | Complexity | Example |
|--------|-----------|---------|
| 1 | Trivial | Config change, copy update |
| 2 | Simple | Single API endpoint, basic UI component |
| 3 | Small | CRUD operations, simple form |
| 5 | Medium | Integration with external service, multi-step form |
| 8 | Large | Complex business logic, multi-service orchestration |
| 13 | Very Large | End-to-end feature with multiple integrations |

**Total Story Points: ~248**
**Average Velocity Target: ~40-45 points per sprint**
