# Upgrades & Roadmap

## Table of Contents

### Voice AI Stack
1. [Current Architecture](#current-architecture)
2. [Indian Language Voice Benchmarks](#indian-language-voice-benchmarks)
3. [Recommended Stack: Now](#recommended-stack-now)
4. [LLM Upgrade: Gemini 1.5 Flash → 2.5 Flash](#llm-upgrade-gemini-15-flash--25-flash)
5. [Future: Gemini Native Audio (Single-Model Pipeline)](#future-gemini-native-audio-single-model-pipeline)
6. [Migration Roadmap](#migration-roadmap)

### Dashboard — Disease-Specific Intelligence
7. [Dashboard: Current State](#dashboard-current-state)
8. [Disease Command Centers](#disease-command-centers)
9. [Innovative Dashboard Features](#innovative-dashboard-features)
10. [Dashboard Implementation Roadmap](#dashboard-implementation-roadmap)

---

## Current Architecture

Two voice stacks, switchable via `VOICE_STACK` env var:

### ElevenLabs (Primary)

```
Exotel SIP → ElevenLabs Agent API
               ├── ASR: ElevenLabs built-in
               ├── LLM: Gemini 1.5 Flash
               └── TTS: eleven_v3_conversational (voice: TRnaQb7q41oL7sV0w6Bu)
```

- **Pros:** Single API call, low integration complexity, decent latency
- **Cons:** Closed pipeline (can't swap ASR/TTS), not optimized for Indian languages, ~$0.10/min
- **File:** `apps/api/src/integrations/elevenlabs/elevenlabs-agent.service.ts`

### Sarvam AI + LiveKit (Backup)

```
Exotel SIP → LiveKit Room → Python Agent Worker
                              ├── STT: Sarvam Audio
                              ├── LLM: Gemini 1.5 Flash
                              └── TTS: Sarvam TTS
```

- **Pros:** Best Indian language ASR/TTS, native accents, cheaper, open pipeline
- **Cons:** More moving parts (LiveKit room + Python worker), slightly higher latency
- **Files:** `apps/api/src/integrations/sarvam/sarvam-agent.service.ts`, `services/sarvam-agent/agent.py`

### Languages Supported

| Code | Language | ElevenLabs | Sarvam |
|------|----------|:---:|:---:|
| hi | Hindi | Yes | Yes |
| te | Telugu | Yes | Yes |
| ta | Tamil | Yes | Yes |
| mr | Marathi | Yes | Yes |
| bn | Bengali | Yes | Yes |
| kn | Kannada | Yes | Yes |
| gu | Gujarati | Yes | Yes |
| ml | Malayalam | No | Yes |
| pa | Punjabi | No | Yes |
| en | English | Yes | Yes |

---

## Indian Language Voice Benchmarks

### Speech Recognition (ASR) — Voice of India Benchmark (2025)

National benchmark by Josh Talks + AI4Bharat (IIT Madras). 15 languages, 35,000+ speakers, real conversational speech.

| Model | Hindi/Bengali WER | Dravidian WER | Notes |
|-------|:-:|:-:|---|
| **Sarvam Audio** | ~5-6% | ~15-20% | #1 or #2 across nearly every language |
| **Google Gemini** | Competitive | Competitive | Best global model for Indic speech |
| **OpenAI Whisper/GPT-4o** | Moderate | 55%+ | Struggles significantly with Indian speech |
| **Microsoft STT** | Decent | N/A for many | Not supported for 6 of 15 languages |

**Key finding:** Sarvam Audio gets **6.95% WER** on Urdu vs OpenAI's **35.4% WER**. 5x better.

**Source:** [Voice of India Benchmark](https://smestreet.in/technology/global-speech-ai-struggles-to-understand-india-new-national-benchmark-voice-of-india-reveals-11110091)

### Text-to-Speech (TTS)

| Model | Languages | Highlights |
|-------|-----------|------------|
| **Sarvam Bulbul-V2** | 11 Indian languages | Most natural Indian accents, fast, affordable |
| **AI4Bharat Indic-TTS** | 13 languages | Open-source SOTA, FastPitch + HiFi-GAN |
| **ElevenLabs v3** | Multilingual | Good general quality, American-accented Indian languages |

**Key finding:** Sarvam Bulbul sounds like an actual Indian person. ElevenLabs sounds like an American accent speaking Hindi. For elderly patients, native accent = trust.

### LLM Performance on Indian Languages (IndicMMLU-Pro)

| Model | Hindi | Telugu | Tamil | Speed (tok/s) | Cost (per 1M output) |
|-------|:-----:|:------:|:-----:|:---:|:---:|
| GPT-4o | 44.80% | 41.34% | 38.46% | ~60 | $15.00 |
| **Gemini 2.5 Flash** | Strong | Strong | Strong | **372** | **$0.15** |
| Gemini 1.5 Flash | Good | Good | Good | ~250 | $0.30 |
| GPT-4o mini | 32.33% | 26.78% | 35.08% | ~80 | $0.60 |
| Claude Haiku 4.5 | Decent | Decent | Decent | ~165 | $5.00 |

**Key finding:** Gemini 2.5 Flash is the sweet spot — fastest, cheapest, excellent Indic support (Google's massive Indian language training data from Search/YouTube/Translate).

---

## Recommended Stack: Now

**Make Sarvam the primary stack for Indian language patients. Keep ElevenLabs for English-only patients.**

```
Indian language patients:  Sarvam STT → Gemini 2.5 Flash → Sarvam Bulbul-V2 TTS
English patients:          ElevenLabs Agent (Gemini 2.5 Flash LLM)
```

### Why This Combination Wins

| Component | Choice | Reason |
|-----------|--------|--------|
| **ASR** | Sarvam Audio | 5x better WER than OpenAI on Indian languages |
| **LLM** | Gemini 2.5 Flash | Fastest (372 tok/s), cheapest ($0.15/M), best Indic support among fast models |
| **TTS** | Sarvam Bulbul-V2 | Native Indian accents, elderly patients trust voices that sound like them |

### Implementation Changes Required

1. **Upgrade LLM** — Change `gemini-1.5-flash` → `gemini-2.5-flash` in both stacks
2. **Add per-patient routing** — Route based on `preferredLanguage` (not global `VOICE_STACK` toggle)
3. **Upgrade Sarvam TTS** — Ensure using Bulbul-V2 (latest model)
4. **A/B test first** — 10-20 patients across Hindi + Telugu/Tamil, compare for 2-3 weeks

### A/B Test Metrics

| Metric | How to Measure |
|--------|---------------|
| Comprehension | Fewer "kya?" / repeats in transcript |
| Engagement | Call duration (longer = more engaged) |
| Answer rate | Do patients pick up more? |
| Adherence | Does better voice → better medicine compliance? |

---

## LLM Upgrade: Gemini 1.5 Flash → 2.5 Flash

### What Changes

| | 1.5 Flash (current) | 2.5 Flash (upgrade) |
|---|---|---|
| Speed | ~250 tok/s | **372 tok/s** (+49%) |
| Cost | $0.30/M output | **$0.15/M output** (-50%) |
| TTFT | ~300ms | **<200ms** |
| Instruction adherence | ~84% | **~90%** |
| Indian language quality | Good | Better (larger Indic training data) |

### How to Upgrade

**ElevenLabs stack:** Change model in agent config (`elevenlabs-agent.service.ts`)
**Sarvam stack:** Change model in Python agent (`services/sarvam-agent/agent.py`)

One-line change in each file. No architectural changes needed.

---

## Future: Gemini Native Audio (Single-Model Pipeline)

### The Vision

```
Current (3 hops):   Audio In → Sarvam STT → Gemini LLM → Sarvam TTS → Audio Out
                               ~200ms        ~300ms        ~200ms     = ~700ms

Future (1 hop):     Audio In → Gemini 2.5 Flash Native Audio → Audio Out
                               ~400-500ms total
```

One model handles speech recognition, reasoning, and speech synthesis. No pipeline, fewer failure points, potentially lower latency.

### Why NOT Now

| Issue | Impact on Our Patients |
|-------|----------------------|
| **Silent episodes** — model randomly produces no audio for 10-15 seconds | Elderly patient thinks call dropped. They hang up. Catastrophic for retention. |
| **Latency spikes** — inconsistent delays reported by developers | Elderly patients won't wait. They'll disconnect. |
| **No speech speed control** — rate is fixed | We use 0.9x speed for elderly patients. Can't configure this. |
| **No telephony-native support** — needs SIP→WebSocket proxy | Would require rebuilding Exotel integration entirely. |
| **Still "preview"** on Gemini API — GA only on Vertex AI | Rate limits, no SLA, potential breaking changes. |
| **Indian language TTS quality unproven** — no benchmarks vs Sarvam Bulbul | Could sound less natural to a Telugu grandmother than Sarvam's native voices. |

**Source:** [Gemini Native Audio silent response bug](https://discuss.ai.google.dev/t/bug-gemini-2-5-flash-native-audio-outputs-control-characters-ctrl-instead-of-audio-causing-silent-responses/115050), [Latency issues](https://discuss.ai.google.dev/t/significant-delay-with-gemini-live-2-5-flash-native-audio/122650)

### When to Reconsider

Gemini Native Audio becomes viable for our use case when:

- [ ] Silent episode bug is fixed (zero tolerance for our elderly patients)
- [ ] Speech speed control is added (need 0.9x for elderly)
- [ ] Stable telephony integration exists (SIP/Exotel compatible)
- [ ] GA release on Gemini API with SLA
- [ ] Indian language TTS quality benchmarked against Sarvam Bulbul
- [ ] Tested on internal/demo calls for 30+ days with zero critical failures

### Estimated Timeline

| Phase | Timeline | Action |
|-------|----------|--------|
| **Monitor** | Now | Track Gemini Native Audio release notes, bug fixes, Indian language improvements |
| **Internal test** | ~6 months | Test on demo/internal calls when above checklist is 4/6 complete |
| **Pilot** | ~9-12 months | Small patient cohort if internal tests pass |
| **Migrate** | ~12-18 months | Replace Sarvam pipeline if pilot succeeds |

---

## Migration Roadmap

### Phase 1: Quick Wins (This Week)

- [ ] Upgrade LLM from Gemini 1.5 Flash → 2.5 Flash in both stacks
- [ ] Verify Sarvam TTS is using Bulbul-V2

### Phase 2: A/B Test (2-3 Weeks)

- [ ] Add per-patient `voiceStack` routing based on `preferredLanguage`
- [ ] Select 10-20 test patients (Hindi + Telugu/Tamil mix)
- [ ] Run ElevenLabs vs Sarvam comparison
- [ ] Measure: comprehension, call duration, answer rate, adherence

### Phase 3: Primary Stack Switch (Based on A/B Results)

- [ ] Make Sarvam primary for all Indian language patients
- [ ] Keep ElevenLabs as fallback for English patients
- [ ] Monitor for 30 days post-switch

### Phase 4: Future Evaluation (6-12 Months)

- [ ] Evaluate Gemini Native Audio when checklist criteria are met
- [ ] Test on internal calls first
- [ ] Pilot with small patient group
- [ ] Full migration decision

---

## Dashboard: Current State

### What Exists Today

The dashboard is **generic** — it treats all patients and all diseases the same way:

- Patient cards with adherence % and status badges
- Per-medicine taken/missed checklist
- Monthly adherence calendar (green/yellow/red)
- Call history list with pagination
- Optional glucose/BP display (if collected)
- Health condition badges (just labels, no intelligence)

### What's Missing

| Gap | Impact |
|-----|--------|
| No condition-specific views | A diabetes patient's dashboard looks identical to a heart disease patient's |
| No vitals trending | Glucose/BP shown as single values, not trends over time |
| No risk alerts for payers | Payer has no way to spot dangerous patterns without reading every call |
| No correlation insights | Can't see "missed medicine → glucose spike next day" |
| recharts installed but unused | Charting library ready, zero visualizations built |
| No disease-specific thresholds | No red/yellow/green zones for vitals based on condition |
| No actionable intelligence | Dashboard shows data, doesn't tell you what to DO |

**The dashboard shows compliance. It should show health intelligence.**

---

## Disease Command Centers

Instead of one generic dashboard, each disease gets a **command center** — a focused view that shows exactly what matters for that condition.

### Diabetes Command Center

```
┌─────────────────────────────────────────────────────────┐
│  🩸 Diabetes Dashboard — Ramesh Bauji                    │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ HbA1c Estimate   │  │ Glucose Trend (30 days)      │ │
│  │                  │  │                              │ │
│  │   ~7.2%          │  │  ╭──╮    ╭─╮                │ │
│  │   (from fasting  │  │ ─╯  ╰──╮╯  ╰───── target   │ │
│  │    glucose data)  │  │         ╰╮       ── range   │ │
│  │                  │  │          ╰───────            │ │
│  │  Target: <7%     │  │  [danger zone shaded red]    │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Medicine Impact   │  │ Risk Signals                 │ │
│  │                  │  │                              │ │
│  │ Metformin taken → │  │ ⚠ Hypo episode reported Fri │ │
│  │ glucose -12mg/dL  │  │ ⚠ Fasting >200 twice/week  │ │
│  │ avg next day      │  │ ✓ No missed insulin 14 days │ │
│  │                  │  │                              │ │
│  │ Missed Metformin →│  │ Trend: Improving ↗          │ │
│  │ glucose +28mg/dL  │  │                              │ │
│  └──────────────────┘  └──────────────────────────────┘ │
│                                                          │
│  Weekly Pattern:                                         │
│  Mon ✓130  Tue ─  Wed ─  Thu ✓145  Fri ─  Sat ─  Sun ─ │
│  (readings on scheduled days only)                       │
└─────────────────────────────────────────────────────────┘
```

**Key metrics:**
- Fasting glucose trend line (target zone: 80-130 mg/dL shaded green, >200 shaded red)
- Estimated HbA1c from fasting glucose readings (validated formula)
- Medicine-to-glucose correlation (does missing Metformin spike glucose next day?)
- Hypo episode tracker (from weekly screening: "shaky/dizzy?")
- Festival/season overlay (Diwali week = expect glucose spikes from sweets)

### Hypertension Command Center

**Key metrics:**
- BP trend line with target zone (systolic <140, diastolic <90)
- Morning vs evening BP comparison (if collected at different times)
- Medication adherence → BP correlation ("missed Amlodipine = +15 mmHg next reading")
- Postural dizziness incidents (from Wednesday screening)
- Hypertensive crisis alerts (>180/120 → immediate red banner)
- Salt intake awareness touchpoints (from health tips data)

### Heart Disease (CAD/Post-Stent) Command Center

**Key metrics:**
- Chest pain incident log (from Monday screenings) — any "Yes" = RED alert with timestamp
- Breathlessness trend (Better/Same/Worse over weeks)
- Dual antiplatelet adherence (critical — missing even 1 day post-stent is dangerous)
- Exercise capacity tracking ("can walk without breathlessness?" over time)
- Days since last chest pain event
- Emergency escalation history

### Heart Failure (CHF) Command Center

**Key metrics:**
- Ankle/feet swelling tracker (Mon + Fri readings) — binary but trend matters
- Weight trend (future: if patient has scale — daily weight is #1 CHF indicator)
- Breathlessness + swelling correlation chart
- Diuretic adherence (critical medicine — missing = fluid overload in 24-48hrs)
- Fluid overload risk score (swelling + breathlessness + missed diuretic = HIGH)
- Hospitalization risk indicator

### Depression/Anxiety Command Center

**Key metrics:**
- Mood trend over weeks (Good → Okay → Low, plotted as line)
- Social engagement tracking ("Did you go outside or talk to someone?" — Yes/No over time)
- Isolation alert (3+ consecutive "No" on social engagement)
- Call engagement correlation (mood vs call duration — are they talking less?)
- Seasonal pattern (monsoon/winter → mood dips common in elderly)
- Gentle nudge to payer: "Your father's mood has been low for 2 weeks. A visit might help."

### Thyroid, Cholesterol, Arthritis, COPD, CKD

| Condition | Key Visual | Critical Signal |
|-----------|-----------|-----------------|
| **Thyroid** | Empty-stomach compliance % (Tue check) | Consistently taking with food = ineffective |
| **Cholesterol** | Muscle pain frequency trend | Statin myopathy = #1 reason elderly silently stop statins |
| **Arthritis** | Joint status trend (Better/Same/Worse) | Sustained "Worse" = needs medication review |
| **COPD/Asthma** | Wheezing episodes per month | Spike = exacerbation risk, may need ER |
| **CKD** | Facial/feet swelling trend | New swelling = worsening kidney function |

---

## Innovative Dashboard Features

### 1. "What Happened Last Night" Morning Brief

When the payer opens the dashboard each morning, show a **1-screen summary** of what happened since they last checked:

```
┌─────────────────────────────────────────────────┐
│  Good morning! Here's what happened overnight:   │
│                                                  │
│  ✅ Bauji took all 4 medicines yesterday         │
│  ⚠️  Glucose was 195 (slightly high)             │
│  😊 Mood: "Achha hoon" (good)                   │
│  📞 Call lasted 2m 12s — talked about grandson   │
│                                                  │
│  🔥 Streak: 23 days! 7 more for a month!        │
│                                                  │
│  💡 Suggestion: Diwali is in 3 days — expect     │
│     glucose to rise. Remind about sweets.        │
└─────────────────────────────────────────────────┘
```

**Why it's innovative:** No other elderly care app gives a **narrative summary** of the patient's day. It turns raw data into a story the payer can read in 10 seconds.

### 2. Medicine Impact Visualizer

Show the **causal relationship** between medicine adherence and health outcomes:

```
Metformin (Sugar wali goli)
├── Taken consistently (14/14 days) → Avg glucose: 128 mg/dL ✅
├── Missed 2 days in a row         → Glucose spiked to 210 mg/dL ⚠️
└── Correlation strength: STRONG (87%)

Amlodipine (BP wali goli)
├── Taken consistently (12/14 days) → Avg BP: 135/85 ✅
├── Missed 1 day                   → BP next day: 158/95 ⚠️
└── Correlation strength: MODERATE (64%)
```

**Why it's innovative:** Shows the payer (and eventually doctor) WHY each medicine matters — with their own parent's data, not generic medical advice. This is personalized evidence.

### 3. Predictive Risk Radar

A simple radar/spider chart showing risk levels across all conditions:

```
            Glucose Control
                 ▲
                /|\
               / | \
    Mood      /  |  \     BP Control
      ◄──────●   |   ●──────►
              \  |  /
               \ | /
                \|/
                 ▼
          Medicine Adherence

    🟢 Green zone = stable
    🟡 Yellow zone = watch
    🔴 Red zone = act now
```

**Why it's innovative:** One glance tells the payer whether to worry or relax. No need to read 5 different charts. The radar shape changes daily — if it's round and green, everything's fine. If it spikes red on one axis, that's where attention is needed.

### 4. "Talk to the AI" Payer Chat

Let the payer ask questions about their parent's health data in natural language:

```
Payer: "How has Papa's sugar been this week?"
AI: "Bauji's fasting glucose averaged 142 mg/dL this week,
     slightly above target (130). He missed Metformin on
     Tuesday — glucose was 195 on Wednesday. Otherwise stable.
     Suggest reminding him about the Tuesday dose."

Payer: "Should I be worried about his BP?"
AI: "His BP has been well-controlled — 132/84 average over
     the last 2 weeks. No postural dizziness reported.
     Amlodipine adherence is 93%. No action needed."
```

**Why it's innovative:** The payer doesn't need to understand medical dashboards. They ask like they'd ask a doctor — and get a clear, data-backed answer from the AI that already knows everything from the daily calls.

### 5. Doctor Export / Clinic View

One-click export for doctor visits:

```
┌─────────────────────────────────────────────────┐
│  Patient Report — Ramesh Kumar (Bauji)           │
│  Period: Jan 15 – Feb 15, 2026                   │
│                                                  │
│  CONDITIONS: Diabetes Type 2, Hypertension       │
│                                                  │
│  MEDICINE ADHERENCE                              │
│  ├── Metformin 500mg BD: 92% (28/30 days)       │
│  ├── Amlodipine 5mg OD: 97% (29/30 days)       │
│  └── Ecosprin 75mg OD: 100% (30/30 days)        │
│                                                  │
│  VITALS SUMMARY                                  │
│  ├── Fasting Glucose: 125–195 mg/dL (avg 142)   │
│  ├── BP: 128/82–158/95 (avg 135/86)             │
│  └── Hypo episodes: 1 (Jan 22)                  │
│                                                  │
│  COMPLAINTS REPORTED                             │
│  ├── Jan 18: Headache (resolved next day)        │
│  ├── Jan 22: Dizziness (hypo — ate food, ok)    │
│  └── Feb 3: Knee pain (ongoing)                  │
│                                                  │
│  MOOD TREND: Stable (mostly "good", 2× "okay")  │
│                                                  │
│  AI INSIGHTS                                     │
│  • Glucose spikes correlate with missed Metformin │
│  • BP well-controlled on current regimen          │
│  • Consider arthritis review (knee pain 2 weeks) │
│                                                  │
│  [Download PDF]  [Share via WhatsApp]             │
└─────────────────────────────────────────────────┘
```

**Why it's innovative:** Every Indian doctor visit starts with "Dawai regularly le rahe hain?" and the patient says "Haan" regardless of truth. This report gives the doctor **actual data** — adherence %, vitals trends, AI-detected patterns. No other elderly care product provides this.

### 6. Family Leaderboard (Multi-Patient Households)

For payers managing multiple family members (mother + father, or joint family):

```
┌─────────────────────────────────────┐
│  Your Family's Health This Week     │
│                                     │
│  🥇 Bauji     — 100% adherence     │
│  🥈 Amma      — 93% adherence      │
│  🥉 Dadi Ma   — 78% adherence ⚠️   │
│                                     │
│  Dadi Ma missed BP medicine 3×      │
│  this week. Maybe a gentle reminder? │
└─────────────────────────────────────┘
```

### 7. Seasonal Health Calendar

A forward-looking calendar overlay:

```
February 2026
├── Feb 26: Maha Shivaratri 🎉 (expect fasting → hypo risk for diabetics)
├── Mar 14: Holi 🎉 (bhang/sweets → glucose spike risk)
├── Mar–May: Summer → dehydration risk, medicine storage reminder
│
│  Auto-actions:
│  • Pre-festival call mentions fasting safety
│  • Post-festival call checks glucose
│  • Summer: hydration tips rotate into calls
```

**Why it's innovative:** Proactive, not reactive. The dashboard warns the payer BEFORE a health event — "Holi is Thursday. Bauji is diabetic. The AI will remind him about sweets, but you might want to keep an eye too."

---

## Dashboard Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Item | Impact | Effort | Details |
|------|--------|--------|---------|
| Vitals trend charts | Very High | Medium | Use recharts (already installed). Line charts for glucose + BP over 30/60/90 days with target zone shading |
| Condition badges → clickable filters | Medium | Low | Filter patient list by condition. Click "Diabetes" → see only diabetic patients |
| Morning brief card | High | Medium | Summary card at top of dashboard: last call results, streak, alerts |
| Risk alert banners | High | Low | Red banner when glucose >200, BP >180/120, chest pain reported |

### Phase 2: Disease Intelligence (Week 3-4)

| Item | Impact | Effort | Details |
|------|--------|--------|---------|
| Disease command center tabs | Very High | High | Condition-specific views on patient detail page (Diabetes tab, BP tab, etc.) |
| Medicine-vitals correlation | High | Medium | Show "missed Metformin → glucose +28 next day" with patient's own data |
| Mood trend visualization | Medium | Low | Simple line chart from weekly depression screening |
| Screening history timeline | Medium | Low | Show all screening responses over time (swelling, dizziness, chest pain) |

### Phase 3: Intelligent Features (Week 5-8)

| Item | Impact | Effort | Details |
|------|--------|--------|---------|
| Doctor export PDF | Very High | Medium | One-click PDF with adherence, vitals, complaints, AI insights |
| Payer chat (AI Q&A) | Very High | High | Natural language queries about patient data, powered by Gemini |
| Predictive risk radar | High | Medium | Spider chart showing multi-condition risk at a glance |
| Seasonal health calendar | Medium | Medium | Forward-looking calendar with festival + season health warnings |

### Phase 4: Growth Features (Month 3+)

| Item | Impact | Effort | Details |
|------|--------|--------|---------|
| Family leaderboard | Medium | Low | Multi-patient household comparison |
| WhatsApp report sharing | High | Medium | Share doctor export directly via WhatsApp |
| Hospital/clinic portal | Very High | Very High | Multi-patient view for clinics managing 50+ patients |
| Wearable data integration | High | Very High | Future: pull glucose from CGM, BP from smart cuffs |

---

*Last updated: 2026-02-17*