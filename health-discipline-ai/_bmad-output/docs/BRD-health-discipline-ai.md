# Business Requirements Document (BRD)

## Cocarely

**Version:** 1.0
**Date:** 2026-02-14
**Author:** Dell
**Status:** Draft

---

## 1. Executive Summary

Cocarely is an AI-powered medication adherence monitoring platform that uses automated voice calls to check whether patients have taken their medicines. The system bridges the gap between elderly patients in India and their children living abroad, as well as serving hospitals that need to track outpatient medication compliance at scale.

**Core Value Proposition:** "Simple as a phone call" - patients need zero tech skills, no smartphone, and no app. They simply answer a phone call from a natural-sounding AI voice agent that speaks their language.

**Product Tagline:** Voice is the most inclusive interface.

---

## 2. Business Objectives

| Objective | Description | Success Metric |
|-----------|-------------|----------------|
| BO-1 | Enable remote medication monitoring for families separated by distance | Active B2C subscriptions |
| BO-2 | Provide hospitals with scalable outpatient medication tracking | Active B2B hospital accounts |
| BO-3 | Achieve high medication adherence rates through consistent AI calling | Adherence rate improvement % |
| BO-4 | Build a sustainable subscription-based revenue model | Monthly Recurring Revenue (MRR) |
| BO-5 | Ensure zero tech barrier for elderly patients | Patient call completion rate |

---

## 3. Stakeholders

### 3.1 Primary Users

| Stakeholder | Role | Needs |
|-------------|------|-------|
| **Children Abroad (B2C)** | Account creator, subscriber, report viewer | Peace of mind, real adherence data, guilt-free monitoring |
| **Elderly Parents in India (B2C)** | Call recipient (patient) | Simple interaction, no tech required, dignity preserved |
| **Hospital Staff (B2B)** | Admin, report viewer, patient manager | Scalable outpatient tracking, cost savings over manual calls |
| **Hospital Patients (B2B)** | Call recipient (patient) | Post-discharge medication reminders and check-ins |

### 3.2 Secondary Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Doctors | Patient compliance data, potential referral channel |
| Pharma companies (future) | Medication adherence data and insights |
| Insurance providers (future) | Risk reduction through improved adherence |

---

## 4. Scope

### 4.1 In Scope (MVP - Phase 1)

| ID | Feature | Priority |
|----|---------|----------|
| F-01 | User registration and authentication (kid/hospital login) | Must Have |
| F-02 | Patient onboarding (add parent/patient with name, phone, language, location, timezone) | Must Have |
| F-03 | Medicine entry with AI-assisted suggestions | Must Have |
| F-04 | Medicine schedule configuration (times per day) | Must Have |
| F-05 | AI voice calling engine (ElevenLabs + Twilio) | Must Have |
| F-06 | Scheduled outbound calls based on medicine plan | Must Have |
| F-07 | Conversation capture and storage in MongoDB | Must Have |
| F-08 | Basic dashboard with adherence status per patient | Must Have |
| F-09 | Report generation from conversation data | Must Have |
| F-10 | Subscription and free trial (2-3 days configurable) | Must Have |
| F-11 | Pause/resume call controls | Should Have |
| F-12 | Medicine edit functionality | Should Have |
| F-13 | Configurable retry logic per patient | Should Have |

### 4.2 Out of Scope (Future Phases)

| Feature | Phase |
|---------|-------|
| Push notifications | Phase 2 |
| Multi-language AI voice expansion | Phase 2 |
| B2B bulk patient upload | Phase 2 |
| WhatsApp/email summary reports | Phase 2 |
| Advanced analytics and adherence trends | Phase 2 |
| Emergency escalation protocols | Phase 3 |
| Pharma/insurance partnerships | Phase 3 |
| Video call option | Phase 3 |
| Drug interaction awareness (non-advisory) | Phase 3 |
| Medical advice or drug suggestions | Explicitly excluded from all phases |

---

## 5. Functional Requirements

### 5.0 Onboarding Flow (10-Phase Journey)

> **Reference:** Full interactive blueprint with conversation scripts, state changes, and risk analysis at [healthcare-onboarding-blueprint.jsx](onboarding/healthcare-onboarding-blueprint.jsx)

The onboarding is a **conversational WhatsApp-based flow** (not a traditional form). Total duration: ~15-20 minutes.

| Phase | Name | Duration | Critical | Fields Collected |
|-------|------|----------|----------|-----------------|
| 0 | Discovery | Before Day 0 | No | Phone number (auto from WhatsApp) |
| 1 | Payer Welcome | 2-3 min | YES | Qualifying question (parent/self), relationship |
| 2 | Payer Details | 1-2 min | No | Payer name, location/timezone |
| 3 | Patient Profile | 2-3 min | YES | Patient name, preferred name (how AI addresses them), age, preferred language, digital tier (WhatsApp/feature phone), patient phone number |
| 4 | Health Conditions | 1 min | No | Conditions (multi-select), glucometer availability, BP monitor availability |
| 5 | Medicine Setup | 3-5 min | YES | Per medicine: brand name, generic name, dosage, timing (morning/afternoon/evening/night), with food (before/after/with), patient's nickname for medicine |
| 6 | Family Network | 1-2 min | No | Additional family members (name, phone, relationship), notification preferences per member |
| 7 | Call Schedule | 1 min | No | Call times (mapped to patient's routine), preferred voice gender (male/female) |
| 8 | Payment | 1-2 min | YES | Plan selection (Suraksha/Sampurna), payment method |
| 9 | Test Call | 3-5 min | YES | Patient verbal consent (DPDP Act), voice familiarization, data sharing consent |
| 10 | First 48 Hours | Day 1-2 | YES | First 3 call completions, first payer report delivered |

#### Key Onboarding Design Principles

1. **Conversational, not form-based** - WhatsApp chat flow with buttons, not web forms
2. **Every question justified** - Each data point tied to a visible benefit explained to user
3. **Preferred name is the emotional hook** - "Call him Bauji" makes the payer emotionally invested
4. **Medicine nicknames** - AI asks "Bauji, BP wali goli li kya?" in the patient's own language
5. **Test call is mandatory** - Patient hears the voice before Day 1, provides verbal consent
6. **Onboarding isn't done until 3 calls complete** - First 48 hours are make-or-break

#### Complete Fields Collected During Onboarding

**Payer (NRI Child) Fields:**
| Field | Phase | Required |
|-------|-------|----------|
| Phone number | Auto (WhatsApp) | Yes |
| Name | Phase 2 | Yes |
| Location/timezone | Phase 2 | Yes |
| Relationship to patient | Phase 1 | Yes |
| Notification preferences | Phase 6 | Yes (default: all) |

**Patient (Elderly Parent) Fields:**
| Field | Phase | Required |
|-------|-------|----------|
| Full name | Phase 3 | Yes |
| Preferred name (how AI addresses them) | Phase 3 | Yes |
| Age | Phase 3 | Yes |
| Preferred language | Phase 3 | Yes |
| Digital tier (WhatsApp/feature phone/none) | Phase 3 | Yes |
| Phone number | Phase 3 | Yes |
| Health conditions | Phase 4 | Yes |
| Has glucometer | Phase 4 | Conditional (if diabetic) |
| Has BP monitor | Phase 4 | Conditional (if hypertension) |
| Preferred call times (morning/evening) | Phase 7 | Yes |
| Preferred voice gender | Phase 7 | Yes |
| Verbal consent (recorded in test call) | Phase 9 | Yes |

**Medicine Fields (per medicine):**
| Field | Phase | Required |
|-------|-------|----------|
| Brand name | Phase 5 | Yes |
| Generic name (AI-mapped) | Phase 5 | Auto |
| Dosage | Phase 5 | Yes |
| Timing (morning/afternoon/evening/night) | Phase 5 | Yes |
| With food (before/after/with/anytime) | Phase 5 | Yes |
| Patient's nickname for medicine | Phase 5 | Yes |
| Linked condition | Phase 5 | Auto |
| Critical flag | Phase 5 | Auto |

**Family Member Fields (per additional member):**
| Field | Phase | Required |
|-------|-------|----------|
| Name | Phase 6 | Yes |
| Phone number | Phase 6 | Yes |
| Relationship to patient | Phase 6 | Yes |
| Notification level (weekly+alerts / daily) | Phase 6 | Yes |

#### Pricing Plans (B2C)

| Plan | Price | Features |
|------|-------|----------|
| Suraksha (सुरक्षा) | ₹1,350/mo ($15) | 1 call daily (7 days), real-time alerts, up to 3 family members |
| Sampurna (सम्पूर्ण) — Most Popular | ₹1,800/mo ($20) | 2 calls daily (7 days), weekly deep check-in, doctor reports, priority support |

**Free Trial:** 7 days for all plans. Cancel anytime with one message.

**Payment:** Razorpay (India cards/UPI) + Stripe (international cards for NRI payments)

---

### 5.1 User Registration & Authentication

| ID | Requirement | Details |
|----|-------------|---------|
| FR-01 | Account creation | Children abroad or hospital admins create accounts via WhatsApp (B2C) or web portal (B2B) |
| FR-02 | Role-based access | Two account types: B2C (family/payer) and B2B (hospital) |
| FR-03 | Multi-user access | Multiple siblings can access same parent's data with configurable notification levels |

### 5.2 Patient Onboarding

| ID | Requirement | Details |
|----|-------------|---------|
| FR-04 | Add patient | User adds parent/patient via conversational WhatsApp flow (see Phase 3 above) |
| FR-05 | Language capture | Patient's preferred language captured during onboarding; all AI calls made in this language |
| FR-06 | Phone verification | Phone number verified during onboarding; must differ from payer's number |
| FR-07 | Preferred name | Patient's preferred form of address captured (e.g., "Bauji", "Amma") - used by AI in every call |
| FR-08 | Digital tier detection | Determine if patient uses WhatsApp, feature phone only, or needs voice-only communication |
| FR-09 | Multiple patients | B2C: Kids can add both mom and dad. B2B: Hospital adds multiple patients |
| FR-10 | B2B bulk upload | Hospital can bulk upload patients via CSV (Phase 2) and add one-by-one (MVP) |
| FR-11 | Test call | Mandatory test call during onboarding for patient introduction, voice familiarization, and verbal consent |

### 5.3 Medicine Management

| ID | Requirement | Details |
|----|-------------|---------|
| FR-12 | Manual medicine entry | User manually enters medicine names one at a time (loop pattern, not "how many?") |
| FR-13 | Photo upload path | Alternative: upload prescription photo for AI extraction (future enhancement) |
| FR-14 | AI-assisted mapping | When user types "Telma 40", AI maps to "Telmisartan 40mg for blood pressure" |
| FR-15 | Medicine nicknames | Capture what patient CALLS the medicine (e.g., "BP wali goli") - AI uses this in calls |
| FR-16 | Timing & food | Per medicine: morning/afternoon/evening/night + before/after/with food |
| FR-17 | Schedule configuration | Call times mapped to patient's daily routine (wake-up time, dinner time) |
| FR-18 | Edit medicines | Kids/hospital can edit medicine list and schedules anytime from dashboard |
| FR-19 | Edit during/after onboarding | Full edit capability both during initial setup and afterwards |
| FR-20 | Unknown medicine handling | Never reject a medicine entry. Store as-is, flag for human review within 24 hours |

### 5.4 AI Voice Calling Engine

| ID | Requirement | Details |
|----|-------------|---------|
| FR-21 | Outbound AI calls | System initiates calls to patients at scheduled medicine times |
| FR-22 | Natural AI voice | ElevenLabs-powered real-sounding voice (not robotic), gender selectable |
| FR-23 | Language-specific calls | AI speaks in patient's preferred language (captured at onboarding) |
| FR-24 | Preferred name usage | AI addresses patient by their preferred name in every call (e.g., "Namaste Bauji!") |
| FR-25 | Medicine nickname usage | AI uses patient's own words for medicines (e.g., "BP wali goli li kya?") |
| FR-26 | Conversation capture | Full conversation recorded and stored in MongoDB |
| FR-27 | Call frequency | Based on medicine schedule - morning and evening calls |
| FR-28 | Retry logic | Configurable retry settings per patient (retry interval, max retries) |
| FR-29 | Timezone-aware scheduling | Calls scheduled based on patient's timezone from onboarding |
| FR-30 | Vitals collection | AI asks for glucose/BP readings during calls if patient has monitoring devices |
| FR-31 | Mood & wellbeing check | AI notes how patient is feeling, captures complaints (e.g., knee pain) |
| FR-32 | Tracking only | System tracks responses only - no medical suggestions or drug interaction warnings in v1 |
| FR-33 | First 48-hour protocol | Extra warm, slow, patient scripts for first 3 calls; immediate report to payer after each |

### 5.5 Dashboard & Reporting

| ID | Requirement | Details |
|----|-------------|---------|
| FR-34 | Patient list view | B2C: List of parents. B2B: List of patients |
| FR-35 | Daily adherence status | Show took/missed status per medicine per patient |
| FR-36 | Calendar view | Green days = all medicines taken, Red = missed |
| FR-37 | Conversation history | View past conversation transcripts per patient |
| FR-38 | Immediate post-call report | WhatsApp message to payer after each call with quick summary |
| FR-39 | Weekly health report | Comprehensive report sent Sunday evening (payer's timezone) |
| FR-40 | Vitals tracking | Display glucose/BP readings trends over time |
| FR-41 | Periodic refresh | Dashboard refreshes periodically (not real-time) |

### 5.6 Self-Service Controls

| ID | Requirement | Details |
|----|-------------|---------|
| FR-42 | Pause/stop calls | Patient or family member can pause or stop calls from dashboard |
| FR-43 | Update medicines | Self-service medicine updates without contacting support |
| FR-44 | Resume calls | Re-enable calls after pausing |

### 5.7 Subscription & Billing

| ID | Requirement | Details |
|----|-------------|---------|
| FR-45 | Free trial | 7-day free trial for all plans |
| FR-46 | B2C tiered pricing | 2 plans: Suraksha (₹1,350/$15), Sampurna (₹1,800/$20) |
| FR-47 | B2B pricing | Custom per-patient pricing for hospitals |
| FR-48 | Dual payment gateway | Razorpay (India) + Stripe (international NRI cards) |
| FR-49 | Cancel anytime | One-message cancellation via WhatsApp |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Concurrent calls | System must handle 500+ simultaneous calls at peak medicine time (8am IST) |
| NFR-02 | Dashboard load time | < 3 seconds |
| NFR-03 | Call initiation latency | Calls initiated within 5 minutes of scheduled time |
| NFR-04 | API response time | < 500ms for dashboard API calls |

### 6.2 Security & Compliance

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-05 | Data encryption | Encryption at rest and in transit for all health data |
| NFR-06 | DPDP Act compliance | Comply with India's Digital Personal Data Protection Act |
| NFR-07 | HIPAA consideration | HIPAA compliance pathway for B2B hospital customers |
| NFR-08 | Data retention policy | Configurable call recording retention period |
| NFR-09 | Patient opt-out | Patients can opt out and request data deletion |
| NFR-10 | Authentication security | Secure login with password hashing, session management |

### 6.3 Scalability

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-11 | Horizontal scaling | Architecture must support scaling call engine independently |
| NFR-12 | Database scaling | MongoDB must handle growing conversation records efficiently |
| NFR-13 | Cost efficiency | Optimize ElevenLabs and Twilio costs at scale |

### 6.4 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-14 | Uptime | 99.5% uptime for calling engine |
| NFR-15 | Dashboard availability | 99% uptime for web dashboard |

---

## 7. Technical Architecture Overview

> **Detailed technical specification:** [technical-specification.md](technical-specification.md) (frontend: Next.js, backend: NestJS, database: MongoDB).

### 7.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React, App Router) |
| Backend / API | NestJS |
| Database | MongoDB |
| AI Voice | ElevenLabs (text-to-speech, natural voice) |
| Telephony | Twilio (outbound calls, India numbers) |
| Hosting | TBD (Vercel / AWS / GCP) |
| Payment | TBD (Razorpay / Stripe) |

### 7.2 System Architecture

```
┌─────────────────────────────────────────────────┐
│              FRONTEND (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Dashboard │  │ Onboard  │  │ Admin/Billing │  │
│  │   (Web)   │  │  (Web)   │  │    (Web)      │  │
│  └─────┬─────┘  └─────┬────┘  └──────┬────────┘  │
│        └───────────────┼──────────────┘           │
│                        │ HTTPS / REST             │
└────────────────────────┼─────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────┐
│              BACKEND (NestJS)                      │
│                  ┌─────┴─────┐                    │
│                  │  REST API │                    │
│                  │  + Cron   │                    │
│                  └─────┬─────┘                    │
└────────────────────────┼─────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    ┌─────┴─────┐  ┌────┴────┐  ┌─────┴──────┐
    │  MongoDB  │  │ Twilio  │  │ ElevenLabs │
    │           │  │ (Calls) │  │ (AI Voice) │
    │ - Users   │  │         │  │            │
    │ - Patients│  └────┬────┘  └─────┬──────┘
    │ - Meds    │       │             │
    │ - Calls   │       └──────┬──────┘
    │ - Reports │              │
    └───────────┘    ┌─────────┴─────────┐
                     │  Call Scheduler    │
                     │  (Cron Engine)     │
                     │  - Schedule calls  │
                     │  - Retry logic     │
                     │  - Store results   │
                     └───────────────────┘
```

### 7.3 Data Flow

```
1. Onboarding:  Kid/Hospital → Add Patient → Enter Medicines → Set Schedule → MongoDB
2. Calling:     Cron Scheduler → Fetch Due Calls → Twilio + ElevenLabs → Call Patient
3. Capture:     AI Conversation → Response Data → Store in MongoDB
4. Reporting:   MongoDB → Generate Report → Display on Dashboard
```

### 7.4 Key MongoDB Collections

| Collection | Purpose |
|------------|---------|
| users | Account holders (kids abroad, hospital admins) |
| patients | Patient profiles (name, phone, language, timezone, location) |
| medicines | Medicine list per patient with schedule |
| calls | Call records with conversation data, timestamps, responses |
| subscriptions | Billing and subscription status |
| callConfigs | Retry settings, pause status per patient |

---

## 8. Business Model

### 8.1 Revenue Streams

| Stream | Model | Pricing |
|--------|-------|---------|
| B2C | Subscription per parent | TBD (monthly) |
| B2B | Subscription per patient | TBD (monthly) |
| Free Trial | 2-3 days (configurable) | Free |

### 8.2 Cost Structure

| Cost Item | Type | Notes |
|-----------|------|-------|
| ElevenLabs API | Variable (per minute) | AI voice generation per call |
| Twilio | Variable (per call) | Outbound calls to India numbers |
| MongoDB Atlas | Fixed + Variable | Database hosting and storage |
| Hosting (Next.js + NestJS) | Fixed | Vercel/AWS for frontend + backend |
| Payment Gateway | Transaction fee | Per subscription payment |

### 8.3 Unit Economics (To Be Validated)

| Metric | Calculation |
|--------|-------------|
| Cost per call | ElevenLabs cost/min + Twilio cost/call |
| Cost per patient/day | (Calls per day) x (Cost per call) |
| Cost per patient/month | Daily cost x 30 |
| Required subscription price | Monthly cost + margin |
| Break-even | Fixed costs / (Price - Variable cost per patient) |

---

## 9. Assumptions & Constraints

### 9.1 Assumptions

| # | Assumption |
|---|-----------|
| A-1 | Elderly patients in India are comfortable answering phone calls |
| A-2 | Children abroad are willing to pay for medication monitoring |
| A-3 | ElevenLabs can generate natural-sounding voice in Indian languages |
| A-4 | Twilio supports outbound calls to Indian mobile numbers at reasonable cost |
| A-5 | Patients will respond honestly about medication adherence |
| A-6 | 2-3 minute average call duration per medicine check |
| A-7 | Most patients take 2-5 medicines daily |

### 9.2 Constraints

| # | Constraint |
|---|-----------|
| C-1 | No medical advice or drug suggestions in any phase (regulatory risk) |
| C-2 | Must comply with India's DPDP Act for personal health data |
| C-3 | HIPAA compliance needed if targeting US-based hospitals |
| C-4 | Call costs scale linearly with patient count |
| C-5 | ElevenLabs language support may limit initial language offerings |
| C-6 | Peak call times (morning medicine) may cause concurrent call spikes |

### 9.3 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| ElevenLabs language quality for Indian languages | High | Test extensively before launch; fallback to pre-recorded |
| Twilio call costs at scale | Medium | Negotiate volume pricing; explore Indian alternatives (Exotel) |
| Patient doesn't answer calls | Medium | Configurable retry; notify family of missed calls |
| Regulatory changes (health data) | High | Build data deletion and export capabilities from day 1 |
| Someone else answers patient's phone | Low | Consider voice verification in future phase |

---

## 10. Success Metrics & KPIs

### 10.1 Product Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Call completion rate | > 80% | Successful calls / Total scheduled calls |
| Patient response accuracy | > 90% | Correct responses captured / Total calls |
| Dashboard daily active users | Growing MoM | Unique logins per day |
| Average calls per patient/day | 2-3 | Total calls / Active patients |

### 10.2 Business Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Free trial to paid conversion | > 30% | Paid subscriptions / Trial signups |
| Monthly churn rate | < 5% | Cancelled subscriptions / Active subscriptions |
| Customer acquisition cost (CAC) | TBD | Marketing spend / New customers |
| Monthly Recurring Revenue (MRR) | Growing | Sum of all active subscriptions |
| B2B vs B2C revenue split | Track | Revenue by segment |

### 10.3 Health Impact Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Medication adherence rate | > 85% | Medicines taken / Medicines scheduled |
| Patient engagement streak | Track | Consecutive days of call completion |
| Family satisfaction score | > 4/5 | In-app rating/feedback |

---

## 11. Development Phases

### Phase 1: MVP (Immediate)
- User registration and authentication
- Patient onboarding with language capture
- Medicine entry with AI assistance
- AI voice calling (ElevenLabs + Twilio)
- Conversation storage (MongoDB)
- Basic dashboard and reports
- Subscription with free trial
- Pause/resume and medicine edit

### Phase 2: Enhancement (Post-MVP)
- Multi-language voice expansion
- Push notifications
- B2B bulk patient upload
- Advanced reporting and analytics
- WhatsApp/email summary reports

### Phase 3: Scale (Future)
- Emergency escalation protocols
- Pharma/insurance partnerships
- Video call option
- Drug interaction awareness (non-advisory)

---

## Appendix A: Root Insights from Brainstorming

| # | Insight | Business Implication |
|---|---------|---------------------|
| 1 | "Simple as a phone call" - zero tech barrier | Patient needs NO app, NO smartphone, NO tech skills |
| 2 | "Scale without staff" - AI replaces manual follow-up | Hospital saves 100x on nurse follow-up costs |
| 3 | "Data over guilt" - removes emotional burden | Kids get real tracking data, not guilt-driven nagging |
| 4 | "Voice is the most inclusive interface" | Works for everyone regardless of literacy or tech skills |

---

**Document Status:** Draft - Pending Review
**Next Steps:** Technical architecture deep-dive, UI/UX wireframes, API specification
