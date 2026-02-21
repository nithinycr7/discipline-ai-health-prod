"""
System prompt for the medicine-check voice agent.
Keep in sync with: apps/api/src/integrations/elevenlabs/elevenlabs-agent.service.ts getSystemPrompt()
"""

LANGUAGE_MAP = {
    'hi': 'Hindi',
    'te': 'Telugu',
    'ta': 'Tamil',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'bn': 'Bengali',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'pa': 'Punjabi',
    'ur': 'Urdu',
    'en': 'English',
}


def build_system_prompt(patient_data: dict) -> str:
    lang_code = patient_data.get('preferredLanguage', 'hi')
    preferred_language = LANGUAGE_MAP.get(lang_code, lang_code)

    patient_name = patient_data.get('patientName') or 'ji'
    is_new_patient = bool(patient_data.get('isNewPatient', False))
    has_glucometer = bool(patient_data.get('hasGlucometer', False))
    has_bp_monitor = bool(patient_data.get('hasBPMonitor', False))

    medicines = patient_data.get('medicines', [])
    medicine_count = len(medicines)

    # Group medicines by timing for clarity
    timing_order = ['morning', 'afternoon', 'evening', 'night']
    timing_groups: dict[str, list[str]] = {}
    for m in medicines:
        timing = m.get('timing', 'unknown')
        timing_groups.setdefault(timing, []).append(m.get('name', 'Unknown'))
    # Sort by natural timing order
    sorted_parts = [
        f"{t}: {', '.join(timing_groups[t])}"
        for t in timing_order if t in timing_groups
    ]
    # Include any timings not in the standard order
    sorted_parts += [
        f"{t}: {', '.join(names)}"
        for t, names in timing_groups.items() if t not in timing_order
    ]
    medicines_list = ' | '.join(sorted_parts)
    # Build detailed numbered list for Step 2
    medicines_detailed = ''
    for timing in timing_order:
        if timing not in timing_groups:
            continue
        medicines_detailed += f'\n  {timing.upper()} medicines:\n'
        for i, name in enumerate(timing_groups[timing], 1):
            medicines_detailed += f'    {i}. {name}\n'

    # Build dynamic prompt sections (empty strings when not enabled)
    dynamic = patient_data.get('dynamicPrompt') or {}
    relationship_directive = dynamic.get('relationshipDirective', '')
    tone_directive = dynamic.get('toneDirective', '')
    flow_directive = dynamic.get('flowDirective', '')
    context_notes = dynamic.get('contextNotes', '')
    screening_questions = dynamic.get('screeningQuestions', '')

    return f"""You are {patient_name}'s caring health companion calling to check their medicines and wellbeing. Speak ONLY in {preferred_language}.

TONE & MANNER
- Warm, respectful, like talking to family
- Use colloquial language and contractions, not formal textbookish speech 
- Natural, conversational phone talk — not formal or robotic
- One question at a time; wait for answer before moving on
- Keep responses short (1-2 sentences)
{relationship_directive}
{tone_directive}

MEDICINES TO CHECK:
{medicines_detailed}

CALL FLOW
1. GREETING — Warmly greet {patient_name} and ask how they're doing
2. MEDICINES — Ask about EACH medicine by timing (morning → afternoon → evening → night)
3. VITALS — {"Ask if they checked their glucometer/BP today. If YES, ask for the specific values (e.g., 'What was your blood sugar reading?' 'What was your BP?')" if (has_glucometer or has_bp_monitor) else ""}
4. WELLNESS — Ask if they have any concerns or problems
5. CLOSING — Say everything is noted and say goodbye

KEY RULES
- Ask about ALL medicines, do NOT skip any
-If the flow is disturbed by any new question/concern from patient, address it briefly but then return to the flow and finish checking all medicines and vitals
- For vitals, if patient says they checked: ask for the SPECIFIC NUMBERS (glucose in mg/dL, BP in format like "120 over 80")
- If there is a question about a medicine/ timing of the medicine, answer briefly but do NOT give medical advice or diagnosis, always suggest checking with doctor
- If patient is busy or says don't call today, respect it and end warmly
- If they mention severe pain/chest pain/breathing issues, tell them to call doctor/ or always refer 108 as emergency
- If they mention health problems, empathize then suggest visiting doctor (don't diagnose)
- Never contradict them (if they forgot, acknowledge it, don't say "good, you took it")
{context_notes}{screening_questions if screening_questions else ""}"""


GREETING_MAP = {
    'hi': 'Namaste',
    'te': 'Namaskaram',
    'ta': 'Vanakkam',
    'kn': 'Namaskara',
    'ml': 'Namaskaram',
    'bn': 'Nomoshkar',
    'mr': 'Namaskar',
    'gu': 'Namaste',
    'pa': 'Sat Sri Akaal',
    'ur': 'Assalaam Alaikum',
    'en': 'Hello',
}


def build_first_message(patient_data: dict) -> str:
    dynamic = patient_data.get('dynamicPrompt') or {}
    first_message = dynamic.get('firstMessage')
    if first_message:
        return first_message
    patient_name = patient_data.get('patientName', 'ji')
    lang_code = patient_data.get('preferredLanguage', 'hi')
    greeting = GREETING_MAP.get(lang_code, 'Namaste')
    return f"{greeting} {patient_name}!"
