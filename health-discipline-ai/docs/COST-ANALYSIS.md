# Health Discipline AI — Infrastructure Cost Analysis

> **Last updated:** February 2026
> **Currency:** All amounts in INR (₹) unless noted. USD conversions at ₹90 = $1.

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
| Average call duration          | 2.5 minutes            |
| Per-minute rate (Creator plan) | ~$0.10/min = ₹9.00/min |
| **Cost per call**              | **₹22.50** ($0.25)     |

**Within included credits:** If a call consumes ~350 credits/min, then 2.5 min = 875 credits per call. With 100,000 included credits, you get ~114 calls "free" (already paid for in the ₹1,936 subscription).

**Beyond included credits:** ₹26.40/1000 credits × 875 credits = **₹23.10 per additional call**.

### 2.2 Twilio — Voice (Outbound to India)

| Metric                | Value                                   |
| --------------------- | --------------------------------------- |
| Route                 | US number (+1-765) → India mobile (+91) |
| Per-minute rate       | $0.0143/min = ₹1.29/min                 |
| Average call duration | 2.5 minutes                             |
| **Cost per call**     | **₹3.22** ($0.036)                      |

> **Note:** If call goes unanswered or busy, Twilio still charges for the connection attempt (~₹0.50-1.00 per failed attempt).

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
| ElevenLabs Conversational AI  |   ₹22.50   |   $0.250   |   85.5%    |
| Twilio Voice                  |   ₹3.22    |   $0.036   |   12.2%    |
| WhatsApp post-call report     |   ₹0.57    |   $0.006   |    2.2%    |
| WhatsApp critical alert (avg) |   ₹0.05    |   $0.001   |    0.2%    |
| **Total per successful call** | **₹26.34** | **$0.293** |  **100%**  |

> **ElevenLabs is 85% of variable costs.** This is the single biggest lever for cost optimization.

---

## 3. Variable Costs Per Patient Per Month

### 3.1 By Subscription Plan

| | Suraksha (सुरक्षा) | Sampurna (सम्पूर्ण) |
|---|:---:|:---:|
| **Price** | **$15/month (₹1,350)** | **$20/month (₹1,800)** |
| **Calls per week** | 7 (1/day) | 14 (2/day) |
| **Calls per month** | ~30 | ~60 |
| **Call minutes/month** | 75 min | 150 min |
| | | |
| **ElevenLabs** | ₹675 | ₹1,350 |
| **Twilio Voice** | ₹97 | ₹194 |
| **WhatsApp (post-call)** | ₹17.10 | ₹34.20 |
| **WhatsApp (weekly report)** | ₹2.28 | ₹2.28 |
| **WhatsApp (misc alerts)** | ₹3.00 | ₹5.00 |
| | | |
| **Total variable cost/patient** | **₹794** | **₹1,585** |
| **Revenue/patient** | **₹1,350 ($15)** | **₹1,800 ($20)** |
| **Margin/patient** | **+₹556** | **+₹215** |
| **Margin %** | **+41%** | **+12%** |

### 3.2 Key Insight — Unit Economics

| Plan | Profitable? | Margin |
|------|:-----------:|--------|
| Suraksha | **Yes (+₹556/patient)** | Strong — 41% variable margin at 1 call/day |
| Sampurna | **Yes (+₹215/patient)** | Positive — 12% margin, improves significantly with optimizations |

> **Both plans are profitable at unit economics level.** The $15/$20 USD pricing covers variable costs even at Creator plan rates. Suraksha is the higher-margin plan due to fewer calls. With call duration optimization or Enterprise pricing, margins improve dramatically.

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
| **Variable (10 patients, ~450 calls)** | | |
| ElevenLabs voice calls | ₹10,125 | $112.50 |
| Twilio voice | ₹1,449 | $16.10 |
| WhatsApp notifications (~510 msgs) | ₹291 | $3.23 |
| **Subtotal Variable** | **₹11,865** | **$131.83** |
| | | |
| **TOTAL** | **₹20,224** | **$224.71** |
| **Per patient** | **₹2,022** | **$22.47** |

| Revenue (blended avg ₹1,575/patient) | ₹15,750 | $175.00 |
|---------------------------------------|:--------:|:-------:|
| **Net Loss** | **-₹4,474** | **-$49.71** |

---

#### 50 Patients (MVP / Early Traction)

| Category | Monthly Cost (₹) | Monthly Cost ($) |
|----------|:-----------------:|:----------------:|
| **Fixed Infrastructure** | **₹8,359** | **$92.88** |
| **Variable (50 patients, ~2,250 calls)** | | |
| ElevenLabs voice calls | ₹50,625 | $562.50 |
| Twilio voice | ₹7,245 | $80.50 |
| WhatsApp notifications (~2,550 msgs) | ₹1,454 | $16.16 |
| **Subtotal Variable** | **₹59,324** | **$659.16** |
| | | |
| **TOTAL** | **₹67,683** | **$752.03** |
| **Per patient** | **₹1,354** | **$15.04** |

| Revenue (blended avg ₹1,575/patient) | ₹78,750 | $875.00 |
|---------------------------------------|:--------:|:-------:|
| **Net Profit** | **+₹11,067** | **+$122.97** |

> **Profitable at 50 patients!** With $15/$20 USD pricing, the blended revenue of ₹1,575/patient covers both variable costs and fixed infrastructure. Break-even is at ~22 patients.

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
| **Variable (100 patients, ~4,500 calls)** | | |
| ElevenLabs voice calls | ₹1,01,250 | $1,125.00 |
| Twilio voice | ₹14,490 | $161.00 |
| WhatsApp notifications (~5,100 msgs) | ₹2,907 | $32.30 |
| **Subtotal Variable** | **₹1,18,647** | **$1,318.30** |
| | | |
| **TOTAL** | **₹1,58,542** | **$1,761.58** |
| **Per patient** | **₹1,585** | **$17.62** |

| Revenue (blended avg ₹1,575/patient) | ₹1,57,500 | $1,750.00 |
|---------------------------------------|:---------:|:---------:|
| **Net Loss** | **-₹1,042** | **-$11.58** |

> **Approximately break-even at 100 patients** with the Scale plan. The higher Scale subscription (₹29,040 vs ₹1,936) is offset by the included 2M credits.

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
| **Variable (500 patients, ~22,500 calls)** | | |
| ElevenLabs voice (at Business rate $0.08/min) | ₹4,05,000 | $4,500.00 |
| Twilio voice | ₹72,450 | $805.00 |
| WhatsApp notifications (~25,500 msgs) | ₹14,535 | $161.50 |
| **Subtotal Variable** | **₹4,91,985** | **$5,466.50** |
| | | |
| **TOTAL** | **₹6,32,995** | **$7,033.28** |
| **Per patient** | **₹1,266** | **$14.07** |

| Revenue (blended avg ₹1,575/patient) | ₹7,87,500 | $8,750.00 |
|---------------------------------------|:---------:|:---------:|
| **Net Profit** | **+₹1,54,505** | **+$1,716.72** |

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
| **Variable (1,000 patients, ~45,000 calls)** | | |
| ElevenLabs voice (Enterprise ~$0.06/min) | ₹6,07,500 | $6,750.00 |
| Twilio voice | ₹1,44,900 | $1,610.00 |
| WhatsApp notifications (~51,000 msgs) | ₹29,070 | $323.00 |
| **Subtotal Variable** | **₹7,81,470** | **$8,683.00** |
| | | |
| **TOTAL** | **₹9,83,555** | **$10,928.61** |
| **Per patient** | **₹984** | **$10.93** |

| Revenue (blended avg ₹1,575/patient) | ₹15,75,000 | $17,500.00 |
|---------------------------------------|:----------:|:----------:|
| **Net Profit** | **+₹5,91,445** | **+$6,571.39** |

> **Strongly profitable at 1,000 patients.** Net margin of 38% with Enterprise pricing. Per-patient cost drops below ₹1,000.

---

### 4.2 Summary — Monthly Costs at Scale

| Patients | Monthly Cost (₹) | Monthly Revenue (₹) | Profit/Loss (₹) | Per-Patient Cost |
|:--------:|:-----------------:|:--------------------:|:----------------:|:----------------:|
| 10 | ₹20,224 | ₹15,750 | **-₹4,474** | ₹2,022 |
| 50 | ₹67,683 | ₹78,750 | **+₹11,067** | ₹1,354 |
| 100 | ₹1,58,542 | ₹1,57,500 | **-₹1,042** | ₹1,585 |
| 500 | ₹6,32,995 | ₹7,87,500 | **+₹1,54,505** | ₹1,266 |
| 1,000 | ₹9,83,555 | ₹15,75,000 | **+₹5,91,445** | ₹984 |
| 2,500 | ₹22,00,000 (est.) | ₹39,37,500 | **+₹17,37,500** | ₹880 |

---

## 5. Revenue vs Cost — Profitability by Plan

### 5.1 Per-Patient Monthly P&L (at current Creator plan rates)

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs | -₹675 | -₹1,350 |
| Twilio Voice | -₹97 | -₹194 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹556** | **+₹215** |
| Fixed cost share (50 users) | -₹167 | -₹167 |
| **Net margin** | **+₹389** | **+₹48** |

### 5.2 Per-Patient Monthly P&L (with Enterprise ElevenLabs at $0.06/min)

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs | -₹405 | -₹810 |
| Twilio Voice | -₹97 | -₹194 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹826** | **+₹755** |
| Fixed cost share (500 users) | -₹28 | -₹28 |
| **Net margin** | **+₹798** | **+₹727** |

> Both plans have strong margins with Enterprise pricing. Weighted average net margin: ~₹763/patient/month.

### 5.3 Per-Patient Monthly P&L (with Indian SIP trunk + Enterprise ElevenLabs)

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs (Enterprise) | -₹405 | -₹810 |
| Indian SIP (₹0.40/min via Knowlarity) | -₹30 | -₹60 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹893** | **+₹889** |
| Fixed cost share (500 users) | -₹28 | -₹28 |
| **Net margin** | **+₹865** | **+₹861** |

> **With Enterprise ElevenLabs + Indian SIP trunk, both plans have ~₹860+ margins.** Nearly identical profitability across both plans.

### 5.4 Per-Patient Monthly P&L (Enterprise + SIP + 90-second calls)

The best-case scenario with all optimizations applied:

| | Suraksha ($15) | Sampurna ($20) |
|---|:---:|:---:|
| Revenue | ₹1,350 | ₹1,800 |
| ElevenLabs ($0.06/min × 1.5 min) | -₹243 | -₹486 |
| Indian SIP (₹0.40/min × 1.5 min) | -₹18 | -₹36 |
| WhatsApp | -₹22 | -₹41 |
| **Variable margin** | **+₹1,067** | **+₹1,237** |
| Fixed cost share (1000 users) | -₹20 | -₹20 |
| **Net margin** | **+₹1,047** | **+₹1,217** |

> **With all optimizations, both plans are highly profitable.** Weighted average net margin: ~₹1,132/patient/month (~72% margin).

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

> **Worth evaluating at 500+ patients.** Sarvam is purpose-built for Indian languages and could significantly reduce costs if their voice agent quality matches ElevenLabs.

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

### Twilio

| Item                           | Rate                                          |
| ------------------------------ | --------------------------------------------- |
| US local number rental         | ₹90/month ($1.00)                             |
| US → India mobile (voice)      | ₹1.29/min ($0.0143)                           |
| US → India landline (voice)    | ₹0.69/min ($0.0077)                           |
| WhatsApp utility (India)       | ₹0.57/msg total (₹0.115 Meta + ₹0.45 Twilio)  |
| WhatsApp marketing (India)     | ₹1.23/msg total (₹0.7846 Meta + ₹0.45 Twilio) |
| WhatsApp service (24hr window) | ₹0.45/msg (Twilio only, Meta fee waived)      |

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

---

## Appendix C: Break-Even Summary

| Scenario | Break-Even Users | Key Condition |
|----------|:----------------:|---------------|
| Current rates (Creator plan, 2.5 min calls) | **~22 users** | Both plans profitable at unit level, weighted margin ₹386/patient |
| 90-second calls only | **~10 users** | Margins widen to ₹822/patient weighted average |
| Scale plan + 2.5 min calls (100+ users) | **~103 users** | Higher fixed costs (₹39,895) but within Scale plan credits |
| Enterprise ElevenLabs + Indian SIP (2.5 min) | **~227 users** | High fixed costs (₹2L+) require scale for Enterprise pricing |
| Enterprise + SIP + 90-sec calls | **~179 users** | Best margins at scale, weighted margin ₹1,132/patient |

> **Recommended path:** Start with Creator plan — profitable at ~22 patients out of the box with $15/$20 pricing. Add 90-second call optimization (free) to drop break-even to ~10 patients. Upgrade to Scale plan at ~40+ patients, Enterprise + SIP at 200+.
