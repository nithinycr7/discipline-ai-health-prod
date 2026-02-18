# Epic: Product Gaps & Missing Features

**Created:** 2026-02-16
**Status:** Planning
**Owner:** Product

---

## Context

After comprehensive testing of the AI calling pipeline (6 test calls to patient Gopi), a full PM audit was conducted. This document captures all identified gaps, missing features, and data issues organized into actionable tasks.

---

## Completed (2026-02-16)

- [x] **Fix AI conversation pacing** — AI now asks one question at a time, waits for answers
- [x] **Fix language switching** — AI switches language if patient responds in a different language
- [x] **Fix medicine name matching** — Fuzzy matching handles transliterations (Hp1 → "Hp ek", "Hp one")
- [x] **Add caring conversation flow** — AI asks about well-being, offers space to share, warm goodbye
- [x] **Add "I have noted everything" closing** — AI confirms data recorded, asks patient to disconnect
- [x] **Implement per-call cost tracking** — Twilio + ElevenLabs charges stored per call
- [x] **Store termination reason** — Why call ended (hangup, timeout, error)
- [x] **Store ElevenLabs conversation ID** — Proper field instead of overloading twilioCallSid

---

## P0 — Critical (Data Being Lost / Broken)

### ~~Task: Fix call history endpoint (500 error)~~ ✅ Fixed
### Task: Store call recording URL from ElevenLabs
- **What:** ElevenLabs provides audio recording URL per conversation
- **Where:** `Call.recordingUrl` field exists but is never populated
- **How:** In webhook, fetch from `getConversation()` response and store

---

## Completed (2026-02-18) — Dashboard Redesign Sprint

- [x] **Adherence trend charts** — AreaChart showing daily adherence % (7D/14D/30D)
- [x] **Vitals history & trends** — Glucose LineChart + Blood Pressure dual-line chart
- [x] **Complaints tracking UI** — Mood & wellness log with color-coded entries in patient detail + reports
- [x] **Per-medicine adherence breakdown** — Horizontal BarChart with color-coded compliance rates
- [x] **Patient stats API endpoint** — `GET /patients/:id/stats?days=N` returns all chart data in one call
- [x] **Dashboard home redesign** — Aggregate stats, "Needs Attention" alerts, streak badges
- [x] **Reports page rebuild** — Patient/period selectors, adherence donut, trend charts, vitals, mood log
- [x] **Settings page wired up** — Working profile edit, notification toggles, subscription status
- [x] **Website ↔ Web app linking** — All CTAs route to registration/login via APP_URL
- [x] **Security: getCall() ownership check** — Prevents unauthorized access to other users' call data
- [x] **Bug: critical medicine alert** — `isCritical` now passed to call record; WhatsApp alert fires correctly
- [x] **Bug: days query param type** — Parsed as integer, no longer string coercion
- [x] **Bug: medicinesChecked null safety** — Defensive `|| []` in stats aggregation loops
- [x] **Onboarding UX** — Phone Number label, country dropdown, custom conditions, digital tier (Phone/WhatsApp/Both)

---

## P1 — High Priority (Blocks Key Business Decisions)

### Task: WhatsApp medicine reminder nudges
- **What:** Send lightweight WhatsApp message 15 min before medicine time: "Bauji, time for morning medicines (Metformin, Amlodipine)"
- **Current:** Only AI calls exist — no pre-call nudge
- **Why:** Reduces missed doses; calls check adherence but don't prevent non-adherence
- **Approach:** Hybrid model — cheap WhatsApp nudges for all 4 timings, full AI call 1-2x daily
- **Scope:**
  - New `NudgeService` with cron checking 15 min before each call slot
  - WhatsApp template message via Twilio/Meta API
  - Only for patients with digitalTier = 2 (WhatsApp) or 3 (Both)
  - Dashboard toggle to enable/disable per patient
  - Track nudge delivery in a new `Nudge` collection or lightweight log
- **Cost:** ~₹0.50/message vs ~₹40/call — massive cost savings for non-critical timings
- **Impact:** Could reduce calls from 4/day to 1-2/day while maintaining adherence

### Task: Transcript viewer
- **What:** Let payer read/listen to call transcripts
- **Current:** Full transcript stored but no UI to view it
- **Why:** Payer wants to verify call quality and understand parent's responses
- **Scope:** Add transcript tab/modal to call history

### Task: Cost analytics dashboard
- **What:** Show cost per patient, per month, per call
- **Current:** Cost data now stored per call (as of today) but no UI
- **Fields available:** `twilioCharges`, `elevenlabsCharges`, `totalCharges`, `elevenlabsCostCredits`
- **Views needed:**
  - Cost per call breakdown
  - Monthly cost per patient
  - Total platform spend
  - Revenue vs cost (unit economics)

### Task: Adherence decline alerts
- **What:** Alert payer if adherence drops >20% week-over-week
- **Current:** No trend-based alerting
- **Why:** Early intervention prevents health deterioration
- **Scope:** Weekly cron job comparing this week vs last week

### Task: Vitals threshold alerts
- **What:** Urgent alert if glucose >300 or BP >180/110
- **Current:** Vitals captured but no threshold checking
- **Why:** Medical emergency detection
- **Scope:** Check thresholds in webhook after vitals are recorded

---

## P2 — Medium Priority (Competitive Advantages)

### Task: Sentiment analysis per call
- **What:** Track if patient was frustrated, confused, engaged, or happy
- **Current:** Not tracked
- **How:** ElevenLabs may provide sentiment data; or infer from transcript
- **Schema:** Add `sentiment` field to Call schema

### Task: Optimal call time learning
- **What:** Track answer rates by time of day → auto-adjust schedule
- **Current:** Call times are static, manually configured
- **Why:** Increase answer rate, reduce wasted calls
- **Scope:** Analytics on answer rate by hour + recommendation engine

### Task: Family member dashboard access
- **What:** Let authorized family members login and view patient data
- **Current:** `authorizedUsers[]` field exists but no login/UI for them
- **Why:** Multiple family members may want visibility

### Task: Doctor export (PDF report)
- **What:** Generate downloadable adherence report for doctor visits
- **Current:** No export functionality
- **Why:** Payer takes parent to doctor, needs to show medication history
- **Scope:** PDF generation endpoint + download button in dashboard

### Task: Call attempt history (full log)
- **What:** Store every attempt (ring, no answer, busy) not just completed calls
- **Current:** Only completed calls have full data; failed calls lose context
- **Why:** Debugging call delivery issues, optimizing retry strategy

### Task: Patient availability patterns
- **What:** Learn when patient typically answers vs ignores
- **Current:** No pattern learning
- **Scope:** Aggregate answer rate by time slot per patient

---

## P3 — Future (Moat Builders)

### Task: Drug interaction checker
- **What:** Flag dangerous medicine combinations
- **How:** Integrate with RxNorm or India pharma database
- **Why:** Safety — prevent harmful drug interactions

### Task: Pharmacy refill reminders
- **What:** "Your medicine runs out in 5 days"
- **Requires:** Medicine quantity + start date fields
- **Why:** Prevent gaps in medication supply

### Task: Outcome tracking
- **What:** Track hospitalization rates, ER visits before/after using our service
- **Why:** Prove ROI to B2B hospital customers
- **Schema:** New `Outcome` collection linking patient → events

### Task: Churn prediction scoring
- **What:** Score which subscribers are likely to cancel
- **Signals:** Adherence trend, call answer rate, complaint frequency, support tickets
- **Why:** Proactive retention → reduce churn

### Task: Multi-language optimization
- **What:** A/B test which language/accent/speed works best per patient
- **Current:** Single language per patient, manually set
- **Why:** Some patients respond better to a specific dialect or speed

### Task: Missed dose recovery protocol
- **What:** AI advises "skip today's dose, resume tomorrow" vs "take both"
- **Requires:** Pharma knowledge base per medicine
- **Why:** Currently AI says "never give medical advice" — but basic guidance is safe

---

## Data Fields: Status Audit

### Currently Populated
| Field | Source |
|-------|--------|
| `medicinesChecked[].response` | ElevenLabs data collection → fuzzy matching |
| `moodNotes` | ElevenLabs `wellness` extraction |
| `complaints[]` | ElevenLabs `complaints` extraction |
| `transcript` | ElevenLabs webhook transcript |
| `duration` | ElevenLabs `call_duration_secs` |
| `twilioCharges` | Calculated: duration × ₹0.72/min |
| `elevenlabsCharges` | Fetched from ElevenLabs conversation API |
| `elevenlabsCostCredits` | Raw ElevenLabs credit cost |
| `totalCharges` | Sum of Twilio + ElevenLabs |
| `terminationReason` | ElevenLabs metadata |

### Not Yet Populated (Need Implementation)
| Field | Exists in Schema? | Action Needed |
|-------|-------------------|---------------|
| `recordingUrl` | Yes | Fetch from ElevenLabs conversation API |
| `vitals.glucose` | Yes | Only populated if patient reports; working |
| `vitals.bloodPressure` | Yes | Only populated if patient reports; working |
| `sentiment` | No | Add field + implement extraction |
| `callQualityScore` | No | Add field + implement scoring |
| `turnCount` | No | Add field; count transcript entries |

---

## Cost Tracking Architecture (Implemented 2026-02-16)

```
Call completes → ElevenLabs webhook fires
                      ↓
              Parse transcript + medicines
                      ↓
              Fetch conversation from ElevenLabs API
                      ↓
              Extract: metadata.cost (credits)
                      ↓
              Calculate:
                twilioCharges = duration_secs / 60 × ₹0.72
                elevenlabsCharges = credits / 1000 × ₹85
                totalCharges = twilioCharges + elevenlabsCharges
                      ↓
              Store in Call record
```

**Typical cost per 60-second call:**
- Twilio: ~₹0.72
- ElevenLabs: ~₹39 (459 credits)
- **Total: ~₹40 per call**

**Monthly cost per patient (2 calls/day):**
- ~60 calls × ₹40 = **₹2,400/month**

**Revenue per patient:**
- Suraksha plan: ₹1,350/month
- Sampurna plan: ₹1,800/month

**Unit economics gap:** Cost exceeds revenue. Need to optimize ElevenLabs usage or negotiate volume pricing.
