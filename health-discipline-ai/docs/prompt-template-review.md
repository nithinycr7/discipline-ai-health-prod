# Prompt Template Variable Review

## Overview

All **11 template variables** in the AI voice agent system prompt are properly wired end-to-end — from data models through the dynamic prompt assembly pipeline to the ElevenLabs API call.

---

## Section-by-Section Analysis

### LANGUAGE Section — `{{preferred_language}}`

**Correct.** Patient stores ISO code (`'hi'`), but `elevenlabs-agent.service.ts` converts it to the full name (`"Hindi"`) via a language map before passing it as a dynamic variable. The template receives the human-readable name, which is what the prompt needs.

---

### IDENTITY & SOUL Section

| Variable | Source | Verdict |
|---|---|---|
| `{{patient_name}}` | `patient.preferredName` | Correct |
| `{{relationship_directive}}` | `RelationshipStage` (STRANGER → FAMILY, based on `callsCompletedCount`) | Correct |
| `{{tone_directive}}` | `ToneDirective` enum (6 tones mapped to variant) | Correct |
| `{{context_notes}}` | Aggregated from last 14 days of call history | Correct |

---

### STEP 1: The Opening — `{{is_new_patient}}`

**Correct**, but **one potential conflict**: `{{is_new_patient}}` is a boolean from `patient.isNewPatient`, while `{{relationship_directive}}` is derived from `callsCompletedCount`. A patient could have `isNewPatient: true` but `callsCompletedCount > 3` (ACQUAINTANCE stage) if `isNewPatient` isn't toggled after the first call.

> **Recommendation:** Verify that `isNewPatient` is set to `false` after the first completed call.

---

### STEP 2: Medicines

| Variable | Source | Verdict |
|---|---|---|
| `{{medicine_count}}` | `medicines.length` (stringified) | Correct |
| `{{medicines_list}}` | Grouped by timing: `"morning: Aspirin, HP120 | night: Metformin"` | Correct — uses `nicknames[0] || brandName` |

---

### STEP 3: Vitals & Screening

| Variable | Source | Verdict |
|---|---|---|
| `{{has_glucometer}}` | `patient.hasGlucometer` (stringified boolean) | Correct |
| `{{has_bp_monitor}}` | `patient.hasBPMonitor` (stringified boolean) | Correct |
| `{{screening_questions}}` | Selected from `SCREENING_SCHEDULE` based on `healthConditions` + day of week | Correct — intentionally skipped for CELEBRATION and GENTLE_REENGAGEMENT variants |

---

### STEP 4: Wellness & Custom Flow — `{{flow_directive}}`

**Correct.** Maps to one of 5 conversation variants selected by `FlowVariantSelectorService`:

- `STANDARD` — Default check-in
- `WELLNESS_FIRST` — Leads with wellbeing (triggered by yesterday's bad mood/complaints)
- `QUICK_CHECK` — Efficient call for highly adherent patients
- `CELEBRATION` — Streak milestone recognition
- `GENTLE_REENGAGEMENT` — For disengaged patients (missed calls / high fatigue)

---

### POST-CALL Data Extraction

The 5 extraction fields match the ElevenLabs webhook payload and are properly parsed in the webhook controller:

| Field | Format |
|---|---|
| `medicine_responses` | `[BrandName:taken | not_taken | unclear]` |
| `vitals_checked` | `yes | no | not_applicable` |
| `wellness` | `good | okay | not_well` |
| `complaints` | English summary or `"none"` |
| `re_scheduled` | `true | false` |

---

## Variable Pipeline Summary

| Variable | Source | Type | Example | Populated By |
|---|---|---|---|---|
| `{{patient_name}}` | `Patient.preferredName` | String | `"Ramesh"` | CallOrchestratorService |
| `{{is_new_patient}}` | `Patient.isNewPatient` | String | `"false"` | CallOrchestratorService |
| `{{has_glucometer}}` | `Patient.hasGlucometer` | String | `"true"` | CallOrchestratorService |
| `{{has_bp_monitor}}` | `Patient.hasBPMonitor` | String | `"false"` | CallOrchestratorService |
| `{{preferred_language}}` | `Patient.preferredLanguage` (converted) | String | `"Hindi"` | ElevenLabsAgentService |
| `{{medicine_count}}` | `medicines.length` | String | `"3"` | ElevenLabsAgentService |
| `{{medicines_list}}` | medicines (formatted by timing) | String | `"morning: Aspirin | night: Metformin"` | ElevenLabsAgentService |
| `{{flow_directive}}` | `ConversationVariant` | String | `"CONVERSATION APPROACH — WELLNESS FIRST:..."` | PromptAssemblerService |
| `{{tone_directive}}` | `ToneDirective` | String | `"TONE: Be warm, cheerful..."` | PromptAssemblerService |
| `{{context_notes}}` | Call history (14 days) | String | `"Current streak: 5 days..."` | PromptAssemblerService |
| `{{relationship_directive}}` | `RelationshipStage` | String | `"RELATIONSHIP: You know this patient well..."` | PromptAssemblerService |
| `{{screening_questions}}` | `SCREENING_SCHEDULE` + `healthConditions` | String | `"1. What was your sugar reading?..."` | PromptAssemblerService |

---

## Issues & Recommendations

### 1. `isNewPatient` vs `relationship_directive` Redundancy

The template uses both `{{is_new_patient}}` (Step 1) and `{{relationship_directive}}` (Identity section) which could give conflicting signals. The `STRANGER` relationship stage already covers the "new patient" intro behavior.

**Fix:** Either ensure `isNewPatient` is toggled to `false` after the first completed call, or remove `{{is_new_patient}}` from the prompt and rely solely on `{{relationship_directive}}`.

### 2. Empty Dynamic Variables When Disabled

When `dynamicPromptEnabled` is `false` on a CallConfig, five variables become empty strings:
- `{{flow_directive}}`
- `{{tone_directive}}`
- `{{context_notes}}`
- `{{relationship_directive}}`
- `{{screening_questions}}`

The prompt template has no fallback instructions for this case — Steps 3-4 would reference blank directives.

**Fix:** Add a default standard flow and warm-cheerful tone as fallback values when dynamic prompts are disabled.

### 3. Identity vs Relationship Tone (Non-Issue)

The template says "daughter/granddaughter persona" but `{{relationship_directive}}` starts formal at the STRANGER stage. This is intentional — the identity section establishes the *character* while the relationship directive adjusts the *familiarity level*. No action needed.

---

## Verdict

**All variables are correctly placed and populated.** The two recommendations above are edge-case hardening suggestions, not bugs.
