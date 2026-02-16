# Health Discipline AI — Anti-Call-Fatigue Strategy

## Table of Contents

1. [The Problem](#the-problem)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Strategy Overview](#strategy-overview)
4. [Adaptive Conversation Flows](#adaptive-conversation-flows)
5. [Emotional Tone Engine](#emotional-tone-engine)
6. [Festival & Cultural Personalization](#festival--cultural-personalization)
7. [Seasonal Health Awareness](#seasonal-health-awareness)
8. [Streak Tracking & Milestone Celebrations](#streak-tracking--milestone-celebrations)
9. [Fatigue Detection & Response](#fatigue-detection--response)
10. [Health Tips Rotation](#health-tips-rotation)
11. [First Impression Variation](#first-impression-variation)
12. [Relationship Evolution Model](#relationship-evolution-model)
13. [Example Call Scenarios](#example-call-scenarios)
14. [Metrics & Success Criteria](#metrics--success-criteria)
15. [Implementation Roadmap](#implementation-roadmap)
16. [Risks & Mitigations](#risks--mitigations)

---

## The Problem

Health Discipline AI calls elderly patients **every single day**. Today, every call follows the exact same script:

```
"Namaste [Name]!"
→ "Aaj ki dawai ke baare mein baat karte hain"
→ Ask about each medicine one by one
→ Ask about vitals
→ "Aap kaisi feel kar rahe hain?"
→ "Dhanyavaad, apna khayal rakhiye"
```

**Day 1:** Patient is delighted — "Koi toh pooch raha hai!"
**Day 7:** Patient answers politely.
**Day 14:** Patient starts rushing — "Haan haan, sab le li."
**Day 21:** Patient answers with irritation — "Roz roz wohi baat?"
**Day 30:** Patient stops picking up.

**If this happens, churn rises above 10% and the business model breaks.**

The call must feel like a person who remembers yesterday, knows what day it is, celebrates your wins, and has new things to say — not a robot reading a checklist.

---

## Root Cause Analysis

| Fatigue Type | What Happens | Why It Hurts |
|---|---|---|
| **Script fatigue** | Same conversation structure every day | Brain tunes out predictable patterns — "I know exactly what's coming next" |
| **Tone fatigue** | Same emotional register — neutral-warm | No emotional peaks or valleys — flat affect feels robotic |
| **Content fatigue** | Nothing new — just medicine check | No value beyond the checklist — "Why should I stay on the call?" |
| **Temporal disconnect** | No awareness of festivals, seasons, time of day | Feels like talking to a machine that doesn't live in the same world |
| **No memory** | Doesn't reference yesterday, last week, or streaks | Feels like every call starts from zero — no relationship progression |
| **No celebration** | Good adherence gets same response as bad adherence | Where's the positive reinforcement? "Why bother being consistent?" |

**Core insight:** Real family members don't call with a checklist. They say "Happy Diwali, Bauji!", they mention "Kal aapne bataya tha ki sar dard tha — ab kaisa hai?", they celebrate "Papa, poore mahine dawai li aapne — kamaal kar diye!" The AI must learn to do the same.

---

## Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ANTI-FATIGUE SYSTEM                              │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  Context Layer   │  │  Calendar Layer  │  │  Selection Layer │     │
│  │                 │  │                 │  │                 │     │
│  │ Yesterday's     │  │ Festival today? │  │ Which flow      │     │
│  │ call results    │  │ Season/weather  │  │ variant?        │     │
│  │ Streak count    │  │ Time of day     │  │ Which tone?     │     │
│  │ Recent moods    │  │ Day of week     │  │ Include tip?    │     │
│  │ Complaints      │  │ Health risks    │  │ Celebrate?      │     │
│  │ Fatigue score   │  │                 │  │ Re-engage?      │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           └────────────────────┼────────────────────┘              │
│                                ▼                                    │
│                 ┌──────────────────────────┐                       │
│                 │   Dynamic Prompt Assembly  │                       │
│                 │                          │                       │
│                 │  Every call gets a        │                       │
│                 │  UNIQUE prompt built       │                       │
│                 │  from these layers         │                       │
│                 └──────────────────────────┘                       │
│                                                                     │
│  Result: No two consecutive calls feel the same.                   │
│  The checklist is still completed, but wrapped in natural variety.  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Adaptive Conversation Flows

Instead of one fixed conversation structure, the system rotates among **5 flow variants** based on patient context:

### Flow 1: Standard Check-In (Default — ~40% of calls)

**When:** Normal days, no special context.

```
Greeting → "Aaj ki dawai ke baare mein baat karte hain"
→ Ask each medicine by name → Vitals check → Wellness → Goodbye
```

This is today's flow. It remains the baseline but is no longer the _only_ option.

### Flow 2: Wellness-First (After Complaints — ~15% of calls)

**When:** Patient reported "not_well" or had a specific complaint in the last 1-2 calls.

```
Greeting → "Kal aapne bataya tha ki [complaint] tha — aaj kaisa hai?"
→ Listen to their response → Medicines → Brief vitals → Warm goodbye
```

**Why it works:** Shows the AI remembers. Elderly patients feel heard when someone follows up on their health concerns. This is what a real daughter/son would ask first.

### Flow 3: Quick Check (For Engaged Regulars — ~20% of calls)

**When:** Patient has >90% adherence over the last 14 days AND has completed 30+ calls. They don't need hand-holding.

```
Greeting → "Aaj sab dawai le li na?" (batch ask, not one-by-one)
→ Quick vitals → "Sab theek hai?" → Short, warm goodbye
```

**Why it works:** Respects their time and established habit. Patients with strong adherence find individual medicine questioning patronizing after a month. A shorter call signals trust: "We know you're responsible."

### Flow 4: Celebration (Milestone Days — ~5% of calls)

**When:** Patient hits a streak milestone — 7, 14, 21, 30, 60, 90, or 100 consecutive days of full adherence.

```
Greeting → "Bauji, aaj ek bahut acchi baat batani hai!"
→ Celebrate: "Aapne [X] din se ek bhi dawai nahi chhoodi — kamaal kar diye!"
→ Medicines (brief) → Vitals → Goodbye with encouragement
```

**Why it works:** Positive reinforcement is the strongest driver of habit formation. When the AI celebrates, the payer gets notified too — reinforcing the product's value to both patient and customer.

### Flow 5: Gentle Re-engagement (For Fatigued Patients — ~10% of calls)

**When:** Patient has missed 2+ calls (no answer/declined) recently, or shows high fatigue score.

```
Greeting → "Bauji, kal aapki bahut yaad aayi. Kaise hain?"
→ Very brief: 1-2 critical medicines only (skip non-critical)
→ "Bas itni si baat thi. Apna khayal rakhiye!"
```

**Why it works:** When a patient is pulling away, a longer interrogation pushes them further. A short, warm, low-pressure call rebuilds the habit of picking up. Once they're re-engaged (answering regularly again), gradually return to standard flows.

### Flow Selection Logic

```
IF streak_milestone_today → Flow 4 (Celebration)
ELSE IF missed_calls_recently ≥ 2 OR fatigue_score > 60 → Flow 5 (Gentle Re-engage)
ELSE IF yesterday_mood == "not_well" OR recent_complaints.length > 0 → Flow 2 (Wellness-First)
ELSE IF adherence_14day > 90% AND calls_completed > 30 → Flow 3 (Quick Check)
ELSE → Flow 1 (Standard)
```

With secondary randomization: if multiple flows are eligible, rotate to avoid even the _variant_ becoming predictable.

---

## Emotional Tone Engine

Every call gets a **tone directive** — a single line injected into the AI prompt that shifts the LLM's emotional register.

| Tone | When Applied | Prompt Directive |
|---|---|---|
| **Warm & Cheerful** | Festivals, milestones, good adherence days | "Be extra warm and cheerful today. There's a smile in your voice." |
| **Gentle & Concerned** | After complaints, "not_well" mood, missed medicines | "Be gentle and show genuine concern. Ask with care, not as a checklist." |
| **Celebratory & Proud** | Streak milestones | "Be proud of them — like a family member celebrating their achievement." |
| **Light & Breezy** | Weekends, high-adherence regulars, summer mornings | "Keep it light and easy. Don't linger. A quick friendly check, that's all." |
| **Reassuring & Patient** | After missed calls, low adherence, fatigue detected | "Be extra patient and reassuring. No judgment. Make them feel it's okay." |
| **Festive & Joyful** | Major festivals (Diwali, Holi, Pongal, Eid) | "Today is a celebration! Be festive and joyful. Wish them warmly before anything else." |

**Why this matters:** The same words spoken in different emotional registers create entirely different experiences. "Dawai le li?" said cheerfully vs. gently vs. matter-of-factly produces three different calls from the patient's perspective.

---

## Festival & Cultural Personalization

### The Opportunity

India has **festivals year-round** — often multiple per month. A real family member would never call on Diwali without saying "Diwali ki bahut bahut shubhkamnayein!" first. The AI must do the same.

### Festival Calendar (Language-Specific)

Not all festivals are universal. The system must know which festivals matter to which language speakers:

| Festival | Approximate Timing | Languages | Example Greeting |
|---|---|---|---|
| **Makar Sankranti** | January 14 | hi, mr, gu, kn | "Sankranti ki bahut bahut shubhkamnayein!" |
| **Pongal** | January 14-17 | ta | "Pongal vazhthukkal! Inniki epdi irukkinga?" |
| **Republic Day** | January 26 | All | "Gantantra Divas ki shubhkamnayein!" |
| **Maha Shivaratri** | February/March | All | "Maha Shivaratri ki shubhkamnayein!" |
| **Holi** | March | hi, gu, mr, bn | "Holi ki bahut shubhkamnayein! Rang lagaye?" |
| **Ugadi** | March/April | te, kn | "Ugadi shubhakankshalu! Nuthana samvatsara shubhamulu!" |
| **Gudi Padwa** | March/April | mr | "Gudi Padwachya hardik shubhechha!" |
| **Vishu** | April | ml | "Vishu ashamsakal! Enna vishesham undu?" |
| **Baisakhi** | April 13 | pa, hi | "Baisakhi diyan lakh lakh vadhaiyan!" |
| **Eid ul-Fitr** | Varies | All (Muslim patients) | "Eid Mubarak! Aap aur aapke ghar walon ko mubarakbaad!" |
| **Raksha Bandhan** | August | hi, gu, mr | "Raksha Bandhan ki shubhkamnayein!" |
| **Janmashtami** | August | hi, mr, gu | "Janmashtami ki bahut shubhkamnayein!" |
| **Ganesh Chaturthi** | August/September | mr, te, kn | "Ganpati Bappa Morya! Chaturthi ki shubhkamnayein!" |
| **Onam** | August/September | ml | "Onam ashamsakal! Pookalam ready aayo?" |
| **Navratri** | September/October | hi, gu | "Navratri ki bahut shubhkamnayein! Garba khele?" |
| **Durga Puja** | October | bn | "Sharodiya shubhechha! Durga Puja te ki plan?" |
| **Dussehra** | October | All | "Vijayadashami ki hardik shubhkamnayein!" |
| **Diwali** | October/November | All | "Diwali ki bahut bahut shubhkamnayein! Ghar mein sab theek?" |
| **Chhath Puja** | November | hi (Bihar/UP) | "Chhath Maiya ki jai! Chhath ki shubhkamnayein!" |
| **Guru Nanak Jayanti** | November | pa, hi | "Guru Nanak Dev ji ka Prakash Parv mubarak!" |
| **Christmas** | December 25 | All (Christian patients), en | "Merry Christmas! Kaise hain aaj?" |
| **Eid ul-Adha** | Varies | All (Muslim patients) | "Eid ul-Adha Mubarak!" |
| **Milad-un-Nabi** | Varies | All (Muslim patients) | "Eid Milad-un-Nabi Mubarak!" |

### How Festivals Affect the Call

1. **First message changes:** "Bauji! Diwali ki bahut bahut shubhkamnayein! Kaise hain aap?"
2. **Tone shifts to festive:** The tone directive becomes celebratory/joyful
3. **Health tie-in (optional):** "Festival mein meethai khayein, lekin sugar ka dhyan rakhiyega" (for diabetic patients on Diwali — general awareness, NOT medical advice)
4. **Shorter medicine check:** Festival days get lighter medicine questioning — the greeting + festival warmth is the priority

### Data Maintenance

- Hindu festival dates shift yearly (lunar calendar) — update once per year from Drik Panchang
- Islamic festival dates shift yearly (Hijri calendar) — update from Islamic calendar API
- National holidays (Republic Day, Independence Day) and fixed-date festivals (Christmas) are constant
- **Future consideration:** Religion/community field on patient profile for more precise festival matching (not all Hindi speakers celebrate all Hindu festivals)

---

## Seasonal Health Awareness

### Season-Specific Context

India's seasons create predictable health patterns. The AI should acknowledge the world the patient lives in:

| Season | Months | Weather Context | Health Awareness (General, Non-Medical) |
|---|---|---|---|
| **Winter** (Sardi) | December - February | "Thand bahut hai aaj kal..." | Joint stiffness increases in cold — gentle stretching reminder. Warm water with morning medicine helps swallowing. BP tends to rise in cold weather — regular monitoring matters. |
| **Summer** (Garmi) | March - May | "Garmi bahut badh gayi hai..." | Stay hydrated — medicines work better when the body is hydrated. Store medicines away from heat. Don't skip meals even if appetite is low. |
| **Monsoon** (Baarish) | June - September | "Baarish ka mausam hai..." | Waterborne illness risk — boiled water reminder. Mosquito-borne disease awareness (without fear-mongering). Don't stop medicines if you get a fever — consult doctor. |
| **Post-Monsoon** (Sharad) | October - November | "Mausam badal raha hai..." | Allergy season — if feeling congested, still take medicines. Festival season — enjoy but moderate sweets (for diabetic patients). |

### How Seasons Appear in Calls

A single line added to the prompt on ~1 in 5 calls (not every day — that would itself become repetitive):

> "If it fits naturally, briefly mention: [seasonal context]. Don't force it — only if the conversation allows."

Example: On a monsoon day, the AI might say "Baarish mein apna khayal rakhiye — paani ubaal ke pijiye" as part of the goodbye. Not every call, not forced — just occasional, natural care.

---

## Streak Tracking & Milestone Celebrations

### What's a Streak?

A streak counts consecutive days where the patient achieved **≥80% medicine adherence** (e.g., took 4 out of 5 medicines = 80%, counts as a streak day; took 3 out of 5 = 60%, streak breaks).

### Milestone Moments

| Streak | Celebration Level | What Happens |
|:---:|---|---|
| **7 days** | Warm acknowledgment | "Bauji, poore hafte dawai li — bahut acche!" |
| **14 days** | Enthusiastic praise | "Do hafte se ek bhi din nahi chhooda — sab log seekhein aapse!" |
| **21 days** | Habit formation pride | "Bauji, 21 din — ab toh aadat ban gayi hai! Kamaal!" |
| **30 days** | Major milestone | "Ek poora mahina! Bauji, aap champion hain! Aapke ghar walon ko batayenge!" |
| **60 days** | Special recognition | "Do mahine — koi nahi todh sakta aapka record!" |
| **100 days** | Legendary | "Sau din! Bauji, aap legend hain. Salaam!" |

### For the Payer

When a streak milestone is hit, the payer also gets a WhatsApp message:

> "Great news! [Patient Name] has taken their medicines for 30 days straight! Their dedication is remarkable. Here's their monthly adherence summary: [link]"

This is one of the highest-value retention moments for the payer — tangible proof that the service works.

### Streak Break Recovery

When a streak breaks, the next call should NOT scold or express disappointment. Instead:

> "Bauji, kal ki dawai reh gayi — koi baat nahi, aaj se phir shuru karte hain!"

Positive framing: "Aaj se phir shuru" (starting fresh today) — not "aapne miss kar di" (you missed it).

---

## Fatigue Detection & Response

### Fatigue Signals

The system should monitor these signals from call data to detect a patient losing interest:

| Signal | How to Detect | Weight |
|---|---|---|
| **Short calls** | Call duration < 45 seconds for 3+ consecutive calls | High |
| **Declined/No-answer** | 2+ consecutive no_answer or declined statuses | Very High |
| **Monosyllabic responses** | Patient's transcript shows < 3 words per response across 3+ calls | Medium |
| **Mood decline** | moodNotes trending: "good" → "okay" → "okay" → "not_well" | Medium |
| **No engagement** | Patient never asks anything or shares beyond yes/no for 7+ calls | Low-Medium |
| **Rush behavior** | Patient answers all medicines with a single "haan sab le li" without pause | Medium |

### Fatigue Score (0-100)

```
Score = (short_call_streak × 15)
      + (declined_streak × 25)
      + (monosyllabic_streak × 10)
      + (mood_declining ? 10 : 0)
      + (no_engagement_days × 5)
```

| Score | State | System Response |
|:---:|---|---|
| **0-20** | Engaged | Normal variant rotation, full feature set |
| **21-40** | Mild fatigue | Favor Quick Check variant, add more health tips, shorter calls |
| **41-60** | Moderate fatigue | Quick Check + Wellness-First only, reduce to essential medicines, include celebration whenever possible |
| **61-80** | High fatigue | Gentle Re-engage variant, critical medicines only, alert payer |
| **81-100** | Critical | Alert payer with options: adjust frequency, change timing, or pause temporarily |

### Payer Fatigue Alert (Score > 60)

WhatsApp message to primary payer:

> "[Patient Name] has seemed less engaged with their daily health calls recently. This is normal — sometimes a small adjustment helps.
>
> Would you like to:
> 1. Reduce calls to alternate days for 2 weeks
> 2. Change the call time
> 3. Keep the current schedule
>
> Reply 1, 2, or 3. You can always change back later."

### Recovery Protocol

When a fatigued patient (score > 40) answers a call and engages for >60 seconds:
- Reduce fatigue score by 15 points
- Next call: warmer tone, acknowledge their return without making it awkward
- Gradually increase call complexity back to normal over 3-5 calls

---

## Health Tips Rotation

### What Are Health Tips?

Short, safe, general wellness nuggets shared during ~1 in 4 calls. They add value beyond the medicine checklist and give the patient a reason to stay on the call.

### Rules

1. **Never diagnostic or prescriptive** — "Paani zyada pijiye" is fine; "Aapko yeh dawai badhani chahiye" is NOT
2. **Doctor-reviewed** before inclusion — every tip vetted by a medical advisor
3. **Tagged by relevance** — diabetes-relevant tips go to diabetic patients, BP tips to hypertension patients, general tips to all
4. **No repeat within 30 days** — the system tracks which tips each patient has heard recently
5. **Available in all 8 languages** — each tip is translated/localized, not just Hindi

### Example Tips by Category

**General Wellness:**
- "Dawai hamesha ek hi time pe lein — body ko routine achhi lagti hai" (Take medicine at the same time — body loves routine)
- "Raat ko achhi neend aaye toh subah dawai bhi yaad rehti hai" (Good sleep helps medicine routine)
- "Thoda sa chalna — chahe 10 minute hi — dawai ko aur acche se kaam karne deta hai" (Even 10 minutes of walking helps medicine work better)

**Diabetes-Specific:**
- "Khana khane ke baad 10 minute walk karne se sugar control mein rehti hai" (Post-meal walk helps sugar control)
- "Meethe fruit se zyada sabzi khayein — sugar stable rehti hai" (More vegetables, less sweet fruits)

**BP-Specific:**
- "Namak thoda kam — BP ke liye sabse asaan tareeka" (Reduce salt — simplest BP management)
- "Lambi saans lein — BP seedha neeche aata hai" (Deep breathing directly lowers BP)

**Seasonal:**
- Winter: "Thand mein garam paani ke saath dawai lein — aasani se utarti hai" (Warm water with medicine in winter)
- Summer: "Garmi mein dawai ko dhoop se door rakhiye" (Keep medicines away from sunlight in summer)
- Monsoon: "Baarish mein paani ubaal ke pijiye — pet theek rahega" (Boil water in monsoon)

### Delivery

Tips are woven naturally into the conversation — usually near the end, before goodbye:

> AI: "Achha Bauji, ek chhoti si baat — namak thoda kam karenge toh BP aur accha rahega. Bas itna. Apna khayal rakhiye!"

Not forced, not preachy. Like a family member casually mentioning something they read.

---

## First Impression Variation

The moment the patient picks up the phone determines the tone of the entire call. Today, it's always "Namaste {{patient_name}}!" — this must vary.

### First Message Variants by Context

| Context | Example First Messages |
|---|---|
| **Normal Morning** | "Good morning Bauji!", "Bauji, subah ki namaskar!", "Bauji, kaise hain aaj?" |
| **Normal Evening** | "Bauji, shaam ki namaskar!", "Bauji, aaj ka din kaisa raha?", "Namaste Bauji!" |
| **Festival Day** | "Bauji! Diwali ki bahut bahut shubhkamnayein!", "Arre Bauji, Holi ki mubarakbaad!" |
| **After Missed Call** | "Bauji! Kal aapki bahut yaad aayi. Kaise hain?", "Bauji, kal baat nahi ho paayi — aaj kaise hain?" |
| **Milestone Day** | "Bauji! Aaj bahut acchi khabar hai — suniye toh!", "Bauji, aaj kuch special batana hai!" |
| **Weekend** | "Bauji, chutti ka din hai — aaram se baat karte hain", "Weekend hai Bauji, kaisa chal raha hai?" |
| **After Complaint** | "Bauji, kal aapne bataya tha tabyat theek nahi thi — aaj kaisa lag raha hai?" |

### Language Adaptation

Each first message set must exist in all 8 supported languages. The tone and cultural register vary by language — a Telugu greeting has a different cultural flavor than a Hindi one. Localizers (not translators) should adapt these.

---

## Relationship Evolution Model

The AI's personality should evolve as the relationship matures. A Day 1 call should sound different from a Day 100 call — not because the script changed, but because the relationship deepened.

### Relationship Stages

| Stage | Call Count | AI Personality | Characteristics |
|---|---|---|---|
| **Stranger** | 1-3 | Formal, explanatory, slow | Introduces itself, explains the process, speaks slowly, asks permission-style questions |
| **Acquaintance** | 4-14 | Friendly, patient, structured | Still follows full structure but warmer tone, uses preferred name naturally |
| **Familiar** | 15-30 | Comfortable, adaptive | Starts using Quick Check variant for high-adherence patients, remembers complaints, shares tips |
| **Trusted** | 31-60 | Affectionate, efficient | Can batch-ask medicines, uses casual openers, celebrates milestones with genuine pride |
| **Family** | 60+ | Like a real family member | Maximum personalization, lightest touch, deepest context awareness, jokes occasionally |

### How This Is Implemented

The `callsCompletedCount` (already on the patient schema) maps to a relationship stage. The prompt assembler adds a personality directive:

- **Stranger:** "This is a new relationship. Be polite, clear, and patient. Explain what you're doing."
- **Family:** "You've known this person for months. Speak like a fond grandchild — warm, casual, occasionally playful. No need to be formal."

---

## Example Call Scenarios

### Scenario 1: Day 1, New Patient, Hindi

```
First Message: "Namaste Bauji! Main Health Discipline se bol rahi hoon."

Prompt Context:
- New patient, first call ever
- Relationship stage: Stranger
- Tone: Warm & Patient
- Flow: Standard (with introduction)
- No festival, no streak, no history
```

**Call sounds like:** A new acquaintance introducing themselves respectfully, explaining what they're going to do, taking it slow.

---

### Scenario 2: Day 23, Diwali, Good Streak, Telugu

```
First Message: "Amma! Deepavali shubhakankshalu! Ela unnaru?"

Prompt Context:
- 21-day streak (milestone!)
- Festival: Diwali
- Yesterday: all medicines taken, mood "good"
- Relationship stage: Familiar
- Tone: Festive & Celebratory
- Flow: Celebration
- Health tip: "Pandaga lo sweets thakkuva thinandi, sugar check cheyandi" (festival sweets moderation)
```

**Call sounds like:** A joyful family member calling on Diwali, celebrating a milestone, quick medicine check, a gentle health reminder woven into festival wishes.

---

### Scenario 3: Day 45, Fatigue Detected, Marathi

```
First Message: "Aai! Kal tumchi khup aathvan aali. Kashi aahat?"

Prompt Context:
- Fatigue score: 55 (moderate)
- Last 3 calls: short (<50 sec), monosyllabic
- Recent mood: "okay" × 4 calls
- Had headache complaint 3 days ago
- Relationship stage: Trusted
- Tone: Reassuring & Gentle
- Flow: Gentle Re-engage
- Only 2 critical medicines checked (skip non-critical)
```

**Call sounds like:** A caring person who noticed you've been distant. Very short, very warm, no pressure. "Bas itki baat hoti, aai. Kalji ghya!"

---

### Scenario 4: Day 100, Legendary Milestone, Hindi

```
First Message: "Bauji! Aaj bahut badi khabar hai — suniye toh!"

Prompt Context:
- 100-day streak!
- Relationship stage: Family
- Tone: Celebratory & Proud
- Flow: Celebration (extended)
- Today's special: "Sau din, Bauji! Legend hain aap!"
```

**Call sounds like:** A proud grandchild calling to celebrate — "Bauji, sau din ho gaye! Ek bhi din nahi chhooda! Ghar mein sabko batao!" Quick medicine check (batch), warm extended goodbye.

---

### Scenario 5: Regular Tuesday, Monsoon Season, Bengali

```
First Message: "Dadu! Kemon achhen aaj?"

Prompt Context:
- Call #37, Relationship: Trusted
- Streak: 12 days
- Yesterday: all taken, mood "good"
- Season: Monsoon
- Tone: Warm & Cheerful
- Flow: Standard
- Health tip: "Brishti te jol phutiye khaben — pet bhalo thakbe" (Boil water in rain)
```

**Call sounds like:** A normal friendly check-in with a seasonal health tip dropped naturally at the end.

---

## Metrics & Success Criteria

### Primary Metrics (Anti-Fatigue)

| Metric | Current (Estimated) | Target (3 Months) | Target (6 Months) |
|---|---|---|---|
| Monthly churn rate | ~10-12% | <8% | <5% |
| Average call duration (Day 30+ patients) | ~60 sec (rushing) | >80 sec | >90 sec |
| Call answer rate (Day 30+ patients) | ~70% | >80% | >85% |
| Patient word count per call (avg) | Low (monosyllabic) | 15+ words | 20+ words |
| Streak of 30+ days (% of patients) | — | 25% | 40% |

### Secondary Metrics (Engagement Quality)

| Metric | How Measured | Target |
|---|---|---|
| Variant diversity | No same variant 3x in a row per patient | 100% compliance |
| Festival greeting delivery | % of festival-day calls that included greeting | >95% |
| Fatigue detection accuracy | % of churned users who had score >60 before leaving | >70% |
| Health tip engagement | Calls with tips vs without — duration comparison | +10 sec on tip calls |
| Payer satisfaction (NPS) | Monthly survey | >50 |

### A/B Testing Framework

The `conversationVariant` and `toneUsed` fields on each call record enable comparing:
- Average call duration by variant type
- Adherence rate by variant type
- Churn correlation with fatigue score accuracy
- Patient word count trends after tips are introduced

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Item | Impact | Effort |
|---|---|---|
| Streak tracking (count consecutive adherence days, store on patient) | High | Low |
| Context builder (pull yesterday's call, recent moods, complaints, streak) | High | Medium |
| 5 conversation flow variants (prompt templates) | Very High | Medium |
| Emotional tone directives (6 tone profiles) | High | Low |
| First message variation (5-7 variants per language) | Medium | Low |
| Wire dynamic prompt assembly into call orchestrator | Critical | Medium |

**Phase 1 alone addresses 60-70% of the fatigue problem.** The static script becomes dynamic, context-aware, and emotionally varied.

### Phase 2: Cultural Layer (Week 3-4)

| Item | Impact | Effort |
|---|---|---|
| Festival calendar (25 festivals, 8 languages, greetings) | High | Medium |
| Seasonal health context (4 seasons, weather + health awareness) | Medium | Low |
| Health tips pool (50+ tips, 8 languages, condition-tagged) | Medium | Medium |
| Tip rotation tracking (no repeat within 30 days per patient) | Low | Low |

**Phase 2 makes the AI feel like it lives in India** — it knows what day it is, what season it is, and shares relevant wisdom.

### Phase 3: Intelligence Layer (Week 5-6)

| Item | Impact | Effort |
|---|---|---|
| Fatigue score calculation (post-call signal analysis) | Very High | Medium |
| Monosyllabic response detection (transcript word count analysis) | Medium | Low |
| Payer fatigue alerts via WhatsApp | High | Low |
| Adaptive frequency suggestions (alternate-day option) | High | Medium |
| Relationship evolution model (5 stages, personality progression) | Medium | Low |

**Phase 3 closes the feedback loop** — the system detects disengagement and responds before the patient churns.

### Phase 4: Optimization (Ongoing)

| Item | Impact | Effort |
|---|---|---|
| A/B test variant effectiveness | High | Medium |
| Per-language tone calibration | Medium | High |
| Religion/community-aware festival matching | Low | Medium |
| Regional dialect variations | Medium | High |
| Patient-initiated topic preferences ("Don't ask about BP") | Low | Low |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Over-personalization feels creepy** | Medium | High | Keep it subtle. "Kal aapne bataya..." is caring; reciting 5 data points is surveillance. Max 1 callback reference per call. |
| **Festival mismatch** (Hindu greeting to Muslim patient) | Medium | High | Start with universal festivals only (Diwali, Eid, Independence Day). Add religion/community field later for precise matching. When uncertain, skip festival greeting. |
| **Health tip perceived as medical advice** | Low | Very High | Every tip reviewed by doctor. No dosage, no drug-specific, no diagnostic language. "Paani zyada pijiye" = safe. "Aapka sugar high lag raha hai" = NOT safe. |
| **Prompt length increases cost** | High | Low | Dynamic prompt is ~50-80 tokens longer than static. At Gemini 1.5 Flash pricing, this is <$0.001 extra per call. Negligible. |
| **Too many variants → inconsistent data collection** | Medium | Medium | DATA EXTRACTION block remains identical across all variants. Only the conversational wrapper changes — the checklist inside is the same. |
| **Elderly patients notice and dislike change** | Low | Medium | Changes are gradual. A patient on Day 30 won't suddenly get a radically different call. The evolution is subtle — tone, opener, an occasional tip. Never jarring. |
| **Festival dates wrong** | Low | High | Cross-reference 2 sources. Mark Islamic dates as approximate (±1 day based on moon sighting). Better to skip a festival than to greet on the wrong day. |

---

## Summary

The anti-call-fatigue system transforms every call from a static checklist into a dynamic, culturally-aware, emotionally-intelligent conversation. The medicine adherence data collection stays identical — what changes is the human wrapper around it.

**The test is simple:** If a patient's grandchild listened to 7 consecutive calls, would they think it's a robot or a person? Today, they'd know by call 2. With this system, they shouldn't be sure even by call 7.

```
Today:      "Namaste Bauji!" → same script → same tone → every day → forever
Tomorrow:   Context + Calendar + Tone + Variant + Tips = feels like a real person
```

**Expected impact:** Monthly churn drops from ~10-12% to <5% within 6 months. Average patient lifetime extends from 6-8 months to 12-18 months. LTV per customer increases by 2x.
