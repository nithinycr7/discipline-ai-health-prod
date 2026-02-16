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

### Task: Fix call history endpoint (500 error)
- **Endpoint:** `GET /api/v1/patients/:patientId/calls`
- **Issue:** Returns 500 error on production
- **Impact:** Dashboard call history tab is broken
- **File:** `apps/api/src/calls/calls.service.ts` → `findByPatient()`

### Task: Store call recording URL from ElevenLabs
- **What:** ElevenLabs provides audio recording URL per conversation
- **Where:** `Call.recordingUrl` field exists but is never populated
- **How:** In webhook, fetch from `getConversation()` response and store

---

## P1 — High Priority (Blocks Key Business Decisions)

### Task: Adherence trend charts
- **What:** Show adherence % over time (7-day, 30-day line chart)
- **Current:** Dashboard only shows today's adherence
- **Why:** Payer needs to see if their parent is improving or declining
- **Files:** New API endpoint + frontend chart component

### Task: Vitals history & trends
- **What:** Graph glucose and BP readings over time
- **Current:** Vitals captured per call but never visualized
- **Why:** Doctor needs to see trends, not just latest reading
- **Scope:** API endpoint for vitals history + frontend chart

### Task: Complaints tracking UI
- **What:** Show complaints from calls to payer/family
- **Current:** Complaints stored in DB but never shown in dashboard
- **Why:** Health issues mentioned by patient go completely unnoticed
- **Scope:** Add complaints section to patient detail page

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
