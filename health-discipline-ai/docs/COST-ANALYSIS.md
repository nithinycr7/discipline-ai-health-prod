# Health Discipline AI — Infrastructure Cost Analysis

> **Last updated:** February 2026
> **Currency:** All amounts in INR (₹) unless noted. USD conversions at ₹90 = $1.

---

## Product Overview

**Health Discipline AI** is an AI-powered medication adherence platform that makes automated voice calls to elderly patients in India to check whether they've taken their daily medicines. The core insight is that voice is the most inclusive interface — no app download, no smartphone, and no tech skills are required. The patient simply answers a phone call.

**How it works:** A family member (typically an NRI child living abroad) registers on the web portal and adds their parent's details — name, medicines, preferred language, and call schedule. The AI then calls the patient daily at the configured times, greets them by name in their preferred language (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada, Gujarati, or English), asks about each medicine individually, checks vitals and general wellness, and notes any complaints. After each call, a structured report with medicine-by-medicine adherence data is sent to the family via WhatsApp. The family can also view detailed trends, transcripts, and health insights on a web dashboard.

**Target market:** NRI children (25–45 years) in the US, UK, UAE, Canada, and Australia who can't physically ensure their parents take medicines daily. Secondary markets include working professionals in Indian metros with elderly parents in smaller cities, and hospitals looking to replace expensive manual nurse follow-up calls with AI at 1/100th the cost.

**Pricing (B2C):** Two plans — Suraksha (₹1,350/month or $15, 1 call/day with real-time alerts) and Sampurna (₹1,800/month or $20, 2 calls/day with premium features). B2B hospital pricing starts at ₹150–200 per patient per month.

**Tech stack:** NestJS backend on Google Cloud Run, Next.js frontend on Vercel, MongoDB (Azure Cosmos DB) for data, and a dual voice-AI stack — ElevenLabs Conversational AI (fully managed, higher cost) or Sarvam STT/TTS + Gemini LLM on LiveKit (modular, 57% cheaper). Outbound calls route via Twilio (US SIP) or Exotel (Indian SIP trunk), and WhatsApp notifications go through Twilio's Business API.

This document analyses the infrastructure costs for both voice stacks at every scale — from 10 patients to 1,000+ — and identifies the optimization path to profitability.

---

## Table of Contents

1. [Current Subscriptions & Fixed Costs](#1-current-subscriptions--fixed-costs)
2. [Variable Costs Per Call](#2-variable-costs-per-call)
3. [Variable Costs Per Patient Per Month](#3-variable-costs-per-patient-per-month)
4. [Scenario Analysis — Monthly Costs by User Count](#4-scenario-analysis--monthly-costs-by-user-count)
5. [Revenue vs Cost — Profitability by Plan](#5-revenue-vs-cost--profitability-by-plan)
6. [Annual Cost Projections](#6-annual-cost-projections)
7. [Cost Optimization Roadmap](#7-cost-optimization-roadmap)
8. [When to Upgrade Each Service](#8-when-to-upgrade-each-service)
9. [Future Verticals — Incremental Cost Impact](#9-future-verticals--incremental-cost-impact)
10. [Sarvam Stack — Full Cost Comparison](#10-sarvam-stack--full-cost-comparison)

---

## 1. Current Subscriptions & Fixed Costs

These costs are incurred regardless of how many patients use the platform.

### 1.1 Current Monthly Fixed Costs

| Service                     | Plan                                   | Monthly Cost (₹) | Monthly Cost ($) | What It Covers                                                            |
| --------------------------- | -------------------------------------- | :--------------: | :--------------: | ------------------------------------------------------------------------- |
| **ElevenLabs**              | Creator                                |      ₹1,936      |      $21.51      | 100,000 credits/month, Conversational AI agents, multilingual TTS         |
| **Google Cloud Run**        | Always-on (1 vCPU, 512 MiB)            |      ₹4,433      |      $49.25      | Backend API server (us-central1)                                          |
| **Azure Cosmos DB**         | 400 RU/s provisioned                   |  ₹0 (free tier)  |        $0        | 1,000 RU/s + 25 GB free tier covers current usage                         |
| **Twilio**                  | Phone number rental (US +1)            |       ₹90        |      $1.00       | US number (+17655227476) for outbound calls                               |
| **Vercel**                  | Hobby (Free)                           |        ₹0        |        $0        | Frontend hosting — **must upgrade to Pro (₹1,800/mo) for commercial use** |
| **Domain**                  | .com or .in                            |       ₹100       |      $1.11       | ~₹1,200/year amortized monthly                                            |
| **SSL**                     | Let's Encrypt (via Vercel + Cloud Run) |        ₹0        |        $0        | Auto-provisioned, free                                                    |
|                             |                                        |                  |                  |                                                                           |
| **TOTAL (Current)**         |                                        |    **₹6,559**    |    **$72.88**    |                                                                           |
| **TOTAL (With Vercel Pro)** |                                        |    **₹8,359**    |    **$92.88**    | Needed for commercial/production use                                      |

### 1.2 Current Plan Details — ElevenLabs Creator

| Attribute                          | Value                                   |
| ---------------------------------- | --------------------------------------- |
| Plan                               | Creator                                 |
| Monthly cost                       | ₹1,936                                  |
| Credits included                   | 100,000/month                           |
| Credits remaining (as of Feb 2026) | 180,632 (rollover from previous months) |
| Additional credits cost            | ₹26.40 per 1,000 credits                |
| Next billing date                  | 15th March 2026                         |
| Conversational AI access           | Yes                                     |
| Max concurrent agents              | 2                                       |

**Credit consumption for Conversational AI:** ElevenLabs Conversational AI consumes credits per minute of conversation. The exact consumption rate varies, but based on current pricing (~$0.10/min effective rate) and the Creator plan economics:

| Estimate     | Credits/Min | Included Minutes | Included Calls (@ 2.5 min avg) |
| ------------ | :---------: | :--------------: | :----------------------------: |
| Conservative |     500     |     200 min      |           ~80 calls            |
| Moderate     |     350     |     285 min      |           ~114 calls           |
| Optimistic   |     250     |     400 min      |           ~160 calls           |

> **Action item:** Check actual credit consumption in the ElevenLabs dashboard after a few calls to determine the exact rate. This number is critical for all cost projections below.

### 1.3 Google Cloud Run — Current Configuration

| Attribute     | Value                                    |
| ------------- | ---------------------------------------- |
| Region        | us-central1 (Tier 1 pricing)             |
| vCPU          | 1                                        |
| Memory        | 512 MiB                                  |
| Min instances | 1 (always-on for cron scheduler)         |
| Max instances | 1                                        |
| Pricing tier  | Tier 1 (same rate as asia-south1 Mumbai) |

**Monthly breakdown:**

| Component          | Calculation                                     |    Monthly Cost     |
| ------------------ | ----------------------------------------------- | :-----------------: |
| vCPU (always-on)   | 1 vCPU × $0.00001800/sec × 2,592,000 sec/month  |   $46.66 (₹4,199)   |
| Memory (always-on) | 0.5 GiB × $0.00000200/sec × 2,592,000 sec/month |    $2.59 (₹233)     |
| Requests           | Minimal (well under 2M free tier)               |        $0.00        |
| **Total**          |                                                 | **$49.25 (₹4,433)** |

### 1.4 Azure Cosmos DB (MongoDB API)

| Attribute      | Value                                          |
| -------------- | ---------------------------------------------- |
| Throughput     | 400 RU/s provisioned                           |
| Free tier      | 1,000 RU/s + 25 GB storage (lifetime free)     |
| Effective cost | **₹0/month** (free tier covers 400 RU/s fully) |
| Storage used   | < 1 GB (well within 25 GB free)                |
| Region         | India Central                                  |

> Free tier saves ~₹2,102/month ($23.36) compared to paid 400 RU/s.

---

## 2. Variable Costs Per Call

These costs are incurred for every AI voice call made.

### 2.1 ElevenLabs — Conversational AI

| Metric                         | Value                  |
| ------------------------------ | ---------------------- |
| Average call duration          | 2 minutes              |
| Per-minute rate (Creator plan) | ~$0.10/min = ₹9.00/min |
| **Cost per call**              | **₹18.00** ($0.20)     |

**Within included credits:** If a call consumes ~350 credits/min, then 2 min = 700 credits per call. With 100,000 included credits, you get ~143 calls "free" (already paid for in the ₹1,936 subscription).

**Beyond included credits:** ₹26.40/1000 credits × 700 credits = **₹18.48 per additional call**.

### 2.2 Twilio — Voice (Outbound to India)

| Metric                | Value                                          |
| --------------------- | ---------------------------------------------- |
| Route                 | US number (+1) → India mobile (+91)            |
| Per-minute rate       | $0.0405/min (destination-based to India mobile) |
| INR equivalent        | ₹3.65/min ($0.0405 × 90)                      |
| Average call duration | 2 minutes                                      |
| **Cost per call**     | **₹7.29** ($0.081)                            |

> **Note:** Twilio uses destination-based pricing. India mobile is $0.0405/min; landline is $0.0497/min. Assuming majority are mobile numbers. If call goes unanswered or busy, Twilio still charges minimally for the connection attempt.

### 2.3 Twilio — WhatsApp Notifications

| Message Type                       | Meta Fee (₹) | Twilio Fee (₹) | Total Per Message (₹) | When Sent                   |
| ---------------------------------- | :----------: | :------------: | :-------------------: | --------------------------- |
| Post-call report (Utility)         |    ₹0.115    |     ₹0.45      |       **₹0.57**       | After every completed call  |
| Missed call alert (Utility)        |    ₹0.115    |     ₹0.45      |       **₹0.57**       | After max retries exhausted |
| Weekly report (Utility)            |    ₹0.115    |     ₹0.45      |       **₹0.57**       | Every Sunday                |
| Critical medicine missed (Utility) |    ₹0.115    |     ₹0.45      |       **₹0.57**       | On critical medicine miss   |

### 2.4 Summary — Total Cost Per Successful Call

| Component                     |  Cost (₹)  |  Cost ($)  | % of Total |
| ----------------------------- | :--------: | :--------: | :--------: |
| ElevenLabs Conversational AI  |   ₹18.00   |   $0.200   |   70.8%    |
| Twilio Voice (destination-based) |   ₹7.29    |   $0.081   |   28.7%    |
| WhatsApp post-call report     |   ₹0.57    |   $0.006   |    2.2%    |
| WhatsApp critical alert (avg) |   ₹0.05    |   $0.001   |    0.2%    |
| **Total per successful call** | **₹25.91** | **$0.288** |  **100%**  |

> **ElevenLabs is 71% of variable costs.** With 2-minute calls, per-call cost drops to ₹25.91 (from ₹32.23 at 2.5 min). Voice AI remains the dominant cost lever.

---

## 3. Variable Costs Per Patient Per Month

### 3.1 By Subscription Plan

| | Suraksha (सुरक्षा) | Sampurna (सम्पूर्ण) |
|---|:---:|:---:|
| **Price** | **$15/month (₹1,350)** | **$20/month (₹1,800)** |
| **Calls per week** | 7 (1/day) | 14 (2/day) |
| **Calls per month** | ~30 | ~60 |
| **Call minutes/month** | 60 min | 120 min |
| | | |
| **ElevenLabs** | ₹540 | ₹1,080 |
| **Twilio Voice** (destination-based) | ₹219 | ₹437 |
| **WhatsApp (post-call)** | ₹17.10 | ₹34.20 |
| **WhatsApp (weekly report)** | ₹2.28 | ₹2.28 |
| **WhatsApp (misc alerts)** | ₹3.00 | ₹5.00 |
| | | |
| **Total variable cost/patient** | **₹781** | **₹1,559** |
| **Revenue/patient** | **₹1,350 ($15)** | **₹1,800 ($20)** |
| **Margin/patient** | **+₹569** | **+₹241** |
| **Margin %** | **+42%** | **+13%** |

### 3.2 Key Insight — Unit Economics

| Plan | Profitable? | Margin |
|------|:-----------:|--------|
| Suraksha | **Yes (+₹569/patient)** | Strong — 42% variable margin at 1 call/day |
| Sampurna | **Yes (+₹241/patient)** | Profitable — 13% margin at 2 calls/day |

> **Both plans are profitable with 2-minute calls.** Reducing call duration from 2.5 to 2 minutes drops per-call cost from ₹32.23 to ₹25.91 (20% reduction), which restores Sampurna profitability. Suraksha margin improves from 28% to 42%. This demonstrates that **call duration optimization is immediately actionable** and has substantial impact on unit economics.

---

## 4. Scenario Analysis — Monthly Costs by User Count

### Assumptions

- Plan mix: 50% Suraksha, 50% Sampurna
- Weighted average calls per patient per month: ~45 calls
- Average cost per call: ₹26.34
- Blended average revenue per patient: ₹1,575/month ($17.50)
- Call answer rate: 80% (20% of calls are unanswered — Twilio still charges minimally for failed attempts)
- Retry calls: 1.5 retries per missed call (adds ~10% more call attempts)

### 4.1 Monthly Cost Breakdown by Scale

#### 10 Patients (Pre-launch / Testing)

| Category | Monthly Cost (₹) | Monthly Cost ($) |
|----------|:-----------------:|:----------------:|
| **Fixed Infrastructure** | | |
| ElevenLabs Creator | ₹1,936 | $21.51 |
| Google Cloud Run | ₹4,433 | $49.25 |
| Cosmos DB | ₹0 | $0.00 |
| Twilio number | ₹90 | $1.00 |
| Vercel Pro | ₹1,800 | $20.00 |
| Domain | ₹100 | $1.11 |
| **Subtotal Fixed** | **₹8,359** | **$92.88** |
| | | |
| **Variable (10 patients, ~450 calls, 900 min)** | | |
| ElevenLabs voice calls | ₹8,100 | $90.00 |
| Twilio voice (destination-based) | ₹3,280 | $36.45 |
| WhatsApp notifications (~510 msgs) | ₹291 | $3.23 |
| **Subtotal Variable** | **₹11,671** | **$129.68** |
| | | |
| **TOTAL** | **₹20,030** | **$222.56** |
| **Per patient** | **₹2,003** | **$22.26** |

| Revenue (blended avg ₹1,575/patient) | ₹15,750 | $175.00 |
|---------------------------------------|:--------:|:-------:|
| **Net Loss** | **-₹4,280** | **-$47.56** |

---

#### 50 Patients (MVP / Early Traction)

| Category | Monthly Cost (₹) | Monthly Cost ($) |
|----------|:-----------------:|:----------------:|
| **Fixed Infrastructure** | **₹8,359** | **$92.88** |
| **Variable (50 patients, ~2,250 calls, 4,500 min)** | | |
| ElevenLabs voice calls | ₹40,500 | $450.00 |
| Twilio voice (destination-based) | ₹16,402 | $182.25 |
| WhatsApp notifications (~2,550 msgs) | ₹1,454 | $16.16 |
| **Subtotal Variable** | **₹58,356** | **$648.41** |
| | | |
| **TOTAL** | **₹66,715** | **$741.29** |
| **Per patient** | **₹1,334** | **$14.83** |

| Revenue (blended avg ₹1,575/patient) | ₹78,750 | $875.00 |
|---------------------------------------|:--------:|:-------:|
| **Net Profit** | **+₹12,035** | **+$133.71** |

> **Profitable at 50 patients with 2-minute calls!** Break-even drops to ~34 patients. This demonstrates the dramatic impact of call duration optimization — a 20% reduction (2.5→2 min) moves break-even from ~51 to ~34 patients.

---

#### 100 Patients (Growth)

| Category | Monthly Cost (₹) | Monthly Cost ($) |
|----------|:-----------------:|:----------------:|
| **Fixed Infrastructure** | | |
| ElevenLabs Scale plan | ₹29,040 | $322.67 |
| Cloud Run (scale to 2 vCPU, 1 GiB) | ₹8,865 | $98.50 |
| Cosmos DB (may need 800 RU/s) | ₹0 | $0 (still under free tier 1,000 RU/s) |
| Twilio number | ₹90 | $1.00 |
| Vercel Pro | ₹1,800 | $20.00 |
| Domain | ₹100 | $1.11 |
| **Subtotal Fixed** | **₹39,895** | **$443.28** |
| | | |
| **Variable (100 patients, ~4,500 calls, 9,000 min)** | | |
| ElevenLabs voice calls | ₹81,000 | $900.00 |
| Twilio voice (destination-based) | ₹32,805 | $364.50 |
| WhatsApp notifications (~5,100 msgs) | ₹2,907 | $32.30 |
| **Subtotal Variable** | **₹116,712** | **$1,296.80** |
| | | |
| **TOTAL** | **₹156,607** | **$1,740.08** |
| **Per patient** | **₹1,566** | **$17.40** |

| Revenue (blended avg ₹1,575/patient) | ₹1,57,500 | $1,750.00 |
|---------------------------------------|:---------:|:---------:|
| **Net Profit** | **+₹893** | **+$9.92** |

> **Profitable at 100 patients with 2-minute calls!** ElevenLabs Scale plan becomes viable. The 2-minute optimization reduces costs by ~₹28K/month vs 2.5-minute scenario. This is the most impactful single optimization — more valuable than ElevenLabs plan upgrades.

---

#### 500 Patients (Scaling)

| Category | Monthly Cost (₹) | Monthly Cost ($) |
|----------|:-----------------:|:----------------:|
| **Fixed Infrastructure** | | |
| ElevenLabs Business plan | ₹1,16,160 | $1,290.67 |
| Cloud Run (2 instances, 2 vCPU each) | ₹17,730 | $197.00 |
| MongoDB Atlas M10 (migrate from Cosmos) | ₹5,130 | $57.00 |
| Twilio number | ₹90 | $1.00 |
| Vercel Pro | ₹1,800 | $20.00 |
| Domain | ₹100 | $1.11 |
| **Subtotal Fixed** | **₹1,41,010** | **$1,566.78** |
| | | |
| **Variable (500 patients, ~22,500 calls, 45,000 min)** | | |
| ElevenLabs voice (Business $0.08/min × 2 min) | ₹3,24,000 | $3,600.00 |
| Twilio voice (destination-based) | ₹1,63,975 | $1,821.95 |
| WhatsApp notifications (~25,500 msgs) | ₹14,535 | $161.50 |
| **Subtotal Variable** | **₹5,02,510** | **$5,583.45** |
| | | |
| **TOTAL** | **₹6,43,520** | **$7,150.23** |
| **Per patient** | **₹1,287** | **$14.30** |

| Revenue (blended avg ₹1,575/patient) | ₹7,87,500 | $8,750.00 |
|---------------------------------------|:---------:|:---------:|
| **Net Profit** | **+₹1,43,980** | **+$1,599.77** |

---

#### 1,000 Patients (Scale — with Enterprise pricing)

| Category | Monthly Cost (₹) | Monthly Cost ($) |
|----------|:-----------------:|:----------------:|
| **Fixed Infrastructure** | | |
| ElevenLabs Enterprise | ₹1,60,000 (est.) | $1,778 |
| Cloud Run (3 instances, auto-scaling) | ₹26,595 | $295.50 |
| MongoDB Atlas M20 | ₹13,500 | $150.00 |
| Twilio number | ₹90 | $1.00 |
| Vercel Pro | ₹1,800 | $20.00 |
| Domain | ₹100 | $1.11 |
| **Subtotal Fixed** | **₹2,02,085** | **$2,245.61** |
| | | |
| **Variable (1,000 patients, ~45,000 calls, 90,000 min)** | | |
| ElevenLabs voice (Enterprise $0.06/min × 2 min) | ₹4,86,000 | $5,400.00 |
| Twilio voice (destination-based) | ₹3,27,950 | $3,644.44 |
| WhatsApp notifications (~51,000 msgs) | ₹29,070 | $323.00 |
| **Subtotal Variable** | **₹8,43,020** | **$9,367.44** |
| | | |
| **TOTAL** | **₹10,45,105** | **$11,613.05** |
| **Per patient** | **₹1,045** | **$11.61** |

| Revenue (blended avg ₹1,575/patient) | ₹15,75,000 | $17,500.00 |
|---------------------------------------|:----------:|:----------:|
| **Net Profit** | **+₹7,29,895** | **+$8,106.95** |

> **Highly profitable at 1,000 patients with 2-minute calls and Enterprise pricing.** 2-minute optimization delivers ₹3.6M additional annual profit vs 2.5-minute scenario. Per-patient cost drops to ₹1,045 (vs ₹1,249 at 2.5 min).

---

### 4.2 Summary — Monthly Costs at Scale (ElevenLabs Stack, 2-minute calls)

| Patients | Monthly Cost (₹) | Monthly Revenue (₹) | Profit/Loss (₹) | Per-Patient Cost |
|:--------:|:-----------------:|:--------------------:|:----------------:|:----------------:|
| 10 | ₹20,030 | ₹15,750 | **-₹4,280** | ₹2,003 |
| 50 | ₹66,715 | ₹78,750 | **+₹12,035** | ₹1,334 |
| 100 | ₹1,56,607 | ₹1,57,500 | **+₹893** | ₹1,566 |
| 500 | ₹6,43,520 | ₹7,87,500 | **+₹1,43,980** | ₹1,287 |
| 1,000 | ₹10,45,105 | ₹15,75,000 | **+₹7,29,895** | ₹1,045 |
| 2,500 (est.) | ₹23,50,000 | ₹39,37,500 | **+₹15,87,500** | ₹940 |

> **With 2-minute calls, ElevenLabs breaks even at ~34 patients** (vs ~50 at 2.5 min and ~500 with 2.5-min + destination-based Twilio). This shows call duration optimization is **more impactful than plan upgrades**. The 20% duration reduction delivers more profit improvement than upgrading from Creator to Scale plan.

---

## 5. Revenue vs Cost — Profitability by Plan

### 5.1 Per-Patient Monthly P&L (Creator plan, 2-minute calls)

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs ($0.10/min × 2 min) | -₹540 | -₹1,080 |
| Twilio Voice (destination-based) | -₹219 | -₹437 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹569** | **+₹241** |
| Fixed cost share (50 users) | -₹167 | -₹167 |
| **Net margin** | **+₹402** | **+₹74** |

> **Both plans are profitable** with 2-minute calls. Sampurna margin improves from -8% to +13%. This demonstrates that call duration is **the primary profitability lever** — more impactful than pricing changes or plan selection.

### 5.2 Per-Patient Monthly P&L (Enterprise ElevenLabs at $0.06/min × 2 min)

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs ($0.06/min × 2 min) | -₹324 | -₹648 |
| Twilio Voice (destination-based) | -₹219 | -₹437 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹785** | **+₹674** |
| Fixed cost share (500 users) | -₹28 | -₹28 |
| **Net margin** | **+₹757** | **+₹646** |

> Enterprise ElevenLabs with 2-minute calls delivers very strong margins. Weighted average net margin: ~₹701/patient/month (vs ~₹498 at 2.5 min Enterprise).

### 5.3 Per-Patient Monthly P&L (Enterprise ElevenLabs + Knowlarity SIP, 2 min calls)

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs ($0.06/min × 2 min) | -₹324 | -₹648 |
| Knowlarity SIP (₹0.40/min × 2 min) | -₹240 | -₹480 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹764** | **+₹631** |
| Fixed cost share (500 users) | -₹28 | -₹28 |
| **Net margin** | **+₹736** | **+₹603** |

> **Enterprise + Knowlarity + 2-minute calls:** Weighted average net margin ~₹669/patient/month. This is the "full ElevenLabs optimization path" — high margins without technology stack changes.

### 5.4 Per-Patient Monthly P&L (Enterprise + SIP + 90-second calls — Best Case)

Future optimization scenario: reduce calls from current 2 minutes to 90 seconds:

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs ($0.06/min × 1.5 min) | -₹243 | -₹486 |
| Knowlarity SIP (₹0.40/min × 1.5 min) | -₹180 | -₹360 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹905** | **+₹913** |
| Fixed cost share (1000 users) | -₹20 | -₹20 |
| **Net margin** | **+₹885** | **+₹893** |

> **With 90-second calls, both plans converge to ~₹890/patient/month margins** (~67% margin). This requires: (1) Enterprise pricing, (2) Indian SIP trunk, (3) further 25% call duration reduction, (4) 1,000+ user scale. **Current 2-minute baseline is already near 70% margin** (at 500+ scale with Enterprise pricing). Sarvam stack can achieve similar margins at 50-100 patient scale (see Section 10).

---

## 6. Annual Cost Projections

### 6.1 Year 1 — MVP to 100 Users

| Quarter | Patients | Monthly Cost (₹) | Quarterly Cost (₹) | Revenue (₹) | Quarterly P/L (₹) |
|:-------:|:--------:|:-----------------:|:-------------------:|:----------:|:------------------:|
| Q1 | 10→25 | ₹20K→₹38K | ₹87,000 | ₹82,000 | -₹5,000 |
| Q2 | 25→50 | ₹38K→₹68K | ₹1,57,000 | ₹1,77,000 | +₹20,000 |
| Q3 | 50→75 | ₹68K→₹97K | ₹2,48,000 | ₹2,95,000 | +₹47,000 |
| Q4 | 75→100 | ₹97K→₹1.3L | ₹3,36,000 | ₹4,13,000 | +₹77,000 |
| | | | | | |
| **Year 1 Total** | | | **₹8,28,000** | **₹9,67,000** | **+₹1,39,000** |

> **Year 1 is profitable overall** with $15/$20 USD pricing. Break-even at ~22 patients (likely within Q1). Total Year 1 profit: ~₹1.4 lakh (~$1,544).

### 6.2 Year 2 — 100 to 500 Users (with cost optimizations)

Assumes: ElevenLabs Scale plan by Q1, Business plan by Q3, Indian SIP trunk by Q2, 90-sec calls by Q2.

| Quarter | Patients | Monthly Cost (₹) | Quarterly Cost (₹) | Revenue (₹) | Quarterly P/L (₹) |
|:-------:|:--------:|:-----------------:|:-------------------:|:----------:|:------------------:|
| Q1 | 100→200 | ₹1.3L→₹2.5L | ₹5,70,000 | ₹7,09,000 | +₹1,39,000 |
| Q2 | 200→350 | ₹2.0L→₹2.8L | ₹7,20,000 | ₹12,95,000 | +₹5,75,000 |
| Q3 | 350→500 | ₹3.5L→₹4.8L | ₹12,45,000 | ₹20,02,000 | +₹7,57,000 |
| Q4 | 500→500 | ₹4.8L | ₹14,40,000 | ₹23,63,000 | +₹9,23,000 |
| | | | | | |
| **Year 2 Total** | | | **₹39,75,000** | **₹63,69,000** | **+₹23,94,000** |

> **Year 2: Strongly profitable throughout.** ~₹24 lakh profit (~$26,600). Cost optimizations (90-sec calls + SIP trunk) widen margins significantly from Q2 onwards.

---

## 7. Cost Optimization Roadmap

### 7.1 Priority-Ordered Optimizations

| # | Optimization | Savings | Effort | When to Do |
|:-:|-------------|:-------:|:------:|:----------:|
| 1 | **Shorten average call to 90 seconds** (from 2.5 min) | 40% on ElevenLabs + Twilio | Medium — prompt engineering | Immediate |
| 2 | **Negotiate ElevenLabs Enterprise** | 40-50% on voice AI | Low — email sales | At 200+ patients |
| 3 | **Switch to Indian SIP trunk (Knowlarity/Exotel)** | 60-70% on telephony | Medium — SIP config | At 100+ patients |
| 4 | **Optimize WhatsApp: use utility templates during service window** | Meta fee waived (save ₹0.115/msg) | Low — template configuration | Immediate |
| 5 | **Move Cloud Run to asia-south1 (Mumbai)** | Same cost, lower latency | Low — redeploy | Next deployment |
| 6 | **Self-hosted TTS (Sarvam AI / Coqui XTTS)** | 80-90% on voice AI | Very High — major rebuild | At 1,000+ patients |

### 7.2 Impact of Shortening Calls to 90 Seconds

The single highest-impact optimization. Reducing average call from 2.5 min to 1.5 min:

| Metric | Current (2.5 min) | Optimized (1.5 min) | Savings |
|--------|:-----------------:|:-------------------:|:-------:|
| ElevenLabs per call | ₹22.50 | ₹13.50 | ₹9.00 (40%) |
| Twilio per call | ₹3.22 | ₹1.94 | ₹1.28 (40%) |
| **Total per call** | **₹26.34** | **₹16.01** | **₹10.33 (39%)** |
| Suraksha monthly cost/patient | ₹794 | ₹503 | ₹291 (37%) |
| Sampurna monthly cost/patient | ₹1,585 | ₹1,003 | ₹582 (37%) |
| **Suraksha margin** | **+₹556** | **+₹847** | +₹291 improvement |
| **Sampurna margin** | **+₹215** | **+₹797** | +₹582 improvement |

> **90-second calls significantly boost already-positive margins.** Suraksha margin jumps to 63%, Sampurna to 44%. Weighted average margin increases from ₹386 to ₹822/patient. Break-even drops to ~10 patients.

### 7.4 Impact of Indian SIP Trunking

| Provider               | Per-Minute Rate (₹) | Per Call (2.5 min) | vs Twilio Savings |
| ---------------------- | :-----------------: | :----------------: | :---------------: |
| **Twilio (current)**   |        ₹1.29        |       ₹3.22        |         —         |
| **Knowlarity Premium** |        ₹0.40        |       ₹1.00        |        69%        |
| **Knowlarity Advance** |        ₹0.60        |       ₹1.50        |        53%        |
| **Exotel Influencer**  |        ₹1.27        |       ₹3.18        |        1%         |

> **Knowlarity Premium at ₹0.40/min is the best option** — saves 69% on telephony. However, Twilio voice is only 12% of total per-call cost, so the absolute savings are small (₹2.22/call). Prioritize ElevenLabs optimization first.

### 7.5 Sarvam AI as Indian Alternative to ElevenLabs

| Feature           | ElevenLabs                        | Sarvam AI                            |
| ----------------- | --------------------------------- | ------------------------------------ |
| Conversational AI | Yes (mature)                      | Yes (Samvaad — newer)                |
| Indian languages  | 8+ via multilingual model         | 11+ (purpose-built for India)        |
| TTS quality       | Excellent                         | Good (Bulbul v3)                     |
| STT               | Built-in                          | ₹30/hour (₹0.50/min)                 |
| TTS cost          | ~₹9.00/min (included in conv. AI) | ₹30/10K characters                   |
| LLM               | Gemini (external)                 | Sarvam-M (free) + external LLMs      |
| Telephony         | Via Twilio/SIP                    | Built-in (Samvaad)                   |
| Pricing           | $0.08-0.10/min                    | Not publicly listed for voice agents |
| Maturity          | Production-ready                  | Early stage                          |

> **Worth evaluating at 500+ patients.** Sarvam is purpose-built for Indian languages and could significantly reduce costs if their voice agent quality matches ElevenLabs. See [Section 10](#10-sarvam-stack--full-cost-comparison) for the detailed analysis.

---

## 8. When to Upgrade Each Service

| Service        | Current Plan         | Upgrade When                       | Upgrade To                     |     New Monthly Cost     |
| -------------- | -------------------- | ---------------------------------- | ------------------------------ | :----------------------: |
| **ElevenLabs** | Creator (₹1,936)     | >114 calls/month (~40 patients)    | Scale (₹29,040)                |         ₹29,040          |
| **ElevenLabs** | Scale                | >500 patients                      | Business (₹1,16,160)           |        ₹1,16,160         |
| **ElevenLabs** | Business             | >1,000 patients                    | Enterprise (custom)            |        Negotiable        |
| **Cloud Run**  | 1 vCPU, 512 MiB      | >50 concurrent calls               | 2 vCPU, 1 GiB                  |          ₹8,865          |
| **Cloud Run**  | Single instance      | >200 patients                      | 2-3 instances, auto-scaling    |     ₹17,730-₹26,595      |
| **Cosmos DB**  | Free tier (400 RU/s) | >1,000 RU/s needed (~200 patients) | 800-1,600 RU/s provisioned     |      ₹2,102-₹4,205       |
| **Database**   | Cosmos DB            | >500 patients                      | MongoDB Atlas M10 (GCP Mumbai) |          ₹5,130          |
| **Vercel**     | Hobby (₹0)           | Before launch (commercial use)     | Pro                            |          ₹1,800          |
| **Twilio**     | US number            | >100 patients                      | Indian SIP trunk (Knowlarity)  | ₹2,450/month + ₹0.40/min |

### ElevenLabs Plan Comparison

| Plan       |    Monthly Cost    | Credits Included |              Additional Credits              | Best For           |
| ---------- | :----------------: | :--------------: | :------------------------------------------: | ------------------ |
| Creator    |    ₹1,936 ($22)    |       100K       |                 ₹26.40/1000                  | 1-30 patients      |
| Pro        |    ₹8,910 ($99)    |       500K       |                 ₹26.40/1000                  | 30-100 patients    |
| Scale      |   ₹29,040 ($323)   |    2,000,000     |                 ₹15.84/1000                  | 100-300 patients   |
| Business   | ₹1,16,160 ($1,291) |    11,000,000    | ₹8.80/1000 (annual) or ₹10.56/1000 (monthly) | 300-1,000 patients |
| Enterprise |       Custom       |      Custom      |             As low as $0.03/1000             | 1,000+ patients    |

---

## 9. Future Verticals — Incremental Cost Impact

### 9.1 Vaccination Tracking (Newborns)

| Cost Factor         | Difference from Medicine Adherence                       | Impact                                |
| ------------------- | -------------------------------------------------------- | ------------------------------------- |
| Call frequency      | Lower — 1 reminder call per vaccination dose (not daily) | **Significantly cheaper per patient** |
| Call duration       | Shorter — simple yes/no confirmation (~1 min)            | ~60% less than medicine calls         |
| Duration of service | Longer — 2-5 years per child                             | Higher LTV but spread over time       |
| WhatsApp            | More — schedule reminders between calls                  | Slightly higher messaging cost        |

**Estimated per-patient monthly cost (vaccination tracking):**

| Component                            | Estimated Cost |
| ------------------------------------ | :------------: |
| AI calls (~4/month avg, ~1 min each) |      ₹46       |
| Twilio voice                         |       ₹5       |
| WhatsApp reminders (~8/month)        |       ₹5       |
| **Total**                            | **~₹56/month** |

> At $5-10/month pricing, vaccination tracking is **highly profitable per-unit** due to low call frequency. Even at $5/month (₹450) pricing, yields +₹394 margin.

### 9.2 Pregnancy Care

| Cost Factor         | Difference from Medicine Adherence                      | Impact                           |
| ------------------- | ------------------------------------------------------- | -------------------------------- |
| Call frequency      | Similar — daily or alternate day                        | Comparable to medicine adherence |
| Call duration       | Longer — wellness checks, symptom assessment (~3-4 min) | 20-60% more expensive per call   |
| Duration of service | Fixed — 9-10 months                                     | Predictable cost                 |
| Complexity          | Higher — trimester-specific protocols                   | More prompt engineering needed   |

**Estimated per-patient monthly cost (pregnancy care):**

| Component                                 |  Estimated Cost   |
| ----------------------------------------- | :---------------: |
| AI calls (daily, ~30/month, ~3.5 min avg) |       ₹945        |
| Twilio voice                              |       ₹135        |
| WhatsApp reports + alerts (~40/month)     |        ₹23        |
| **Total**                                 | **~₹1,103/month** |

> At ₹599/month (India) pricing, pregnancy care is a loss (-₹504). At $12.99/month (~₹1,169) for NRI families, it's marginally profitable (+₹66). **Bundle pricing with vaccination tracking is essential for profitability.**

### 9.3 Combined "Birth to 2 Years" Bundle

| Phase                                  | Duration  | Monthly Cost | Monthly Revenue (₹699 bundle) |
| -------------------------------------- | :-------: | :----------: | :---------------------------: |
| Pregnancy                              | 9 months  |    ₹1,103    |             ₹699              |
| Vaccination (intensive, 0-14 weeks)    | 4 months  |     ₹215     |             ₹699              |
| Vaccination (maintenance, 9-24 months) | 16 months |     ₹56      |             ₹699              |
|                                        |           |              |                               |
| **Weighted average**                   | 29 months |   **₹411**   |           **₹699**            |
| **Blended margin**                     |           |              |    **+₹288/month (+41%)**     |
| **Total LTV**                          | 29 months | ₹11,919 cost |        ₹20,271 revenue        |
| **Total profit per customer**          |           |              |          **+₹8,352**          |

> **The bundle is highly profitable** because the low-cost vaccination maintenance phase (16 months) subsidizes the high-cost pregnancy phase (9 months). At ₹699/month, each customer generates ₹8,352 profit over 29 months.

---

## 10. Sarvam Stack — Full Cost Comparison

> **Added:** February 2026. Compares the production-ready Sarvam voice stack (LiveKit + Sarvam STT/TTS + Gemini LLM + Exotel SIP) against the current ElevenLabs stack.

The system supports switchable voice stacks via the `VOICE_STACK` environment variable (`elevenlabs` or `sarvam`), enabling A/B testing and graceful fallback.

### 10.1 Stack Component Mapping

| Function | ElevenLabs Stack | Sarvam Stack |
|---|---|---|
| **STT** | Built-in (ElevenLabs ConvAI) | Sarvam STT saaras:v3 — ₹30/hr (₹0.50/min) |
| **TTS** | Built-in (ElevenLabs ConvAI) | Sarvam TTS bulbul:v3 — ₹30/10K chars |
| **LLM** | Built-in (Gemini via ElevenLabs) | Google Gemini 1.5 Flash — $0.075/$0.30 per 1M tokens |
| **Real-time comms** | ElevenLabs Conversational AI | LiveKit Cloud — $0.01/min agent session |
| **Telephony** | Twilio US→India ($0.0143/min) | Exotel India→India (₹1.27/min) |
| **Agent hosting** | Fully managed by ElevenLabs | Self-managed Python worker on Cloud Run |
| **WhatsApp** | Twilio | Twilio (unchanged) |

### 10.2 Per-Call Variable Cost Comparison (2.5 min avg)

#### ElevenLabs Stack — ₹25.91/call (2-minute calls)

| Component | Cost/call (₹) | % of Total |
|---|:---:|:---:|
| ElevenLabs Conversational AI ($0.10/min × 2 min) | ₹18.00 | 69.4% |
| Twilio Voice (US→India, destination-based) | ₹7.29 | 28.1% |
| WhatsApp post-call + alerts | ₹0.62 | 2.4% |
| **Total** | **₹25.91** | **100%** |

#### Sarvam Stack (LiveKit Cloud) — ₹9.17/call (2-minute calls)

| Component | Rate | Cost/call (₹) | % of Total |
|---|---|:---:|:---:|
| Sarvam STT (saaras:v3) | ₹0.50/min × 2 min | ₹1.00 | 10.9% |
| Sarvam TTS (bulbul:v3) | ₹30/10K chars × ~800 chars | ₹2.40 | 26.2% |
| Gemini 1.5 Flash | ~9.6K input + 2.4K output tokens | ₹0.09 | 1.0% |
| LiveKit agent session | $0.01/min × 2 min | ₹1.80 | 19.6% |
| LiveKit SIP (3rd-party) | $0.004/min × 2 min | ₹0.72 | 7.9% |
| Exotel telephony | ₹1.27/min × 2 min | ₹2.54 | 27.7% |
| WhatsApp | same | ₹0.62 | 6.8% |
| **Total** | | **₹9.17** | **100%** |

> **Per-call savings: ₹16.74 (65%).** Sarvam now costs ₹9.17/call vs ElevenLabs' ₹25.91/call. The Sarvam architecture (unbundled STT+TTS+LLM+telecom) costs ~35% of ElevenLabs' bundled solution. This savings advantage is **even more dramatic with 2-minute calls** because fixed components (LiveKit hosting, Exotel SIP) distribute over the same minutes as 2.5-min calls.

### 10.3 Fixed Monthly Costs Comparison

#### ElevenLabs Stack — ₹8,359/month

| Service | ₹/month |
|---|:---:|
| ElevenLabs Creator | ₹1,936 |
| Cloud Run (API server) | ₹4,433 |
| Cosmos DB | ₹0 |
| Twilio number | ₹90 |
| Vercel Pro | ₹1,800 |
| Domain | ₹100 |
| **Total** | **₹8,359** |

#### Sarvam Stack (LiveKit Cloud, Ship plan) — ₹15,533/month

| Service | ₹/month | Notes |
|---|:---:|---|
| LiveKit Cloud (Ship) | ₹4,500 | Includes 5,000 agent min + 5,000 SIP min |
| Python agent worker (Cloud Run) | ₹2,200 | 0.5 vCPU, 256 MiB, always-on |
| Cloud Run (API server) | ₹4,433 | Same |
| Cosmos DB | ₹0 | Same |
| Exotel base plan | ₹2,500 | SIP trunk subscription |
| Vercel Pro | ₹1,800 | Same |
| Domain | ₹100 | Same |
| **Total** | **₹15,533** | |

> **Fixed cost delta: +₹7,174/month.** Sarvam has higher fixed costs, but the variable savings (₹15.03/call) compensate at just **~478 calls/month (~11 patients)**.

### 10.4 Scenario Analysis — Side by Side

Assumptions: Same as Section 4 (50/50 plan mix, 2.5 min avg, 80% answer rate, ~45 calls/patient/month).

LiveKit Ship plan includes 5,000 agent minutes and 5,000 SIP minutes. Calls within the included allowance cost ₹8.16/call (no LiveKit per-minute charges). Calls exceeding the allowance cost ₹11.31/call.

#### 10 Patients (~450 calls/month, 900 agent min — all within LiveKit included)

| | ElevenLabs | Sarvam | Delta |
|---|:---:|:---:|:---:|
| Fixed | ₹8,359 | ₹15,533 | +₹7,174 |
| Variable (450 calls @ ₹25.91 / ₹9.17) | ₹11,659 | ₹4,127 | -₹7,532 |
| **Total** | **₹20,018** | **₹19,660** | **-₹358 (2%)** |
| Revenue | ₹15,750 | ₹15,750 | |
| **P/L** | **-₹4,268** | **-₹3,910** | **+₹358 better** |

#### 50 Patients (~2,250 calls/month, 4,500 agent min — all within LiveKit included)

| | ElevenLabs | Sarvam | Delta |
|---|:---:|:---:|:---:|
| Fixed | ₹8,359 | ₹15,533 | +₹7,174 |
| Variable | ₹58,356 | ₹20,633 | -₹37,723 |
| **Total** | **₹66,715** | **₹36,166** | **-₹30,549 (46%)** |
| Revenue | ₹78,750 | ₹78,750 | |
| **P/L** | **+₹12,035** | **+₹42,584** | **+₹30,549 better** |

#### 100 Patients (~4,500 calls/month, 9,000 agent min — 4,000 min overage)

ElevenLabs requires Scale plan upgrade (₹29,040). Sarvam stays on Ship + overages.

| | ElevenLabs | Sarvam | Delta |
|---|:---:|:---:|:---:|
| Fixed | ₹39,895 | ₹15,533 | -₹24,362 |
| Variable | ₹116,712 | ₹86,040 | -₹30,672 |
| **Total** | **₹1,56,607** | **₹1,01,573** | **-₹55,034 (35%)** |
| Revenue | ₹1,57,500 | ₹1,57,500 | |
| **P/L** | **+₹893** | **+₹55,927** | **+₹55,034 better** |

> **Major inflection point.** At 100 patients with 2-minute calls: ElevenLabs barely breaks even (+₹893), while Sarvam generates **₹55.9K/month profit** — a **₹55K swing**. This is where Sarvam's linear cost scaling demonstrates clear advantage over ElevenLabs' subscription cliffs (Creator→Scale→Business).

#### 500 Patients (~22,500 calls/month, 45,000 agent min)

LiveKit Scale plan ($500/mo = ₹45,000) becomes optimal at this scale. Ship + overages would require ₹36K overage charges.

| | ElevenLabs | Sarvam | Delta |
|---|:---:|:---:|:---:|
| Fixed | ₹1,41,010 | ₹63,833 | -₹77,177 |
| Variable | ₹5,02,510 | ₹2,42,325 | -₹2,60,185 |
| **Total** | **₹6,43,520** | **₹3,06,158** | **-₹3,37,362 (52%)** |
| Revenue | ₹7,87,500 | ₹7,87,500 | |
| **P/L** | **+₹1,43,980** | **+₹4,81,342** | **+₹3,37,362 better** |

*Fixed includes: LiveKit Scale ₹45,000, Python worker ₹2,200, Cloud Run 2× instances ₹8,865, Atlas M10 ₹5,130, Exotel ₹2,500, Vercel ₹1,800, Domain ₹100.*

#### 1,000 Patients (~45,000 calls/month, 90,000 agent min)

| | ElevenLabs | Sarvam | Delta |
|---|:---:|:---:|:---:|
| Fixed | ₹2,02,085 | ₹1,09,795 | -₹92,290 |
| Variable | ₹8,43,020 | ₹4,34,625 | -₹4,08,395 |
| **Total** | **₹10,45,105** | **₹5,44,420** | **-₹5,00,685 (48%)** |
| Revenue | ₹15,75,000 | ₹15,75,000 | |
| **P/L** | **+₹7,29,895** | **+₹10,30,580** | **+₹5,00,685 better** |

*Fixed includes: LiveKit Scale ₹45,000 + ₹10,800 overage, Python worker ₹4,400, Cloud Run 3× ₹26,595, Atlas M20 ₹13,500, Exotel ₹2,500, Vercel ₹1,800, Domain ₹100.*

### 10.5 Summary — Monthly Costs at Scale (Both Stacks, 2-minute calls)

| Patients | ElevenLabs Cost | Sarvam Cost | Savings | EL Profit | Sarvam Profit |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 10 | ₹20,018 | ₹19,660 | ₹358 (2%) | -₹4,268 | -₹3,910 |
| 50 | ₹66,715 | ₹36,166 | ₹30,549 (46%) | +₹12,035 | +₹42,584 |
| **100** | **₹1,56,607** | **₹1,01,573** | **₹55,034 (35%)** | **+₹893** | **+₹55,927** |
| 500 | ₹6,43,520 | ₹3,06,158 | ₹3,37,362 (52%) | +₹1,43,980 | +₹4,81,342 |
| 1,000 | ₹10,45,105 | ₹5,44,420 | ₹5,00,685 (48%) | +₹7,29,895 | +₹10,30,580 |

### 10.6 Per-Patient Unit Economics (Sarvam Stack)

#### Variable Margins — Sarvam vs ElevenLabs

| | Sarvam Suraksha | Sarvam Sampurna | EL Suraksha | EL Sampurna |
|---|:---:|:---:|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 | ₹1,350 | ₹1,800 |
| STT (Sarvam) | -₹37 | -₹75 | — | — |
| TTS (Sarvam) | -₹90 | -₹180 | — | — |
| LLM (Gemini) | -₹3 | -₹7 | — | — |
| Exotel Voice | -₹95 | -₹191 | — | — |
| ElevenLabs | — | — | -₹675 | -₹1,350 |
| Twilio Voice | — | — | -₹97 | -₹194 |
| WhatsApp | -₹22 | -₹41 | -₹22 | -₹41 |
| **Variable margin** | **+₹1,103** | **+₹1,306** | **+₹556** | **+₹215** |
| **Margin %** | **81.7%** | **72.6%** | **41.2%** | **11.9%** |

> **Sampurna (2 calls/day) goes from 12% margin to 73% margin.** This is the single biggest improvement — the plan that was barely profitable with ElevenLabs becomes highly profitable with Sarvam.

#### Break-Even Comparison

| Scenario | Break-Even Users |
|----------|:---:|
| ElevenLabs (Creator, 2.5 min) | ~22 users |
| **Sarvam (LiveKit Ship, 2.5 min)** | **~9 users** |
| ElevenLabs (90-sec calls) | ~10 users |
| **Sarvam (90-sec calls)** | **~6 users** |

### 10.7 No Subscription Cliffs

One of the biggest structural advantages of the Sarvam stack — no plan-upgrade cliffs:

| Scale | ElevenLabs Plan (Fixed) | Sarvam Stack (Fixed) |
|---|---|---|
| 1–30 patients | Creator ₹1,936 | Pay-as-you-go ₹0 (Sarvam) + LiveKit Build ₹0 |
| 30–100 patients | **Scale ₹29,040 (15× jump)** | LiveKit Ship ₹4,500 |
| 100–300 patients | Scale ₹29,040 | LiveKit Ship ₹4,500 + overages |
| 300–1,000 patients | **Business ₹1,16,160 (4× jump)** | LiveKit Scale ₹45,000 |

ElevenLabs has **15× jumps** (Creator→Scale) that temporarily destroy margins at transition points. Sarvam costs scale linearly with usage.

### 10.8 Further Optimizations (Sarvam Stack)

#### Knowlarity SIP (₹0.40/min) instead of Exotel (₹1.27/min)

| | Exotel | Knowlarity | Savings |
|---|:---:|:---:|:---:|
| Telephony per call (2.5 min) | ₹3.18 | ₹1.00 | ₹2.18 (69%) |
| **Total per call** | **₹11.31** | **₹9.13** | **₹2.18** |
| vs ElevenLabs | 57% cheaper | **65% cheaper** | |

#### 90-Second Calls (Sarvam Stack)

| Component | 2.5 min call | 1.5 min call | Savings |
|---|:---:|:---:|:---:|
| Sarvam STT | ₹1.25 | ₹0.75 | 40% |
| Sarvam TTS (~600 chars) | ₹3.00 | ₹1.80 | 40% |
| Gemini Flash | ₹0.11 | ₹0.07 | 36% |
| LiveKit (agent + SIP) | ₹3.15 | ₹1.89 | 40% |
| Exotel | ₹3.18 | ₹1.91 | 40% |
| WhatsApp | ₹0.62 | ₹0.62 | 0% |
| **Total** | **₹11.31** | **₹7.04** | **38%** |

#### Best-Case: Sarvam + Knowlarity + 90-Second Calls

| | Per Call | Suraksha Margin | Sampurna Margin |
|---|:---:|:---:|:---:|
| **₹4.86/call** | | **+₹1,204 (89%)** | **+₹1,508 (84%)** |

vs ElevenLabs best-case (Enterprise + SIP + 90s): ₹10.01/call, margins ₹1,047/₹1,217.

### 10.9 Trade-offs & Risks

| Factor | ElevenLabs | Sarvam Stack |
|---|---|---|
| **TTS quality** | Excellent (industry-leading) | Good (Bulbul v3 — purpose-built for Indian langs) |
| **Maturity** | Production-proven, 3+ years | Newer platform, rapidly improving |
| **Ops complexity** | Fully managed (zero infra) | Manage Python worker + LiveKit + Exotel SIP |
| **Indian language quality** | Good (multilingual model) | Better (native Indian language models, 11+ langs) |
| **Latency** | ~500ms first token | ~300–400ms (India-local infra potential) |
| **Vendor lock-in** | High (proprietary ConvAI platform) | Low (swap any component independently) |
| **Fallback** | Single vendor dependency | Dual-stack via `VOICE_STACK` config |
| **Concurrent calls** | Limited by ElevenLabs plan (2 on Creator) | Limited by LiveKit plan + Exotel trunk CPM |

### 10.10 LiveKit Plan Selection Guide

| Plan | Monthly | Included Agent Min | Included SIP Min | Optimal For |
|---|:---:|:---:|:---:|---|
| Build (Free) | ₹0 | 1,000 | 1,000 | Testing (< 7 patients) |
| Ship | ₹4,500 ($50) | 5,000 | 5,000 | 7–80 patients |
| Scale | ₹45,000 ($500) | 50,000 | 50,000 | 330+ patients |
| Enterprise | Custom | Custom | Custom | 1,000+ patients |

Overage rates: Agent $0.01/min, SIP $0.004/min (Ship) or $0.003/min (Scale).

Scale plan becomes cheaper than Ship + overages at **~330 patients** (37,143 total agent min/month).

### 10.11 Sarvam AI Credit Plan Guide

| Plan | Cost | Credits | Bonus | Rate Limit | Optimal For |
|---|:---:|:---:|:---:|:---:|---|
| Starter | Pay-as-you-go | ₹1,000 free | — | 60 req/min | < 50 patients |
| Pro | ₹10,000 | ₹11,000 | 10% | 200 req/min | 50–200 patients |
| Business | ₹50,000 | ₹57,500 | 15% | 1,000 req/min | 200+ patients |

Monthly Sarvam spend (STT+TTS) per call: ~₹4.25. Pro plan is worthwhile at ~₹10K/month spend (~52 patients).

### 10.12 Verdict

| Metric | ElevenLabs | Sarvam | Winner |
|---|---|---|---|
| Cost at 50 patients | ₹67,624/mo | ₹34,681/mo | **Sarvam (49% cheaper)** |
| Cost at 100 patients | ₹1,58,542/mo | ₹60,128/mo | **Sarvam (62% cheaper)** |
| Sampurna plan margin | 12% | 73% | **Sarvam (6× better)** |
| Break-even (patients) | ~22 | ~9 | **Sarvam** |
| Scaling linearity | Subscription cliffs | Linear pay-as-you-go | **Sarvam** |
| Ops simplicity | Fully managed | Self-managed worker | **ElevenLabs** |
| Voice quality | Excellent | Good (improving) | **ElevenLabs** |
| Indian language fit | Good | Purpose-built | **Sarvam** |

> **Recommended approach:** Use the dual-stack architecture. Start with ElevenLabs for quality assurance during early patients. Run Sarvam in parallel for A/B testing. Once Sarvam call quality is validated with real patients, switch primary traffic to Sarvam for **57–62% cost savings**. Keep ElevenLabs as fallback.

---

## Appendix A: Detailed Service Pricing Reference

### ElevenLabs (Verified from pricing page, Feb 2026)

| Plan       |    Monthly Cost    | Credits Included |               Additional Credits               |
| ---------- | :----------------: | :--------------: | :--------------------------------------------: |
| Creator    |    ₹1,936 ($22)    |     100,000      |                  ₹26.40/1,000                  |
| Pro        |    ₹8,910 ($99)    |     500,000      |                  ₹26.40/1,000                  |
| Scale      |   ₹29,040 ($323)   |    2,000,000     |                  ₹15.84/1,000                  |
| Business   | ₹1,16,160 ($1,291) |    11,000,000    | ₹8.80/1,000 (annual) or ₹10.56/1,000 (monthly) |
| Enterprise |       Custom       |      Custom      |             As low as $0.03/1,000              |

**Text to Speech (highest quality models):**

- Scale: 2,000,000 credits (~2,000 min)
- Business: 11,000,000 credits (~11,000 min)

**Turbo/Flash models:**

- Scale: 2,000,000 credits (~4,000 min)
- Business: 11,000,000 credits (~22,000 min)

### Twilio (Verified Feb 2026)

| Item                           | Rate                                          |
| ------------------------------ | --------------------------------------------- |
| US local number rental         | ₹90/month ($1.00)                             |
| US → India mobile (voice) **   | ₹3.65/min ($0.0405) — destination-based       |
| US → India landline (voice) ** | ₹4.47/min ($0.0497) — destination-based       |
| WhatsApp utility (India)       | ₹0.57/msg total (₹0.115 Meta + ₹0.45 Twilio)  |
| WhatsApp marketing (India)     | ₹1.23/msg total (₹0.7846 Meta + ₹0.45 Twilio) |
| WhatsApp service (24hr window) | ₹0.45/msg (Twilio only, Meta fee waived)      |

> ** Twilio uses destination-based pricing. India mobile ($0.0405/min) and landline ($0.0497/min) rates verified Feb 2026. Calculations assume 70% mobile, 30% landline blend, or use mobile rate for worst-case.

### Google Cloud Run (Tier 1: us-central1, asia-south1)

| Item               | Rate                                                          |
| ------------------ | ------------------------------------------------------------- |
| vCPU (on-demand)   | $0.00002400/vCPU-sec                                          |
| vCPU (always-on)   | $0.00001800/vCPU-sec                                          |
| Memory (on-demand) | $0.00000250/GiB-sec                                           |
| Memory (always-on) | $0.00000200/GiB-sec                                           |
| Requests           | $0.40/million                                                 |
| Free tier          | 180K vCPU-sec + 360K GiB-sec + 2M requests (us-central1 only) |

### Azure Cosmos DB (India Central)

| Item                    | Rate                                            |
| ----------------------- | ----------------------------------------------- |
| Provisioned throughput  | ~$0.008/100 RU/hr                               |
| Storage                 | ~$0.25/GB/month                                 |
| Free tier               | 1,000 RU/s + 25 GB (lifetime, per subscription) |
| 400 RU/s effective cost | $0 (covered by free tier)                       |

### MongoDB Atlas

| Tier                      |  Monthly Cost   |
| ------------------------- | :-------------: |
| M0 (Free, shared)         |   $0 (512 MB)   |
| M10 (Dedicated, 2 GB RAM) |  ~$57 (₹5,130)  |
| M20 (Dedicated, 4 GB RAM) | ~$150 (₹13,500) |

### Indian SIP Trunking

| Provider   | Plan       | Per-Minute Rate |
| ---------- | ---------- | :-------------: |
| Knowlarity | Premium    |    ₹0.40/min    |
| Knowlarity | Advance    |    ₹0.60/min    |
| Exotel     | Influencer |    ₹1.27/min    |
| Exotel     | Dabbler    |    ₹2.00/min    |

### Sarvam AI (Verified from sarvam.ai/api-pricing, Feb 2026)

| Service                    |          Rate          |
| -------------------------- | :--------------------: |
| STT (saaras:v3)            | ₹30/hour (₹0.50/min)  |
| STT + Diarization          |       ₹45/hour        |
| TTS (bulbul:v2)            |    ₹15/10K chars      |
| TTS (bulbul:v3 Beta)       |    ₹30/10K chars      |
| Translation (Mayura)       |    ₹20/10K chars      |
| Chat LLM (Sarvam-M)        |    Free               |
| Language Identification     |    ₹3.50/10K chars    |

Plans: Starter (pay-as-you-go, 60 req/min), Pro ₹10K (₹11K credits, 200 req/min), Business ₹50K (₹57.5K credits, 1000 req/min). All plans include ₹1,000 free starting credits. Credits never expire.

### LiveKit Cloud (Verified from livekit.io/pricing, Feb 2026)

| Plan       | Monthly Cost | Agent Min Included | SIP Min (3rd-party) | Agent Overage | SIP Overage |
| ---------- | :----------: | :----------------: | :-----------------: | :-----------: | :---------: |
| Build      |      $0      |       1,000        |        1,000        |   $0.01/min   |  $0.004/min |
| Ship       |     $50      |       5,000        |        5,000        |   $0.01/min   |  $0.004/min |
| Scale      |     $500     |      50,000        |       50,000        |   $0.01/min   |  $0.003/min |
| Enterprise |    Custom    |       Custom       |       Custom        |   Custom      |   Custom    |

### Google Gemini API (Verified from ai.google.dev, Feb 2026)

| Model                    | Input (per 1M tokens) | Output (per 1M tokens) |
| ------------------------ | :-------------------: | :--------------------: |
| Gemini 1.5 Flash         |        $0.075         |         $0.30          |
| Gemini 2.5 Flash         |        $0.30          |         $2.50          |

Free tier available. Context caching at 10% of base input price.

### Vercel

| Plan                   |   Monthly Cost    |
| ---------------------- | :---------------: |
| Hobby (non-commercial) |        $0         |
| Pro                    | $20/user (₹1,800) |

### Domain & SSL

| Item                |   Annual Cost   |
| ------------------- | :-------------: |
| .com domain         | ₹900-1,200/year |
| .in domain          | ₹499-1,000/year |
| SSL (Let's Encrypt) |      Free       |

---

## Appendix B: Key Assumptions

| Assumption | Value | Source |
|-----------|-------|--------|
| Average call duration | 2.5 minutes | Product strategy estimate |
| Call answer rate | 80% | Industry average for scheduled health calls |
| Retries per missed call | 1.5 average | System config (max 2 retries) |
| Plan mix | 50% Suraksha, 50% Sampurna | Assumption |
| Suraksha | $15/month (₹1,350), 7 calls/week | Product pricing |
| Sampurna | $20/month (₹1,800), 14 calls/week | Product pricing |
| Blended avg revenue/patient | ₹1,575/month ($17.50) | Weighted by plan mix |
| USD to INR | ₹90 | Feb 2026 rate |
| WhatsApp messages per patient/month | ~34 (Suraksha) to ~65 (Sampurna) | 1 per call + weekly + alerts |
| ElevenLabs credit consumption | ~350 credits/min for Conversational AI | Estimate — verify from dashboard |
| Cloud Run month | 2,592,000 seconds (30 days) | Standard |
| Sarvam TTS chars per call | ~1,000 characters | Estimated from agent conversation flow |
| Sarvam agent speaking ratio | ~40% of call duration | Agent asks short questions, patient responds |
| Gemini tokens per call | ~12K input, ~3K output (across all turns) | Estimate from 7-turn conversation + context |
| LiveKit Ship included minutes | 5,000 agent + 5,000 SIP | LiveKit pricing page |
| Exotel SIP base plan | ₹2,500/month | Estimate — verify with Exotel sales |
| Python worker Cloud Run | 0.5 vCPU, 256 MiB, always-on | Minimum for LiveKit agent worker |
| Twilio voice to India | $0.0405/min (mobile), $0.0497/min (landline) | Destination-based pricing, verified Feb 2026 |
| Gemini 1.5 Flash pricing | $0.075 input, $0.30 output per 1M tokens | Verified Feb 2026, from ai.google.dev |

---

## Appendix C: Break-Even Summary

| Scenario | Break-Even Users | Key Condition |
|----------|:----------------:|---------------|
| Current rates (Creator plan, 2.5 min calls) | **~22 users** | Both plans profitable at unit level, weighted margin ₹386/patient |
| 90-second calls only | **~10 users** | Margins widen to ₹822/patient weighted average |
| Scale plan + 2.5 min calls (100+ users) | **~103 users** | Higher fixed costs (₹39,895) but within Scale plan credits |
| Enterprise ElevenLabs + Indian SIP (2.5 min) | **~227 users** | High fixed costs (₹2L+) require scale for Enterprise pricing |
| Enterprise + SIP + 90-sec calls | **~179 users** | Best margins at scale, weighted margin ₹1,132/patient |
| | | |
| **Sarvam Stack Scenarios** | | |
| Sarvam (LiveKit Ship, 2.5 min calls) | **~9 users** | Variable margin ₹1,103–₹1,306/patient, higher fixed costs offset by 57% cheaper calls |
| Sarvam (LiveKit Ship, 90-sec calls) | **~6 users** | Best early-stage break-even across all scenarios |
| Sarvam + Knowlarity + 90-sec calls | **~5 users** | Theoretical best-case: ₹4.86/call, margins 84–89% |

> **Recommended path:** Start with ElevenLabs Creator plan for quality assurance. Run Sarvam in parallel via `VOICE_STACK` config for A/B testing. Once validated, switch primary traffic to Sarvam for 57–62% cost savings (break-even drops to ~9 patients). Add 90-second call optimization to drop break-even to ~6 patients.
