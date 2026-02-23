import { useState } from "react";

const PHASES = [
  {
    id: "discovery",
    label: "Discovery",
    icon: "\uD83D\uDD0D",
    title: "How the NRI Child Finds Us",
    duration: "Before Day 0",
    color: "#0F3460",
    critical: false,
    content: {
      summary: "The payer (NRI child) discovers Discipline.AI through NRI WhatsApp groups, word-of-mouth, or targeted content. They message our WhatsApp number or visit our landing page.",
      channels: [
        "NRI WhatsApp community groups",
        "Indian expat Facebook groups (US, UK, UAE, Canada)",
        "YouTube testimonial videos from existing families",
        "Google search: 'medicine reminder for parents India'",
        "Referral from existing user (most powerful)"
      ],
      insight: "The payer is NOT looking for a 'health app.' They're searching for peace of mind. Our messaging should never lead with technology. Lead with emotion: 'Know your parents took their medicine today \u2014 even from 8,000 miles away.'",
      firstMessage: "The NRI child sends 'Hi' or clicks 'Start' from our landing page link. This creates the user document with their phone number. They are the PAYER, not the patient.",
      risk: "If the first message feels like a bot, they leave. The welcome must feel human, warm, and immediately communicate value.",
    }
  },
  {
    id: "payer_intro",
    label: "Payer Welcome",
    icon: "\uD83D\uDC4B",
    title: "Phase 1: Payer Introduction",
    duration: "2-3 minutes",
    color: "#E94560",
    critical: true,
    content: {
      summary: "The first 60 seconds determine whether the NRI child continues or abandons. We must establish trust, communicate value, and make them feel this is built specifically for their situation.",
      script: [
        { sender: "AI", text: "Namaste! \uD83D\uDE4F Welcome to Discipline.AI Health \u2014 India's first voice-call health companion for elderly parents." },
        { sender: "AI", text: "We call your parents every morning in their language, check if they took their medicines, note how they're feeling, and send you a weekly health report." },
        { sender: "AI", text: "Thousands of NRI families use us to stay connected to their parents' health \u2014 even from abroad.\n\nAre you looking to set this up for a parent or elderly family member?" },
        { sender: "USER", text: "Yes, for my father" },
        { sender: "AI", text: "Wonderful! Let's set this up for your father. It takes about 8-10 minutes, and at the end, we'll place a test call so he can hear the voice and feel comfortable.\n\nFirst \u2014 what's your name?" },
      ],
      stateChanges: "health_onboarding_step: 'payer_intro' \u2192 'payer_info'\nfamily_role: 'payer'\nverticals: ['health']",
      whyThisWorks: "We DON'T ask 'What would you like to do?' or show a menu. We immediately describe the product in one sentence, provide social proof ('thousands of families'), and ask a YES/NO qualifying question. The user self-selects. No friction.",
      risk: "If they say 'No, for myself' \u2014 we need a different flow (self-care path). If they say 'Just exploring' \u2014 send them a 2-minute explainer video and let them come back.",
    }
  },
  {
    id: "payer_info",
    label: "Payer Details",
    icon: "\uD83D\uDCCB",
    title: "Phase 2: Payer Information",
    duration: "1-2 minutes",
    color: "#00B4D8",
    critical: false,
    content: {
      summary: "Collect payer details. Keep it fast \u2014 they're eager to set up for their parent, not fill forms about themselves.",
      script: [
        { sender: "USER", text: "Rahul Sharma" },
        { sender: "AI", text: "Thanks Rahul! And where are you based? This helps us time your reports and alerts correctly." },
        { sender: "USER", text: "Chicago, USA" },
        { sender: "AI", text: "Got it \u2014 Chicago. We'll send your weekly reports on Sunday evenings your time (around 7-8 PM CST).\n\nNow let's set up your father's profile. What's his name?" },
      ],
      stateChanges: "payer_name: 'Rahul Sharma'\npayer_timezone: 'America/Chicago'\nhealth_onboarding_step: 'patient_info'",
      fieldsCollected: [
        "Payer name",
        "Payer location/timezone (for report scheduling)",
        "Relationship to patient (son/daughter/other)"
      ],
      whyThisWorks: "We immediately connect the timezone to a tangible benefit ('reports on Sunday evening your time'). Every piece of data collection is justified by a visible value.",
      risk: "Don't ask for email, address, or anything unnecessary. Every extra question is a drop-off risk. We only need: name, location, relationship.",
    }
  },
  {
    id: "patient_info",
    label: "Patient Profile",
    icon: "\uD83D\uDC74",
    title: "Phase 3: Patient Information",
    duration: "2-3 minutes",
    color: "#2D6A4F",
    critical: true,
    content: {
      summary: "This is where we learn about the elderly parent. Every question must be phrased from the payer's perspective \u2014 they're describing their parent, not filling a medical form.",
      script: [
        { sender: "USER", text: "Ramesh Sharma" },
        { sender: "AI", text: "What does your father prefer to be called? Many families have a preferred form of address \u2014 like 'Papa', 'Bauji', or 'Sharma uncle ji'. Our AI will use this name in every call." },
        { sender: "USER", text: "Everyone calls him Bauji" },
        { sender: "AI", text: "Noted \u2014 we'll call him Bauji. \uD83D\uDE4F \n\nHow old is Bauji?" },
        { sender: "USER", text: "68" },
        { sender: "AI", text: "And which language is he most comfortable in?" },
        { sender: "BUTTONS", text: "Hindi | Telugu | Tamil | Marathi | Bengali | Kannada | Gujarati | English" },
        { sender: "USER", text: "Hindi" },
        { sender: "AI", text: "Great \u2014 our calls to Bauji will be in Hindi.\n\nOne more important question: Can Bauji use WhatsApp? (Even just to receive photos or voice notes from family?)" },
        { sender: "BUTTONS", text: "Yes, uses WhatsApp | Has phone but no WhatsApp | I'm not sure" },
        { sender: "USER", text: "Yes, uses WhatsApp" },
        { sender: "AI", text: "Perfect. We'll use both voice calls AND WhatsApp with Bauji.\n\nNow \u2014 what's Bauji's phone number? We'll use this for daily calls." },
      ],
      stateChanges: "patient_name: 'Ramesh Sharma'\npreferred_name: 'Bauji'\nage: 68\npreferred_language: 'hi'\ndigital_tier: 2\npatient_phone: '91XXXXXXXXXX'",
      fieldsCollected: [
        "Patient's full name",
        "Preferred name (CRITICAL \u2014 this is how AI addresses them)",
        "Age",
        "Preferred language",
        "Digital tier (WhatsApp capable? Feature phone only?)",
        "Patient's phone number"
      ],
      whyThisWorks: "The 'preferred name' question is the emotional hook. The moment the payer tells us 'call him Bauji', they're emotionally invested. They're personalizing the service. They can already imagine their father hearing 'Namaste Bauji!' on the phone. This is the moment conversion becomes likely.",
      risk: "CRITICAL: The patient's phone number must be different from the payer's. If same number, the routing logic breaks. Validate: patient_phone \u2260 payer_phone. If they enter the same number, ask: 'Is this also your number? We need your father's personal phone number for the daily calls.'",
    }
  },
  {
    id: "conditions",
    label: "Health Conditions",
    icon: "\uD83C\uDFE5",
    title: "Phase 4: Health Conditions",
    duration: "1 minute",
    color: "#7209B7",
    critical: false,
    content: {
      summary: "Quick multi-select of conditions. Don't make this feel clinical. Frame it as 'so we know what to check on.'",
      script: [
        { sender: "AI", text: "Now, so we know what to focus on during calls \u2014 what health conditions does Bauji have?\n\nSelect all that apply:" },
        { sender: "BUTTONS", text: "Diabetes | High BP | Heart Disease | Arthritis/Joint Pain | Thyroid | Cholesterol | Other" },
        { sender: "USER", text: "[Selects: Diabetes, High BP]" },
        { sender: "AI", text: "Got it \u2014 Diabetes and High BP. These are very common and very manageable with regular medicine and monitoring.\n\nDoes Bauji have a glucometer (sugar checking machine) at home?" },
        { sender: "BUTTONS", text: "Yes | No | Not sure" },
        { sender: "USER", text: "Yes" },
        { sender: "AI", text: "Great! We'll ask him to share his glucose readings during calls.\n\nDoes he have a BP monitor at home?" },
        { sender: "BUTTONS", text: "Yes | No" },
        { sender: "USER", text: "Yes" },
        { sender: "AI", text: "Excellent \u2014 we'll track both glucose and BP in his health reports. \uD83D\uDCCA\n\nNow for the most important part \u2014 his medicines." },
      ],
      stateChanges: "conditions: ['diabetes_type2', 'hypertension']\nhas_glucometer: true\nhas_bp_monitor: true\nhealth_onboarding_step: 'medicines'",
      whyThisWorks: "Buttons, not free text. Reduces friction to one tap. The immediate 'very common and manageable' message reduces anxiety. The glucometer/BP monitor questions set up expectations for what data we'll collect.",
      risk: "If they select 'Other' \u2014 ask for free text. Store it but don't try to parse it. Flag for manual review. Don't pretend the AI understands every condition.",
    }
  },
  {
    id: "medicines",
    label: "Medicine Setup",
    icon: "\uD83D\uDC8A",
    title: "Phase 5: Medicine Setup",
    duration: "3-5 minutes",
    color: "#E76F51",
    critical: true,
    content: {
      summary: "THE MOST CRITICAL STEP. If we get the medicine list wrong, the morning call asks about wrong medicines, the patient gets confused, and the family loses trust permanently. We offer two paths: photo upload (faster) or manual entry (more accurate).",
      script: [
        { sender: "AI", text: "Let's set up Bauji's medicines. This is the most important step \u2014 our AI will check on each medicine by name during every call.\n\nWhat's easiest for you?" },
        { sender: "BUTTONS", text: "\uD83D\uDCF8 Share a photo of his prescription | \u270D\uFE0F I'll type each medicine" },
        { sender: "USER", text: "I'll type each medicine" },
        { sender: "AI", text: "Great. Let's go one medicine at a time.\n\nMedicine 1: What's the name? (Brand name like 'Telma 40' or generic like 'Telmisartan' \u2014 either works)" },
        { sender: "USER", text: "Telma 40" },
        { sender: "AI", text: "\u2705 Telma 40 (Telmisartan 40mg) \u2014 for blood pressure.\n\nWhen does Bauji take this?" },
        { sender: "BUTTONS", text: "Morning | Afternoon | Evening | Night | Morning + Evening" },
        { sender: "USER", text: "Morning" },
        { sender: "AI", text: "Before or after food?" },
        { sender: "BUTTONS", text: "Before food | After food | With food | Anytime" },
        { sender: "USER", text: "Before food" },
        { sender: "AI", text: "Got it! \u2705 Telma 40 \u2014 every morning, before food.\n\nNow here's a fun but important question: What does Bauji CALL this medicine? Does he say 'BP wali goli', 'white tablet', or something else? This helps our AI speak his language." },
        { sender: "USER", text: "He calls it BP wali goli" },
        { sender: "AI", text: "Perfect! Our AI will ask him: 'Bauji, BP wali goli li kya subah?' \u2014 exactly how your family talks. \uD83D\uDE0A\n\nAny more medicines to add?" },
        { sender: "BUTTONS", text: "\u2795 Add another medicine | \u2705 That's all medicines" },
      ],
      stateChanges: "medicine_schedules/{patient_phone}.medicines[0] = {\n  id: 'med_001',\n  generic_name: 'telmisartan',\n  brand_name: 'Telma 40',\n  nicknames: ['BP wali goli'],\n  dosage: '40mg',\n  times: ['morning'],\n  with_food: 'before',\n  condition: 'hypertension',\n  critical: true\n}",
      whyThisWorks: "THREE things make this work:\n\n1. We confirm back the generic name immediately ('Telma 40 = Telmisartan 40mg') \u2014 this builds trust that we actually know medicines, not just storing text.\n\n2. We ask for the NICKNAME. This is the moment the payer realizes this isn't a generic reminder app. 'Our AI will ask him BP wali goli li kya' \u2014 they can hear their father's future call in their head.\n\n3. We loop ('Any more medicines?') instead of asking 'How many medicines?' upfront. This is less intimidating for families managing 5-7 medicines.",
      risk: "HIGHEST RISK STEP. Failure modes:\n\n\u2022 Payer doesn't know exact medicine names \u2192 offer photo upload path\n\u2022 Medicine name not in our catalog \u2192 store as-is, flag for human review within 24 hours\n\u2022 Payer enters combination drug (Telma-AM) \u2192 our catalog must map this to TWO generics (telmisartan + amlodipine)\n\u2022 Payer enters dosage wrong (Telma 80 instead of 40) \u2192 we cannot validate this, store as entered, flag for doctor confirmation in first weekly report\n\nNEVER reject a medicine entry. Always accept, always confirm back, flag uncertainties for human review.",
    }
  },
  {
    id: "family_setup",
    label: "Family Members",
    icon: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC66",
    title: "Phase 6: Family Network",
    duration: "1-2 minutes",
    color: "#0F3460",
    critical: false,
    content: {
      summary: "Add other family members who should receive health updates. Keep this optional but encouraged \u2014 more family members = more accountability = better outcomes.",
      script: [
        { sender: "AI", text: "You'll automatically receive Bauji's weekly health report and any important alerts.\n\nWould you like to add other family members who should also get updates? (Like a sibling, Bauji's spouse, or a local relative?)" },
        { sender: "BUTTONS", text: "\u2795 Yes, add family member | \u23ED\uFE0F Skip for now, just me" },
        { sender: "USER", text: "Yes, add family member" },
        { sender: "AI", text: "What's their name, phone number, and relationship to Bauji?\n\n(Example: 'Priya, +91-98765-43210, daughter')" },
        { sender: "USER", text: "Priya Sharma, 9876543210, daughter" },
        { sender: "AI", text: "Added Priya (daughter). She'll receive:\n\u2705 Weekly health report\n\u2705 Critical alerts (missed important medicines, abnormal readings)\n\nShould she also get daily summaries, or just weekly + alerts?" },
        { sender: "BUTTONS", text: "Weekly + alerts (recommended) | Daily summaries too" },
        { sender: "USER", text: "Weekly + alerts" },
        { sender: "AI", text: "Perfect. Add anyone else?" },
        { sender: "BUTTONS", text: "\u2795 Add another | \u2705 Done adding family" },
      ],
      stateChanges: "families/{family_id}.members['91YYYYYYYYYY'] = {\n  role: 'monitor',\n  name: 'Priya Sharma',\n  relationship: 'daughter',\n  permissions: ['view_adherence', 'view_vitals', 'receive_alerts'],\n  notification_prefs: { weekly_report: true, missed_critical: true }\n}",
      whyThisWorks: "We default to 'weekly + alerts (recommended)' \u2014 this prevents notification fatigue which is the #1 reason family members disengage. The payer always gets everything; additional members get a curated subset.",
      risk: "Family dynamics are sensitive. Never assume the spouse should be added. Never suggest specific family members. Let the payer decide who gets access. This also matters for consent \u2014 the patient must know who sees their data (handled in test call).",
    }
  },
  {
    id: "schedule",
    label: "Call Schedule",
    icon: "\u23F0",
    title: "Phase 7: Call Schedule",
    duration: "1 minute",
    color: "#E94560",
    critical: false,
    content: {
      summary: "Set the daily call times. This is about the PATIENT's routine, not the payer's. Ask about the parent's daily rhythm.",
      script: [
        { sender: "AI", text: "Now let's set Bauji's call schedule.\n\nMorning call \u2014 what time does Bauji usually wake up and have breakfast?" },
        { sender: "BUTTONS", text: "7:00-8:00 AM | 8:00-9:00 AM | 9:00-10:00 AM | Other time" },
        { sender: "USER", text: "8:00-9:00 AM" },
        { sender: "AI", text: "We'll call Bauji at 8:30 AM \u2014 right around breakfast time, perfect for morning medicine check.\n\nEvening call \u2014 what time does he usually have dinner?" },
        { sender: "BUTTONS", text: "6:00-7:00 PM | 7:00-8:00 PM | 8:00-9:00 PM | Other" },
        { sender: "USER", text: "7:00-8:00 PM" },
        { sender: "AI", text: "Evening call at 6:30 PM \u2014 before dinner, perfect for evening medicine check.\n\n\uD83D\uDCDE Morning: 8:30 AM\n\uD83D\uDCDE Evening: 6:30 PM\n\nBauji will hear a warm Hindi voice. Would he prefer a female voice (like a caring bahu/daughter-in-law) or a male voice?" },
        { sender: "BUTTONS", text: "Female voice (recommended) | Male voice" },
        { sender: "USER", text: "Female voice" },
      ],
      stateChanges: "call_schedule: {\n  morning: { time: '08:30', enabled: true },\n  evening: { time: '18:30', enabled: true },\n  weekly_deep: { day: 'sunday', time: '10:00', enabled: true }\n}\npreferred_voice: 'female_warm'",
      whyThisWorks: "We DON'T say 'choose a time between 7 AM and 10 AM.' We ask about their ROUTINE \u2014 'when does he wake up?' \u2014 and then MAP the call time to the routine. This feels thoughtful, not mechanical. The voice gender choice makes it feel premium and personalized.",
      risk: "Some families will want calls at times outside safe hours (before 7 AM or after 10 PM). Politely constrain: 'For best results and Bauji's comfort, we recommend calls between 7 AM and 9 PM.'",
    }
  },
  {
    id: "payment",
    label: "Payment",
    icon: "\uD83D\uDCB3",
    title: "Phase 8: Plan Selection & Payment",
    duration: "1-2 minutes",
    color: "#00B4D8",
    critical: true,
    content: {
      summary: "This is where money changes hands. The framing matters enormously. Don't sell features \u2014 sell peace of mind. The NRI child should feel this is the best \u20B9999 they spend each month.",
      script: [
        { sender: "AI", text: "Everything's set up for Bauji! Here's what happens every day:\n\n\uD83D\uDCDE 8:30 AM \u2014 Warm Hindi call checking each medicine by name\n\uD83D\uDCDE 6:30 PM \u2014 Evening follow-up + activity check\n\uD83D\uDCCA Sunday \u2014 Full weekly report sent to you and Priya\n\uD83D\uDEA8 Instant alerts if anything needs attention\n\nChoose your plan:" },
        { sender: "AI", text: "\uD83C\uDF3F Saathi \u2014 \u20B9499/mo\n1 morning call (Mon-Fri), weekly report\n\n\u2B50 Suraksha \u2014 \u20B9999/mo \u2190 Most Popular\n2 calls daily (7 days), real-time alerts, up to 3 family members\n\n\uD83D\uDC8E Sampurna \u2014 \u20B91,999/mo\nEverything in Suraksha + weekly deep check-in + doctor reports + priority support" },
        { sender: "BUTTONS", text: "Saathi \u20B9499 | Suraksha \u20B9999 \u2B50 | Sampurna \u20B91,999" },
        { sender: "USER", text: "Suraksha \u20B9999" },
        { sender: "AI", text: "Excellent choice \u2014 Suraksha is our most popular plan. \uD83D\uDE4F \n\n\u20B9999/month = less than \u20B933/day for daily health monitoring of Bauji.\n\nFirst 7 days are completely free. If Bauji or you aren't happy, cancel anytime with one message.\n\n[Payment Link]" },
      ],
      stateChanges: "billing_state: 'trial' (7-day free trial for health)\ntrial_starts_at: now\ntrial_ends_at: now + 7 days\nplan_type: 'suraksha'\nis_billable: true",
      whyThisWorks: "THREE anchoring techniques:\n\n1. Show the daily cost (\u20B933/day) \u2014 feels trivial, especially in USD ($0.40/day)\n2. 7-day free trial, not 14 \u2014 health has higher urgency than exam prep. 7 days is enough to prove value (they'll see 1 weekly report)\n3. 'Cancel anytime with one message' \u2014 reduces purchase anxiety\n\nThe 'Most Popular' tag on Suraksha is social proof nudging toward the middle tier (where best margins are).",
      risk: "NRI payment friction is real. Razorpay doesn't always work for US/UK cards. MUST have Stripe as a fallback for international cards. If payment fails, don't lose the onboarding \u2014 save all data and say 'We'll send you the payment link again shortly. Meanwhile, let's do the test call so Bauji is ready!'",
    }
  },
  {
    id: "test_call",
    label: "Test Call",
    icon: "\uD83D\uDCDE",
    title: "Phase 9: The Test Call (MOST IMPORTANT)",
    duration: "3-5 minutes",
    color: "#2D6A4F",
    critical: true,
    content: {
      summary: "This is the moment of truth. The AI places a live call to the patient while the payer is on the line (or listening on speaker). The patient hears the AI voice for the first time. If they reject it, everything unravels. If they accept it, you have a customer for life.",
      script: [
        { sender: "AI", text: "Payment successful! \uD83C\uDF89\n\nNow the most important step \u2014 let's introduce our AI to Bauji with a test call.\n\n\uD83D\uDD14 Please ask Bauji to keep his phone nearby. We'll call him in 2 minutes.\n\n\uD83D\uDCA1 TIP: If possible, be on speaker phone with him or on a video call so you can hear the interaction and reassure him.\n\nReady?" },
        { sender: "BUTTONS", text: "\uD83D\uDCDE Place the test call now | \u23F0 Schedule for later today" },
        { sender: "USER", text: "Place the test call now" },
        { sender: "AI", text: "Calling Bauji now... \uD83D\uDCDE\n\n[System places outbound call to patient's number]" },
        { sender: "CALL", text: "[Phone rings. Bauji picks up.]\n\nAI: 'Namaste Bauji! Main aapki health saathi hun \u2014 Cocarely se bol rahi hun. Aapke bete Rahul ne aapke liye ye seva shuru ki hai.\n\nRoz subah aur shaam main aapko phone karungi \u2014 aapki dawaiyon ke baare mein poochungi, aur aapki tabiyat ka haal jaanungi. Bilkul ghar ki bahu jaisi! [gentle laugh]\n\nBauji, aapko ye theek lag raha hai? Roz subah 8:30 baje call aaegi \u2014 aap uthayenge?'" },
        { sender: "CALL", text: "Bauji: 'Haan haan, theek hai beta.'\n\nAI: 'Bahut achha Bauji! Ek aur baat \u2014 Rahul aur Priya ko aapki health report milegi har hafte. Ye aapko theek hai?\n\nBauji: 'Haan, theek hai.'\n\nAI: 'Shukriya Bauji! Kal subah 8:30 baje se aapki regular calls shuru ho jaengi. Raat ko achhi neend lena! Namaste! \uD83D\uDE4F'" },
      ],
      stateChanges: "health_onboarding_step: 'complete'\nstatus: 'active'\nconsent: {\n  patient_consented: true,\n  patient_consent_date: now,\n  patient_consent_method: 'voice_call',\n  data_sharing_level: 'full'\n}\nfirst_call_scheduled_at: tomorrow_morning",
      whyThisWorks: "This call accomplishes FIVE things simultaneously:\n\n1. INTRODUCTION \u2014 Patient knows who's calling tomorrow, not surprised\n2. CONSENT \u2014 Verbal consent for calls AND data sharing with family (DPDP Act)\n3. VOICE FAMILIARIZATION \u2014 Patient hears the voice, tone, language style\n4. EXPECTATION SETTING \u2014 '8:30 AM roz' sets the routine\n5. EMOTIONAL BOND \u2014 'Bilkul ghar ki bahu jaisi' positions AI as family, not technology\n\nThe payer hearing this call is equally important. They hear their father say 'haan theek hai' and feel relief. This is the conversion-locking moment. Churn after hearing your parent accept the AI is extremely unlikely.",
      risk: "FAILURE SCENARIOS AND HANDLING:\n\n\u2022 Patient doesn't pick up \u2192 Wait 10 min, try again. If still no answer, ask payer to call patient first, then retry.\n\n\u2022 Patient is confused/suspicious \u2192 AI says 'Bauji, Rahul beta hai aapke saath phone pe. Unse baat kariye.' Handoff to payer to explain.\n\n\u2022 Patient says 'mujhe nahi chahiye' \u2192 RESPECT THIS. Tell payer: 'Bauji isn't comfortable right now. Many parents need a day or two. Can we try again tomorrow with you on the call together?'\n\n\u2022 Patient has hearing difficulty \u2192 AI speaks slower, louder. If still struggling, switch to WhatsApp voice notes only (digital_tier downgrade).\n\n\u2022 Patient speaks a different language than expected \u2192 Flag, ask payer to confirm language preference.\n\nNEVER force it. A reluctant patient will simply not pick up tomorrow, and the payer will request a refund. Better to reschedule than to push through a bad first impression.",
    }
  },
  {
    id: "post_onboarding",
    label: "First 48 Hours",
    icon: "\uD83C\uDF05",
    title: "Phase 10: The Critical First 48 Hours",
    duration: "Day 1-2",
    color: "#7209B7",
    critical: true,
    content: {
      summary: "Onboarding isn't done when the form is complete. It's done when the patient has picked up 3 calls and the payer has received their first report. The first 48 hours are make-or-break.",
      script: [
        { sender: "SYSTEM", text: "DAY 1 MORNING (8:30 AM) \u2014 First real call to Bauji" },
        { sender: "AI", text: "[AI calls Bauji. This is the FIRST real medicine check-in. The script must be extra warm, extra slow, extra patient. If Bauji is confused about the call, the AI should remind: 'Bauji, main Cocarely se hun \u2014 Rahul beta ne shuru kiya tha, yaad hai?']" },
        { sender: "SYSTEM", text: "IMMEDIATELY AFTER CALL \u2192 WhatsApp to payer" },
        { sender: "AI_TO_PAYER", text: "Good morning Rahul! \u2600\uFE0F \n\nBauji's first call went well! Here's what we learned:\n\n\u2705 BP medicine (Telma 40) \u2014 Taken\n\u26A0\uFE0F Sugar medicine (Glycomet) \u2014 Missed, reminded to take\n\uD83D\uDCCA Sugar reading: 180 mg/dL (slightly above target)\n\uD83D\uDE0A Mood: Good, mentioned knee pain\n\nWe'll check on the Glycomet again in the evening call.\n\n[Detailed report will come Sunday]" },
        { sender: "SYSTEM", text: "DAY 1 EVENING (6:30 PM) \u2014 Second call" },
        { sender: "SYSTEM", text: "DAY 2 MORNING \u2014 Third call. If patient has picked up all 3, send payer:" },
        { sender: "AI_TO_PAYER", text: "Rahul, quick update \u2014 Bauji has picked up all 3 calls so far! \uD83C\uDF89\n\nHis medicine adherence is at 83% (5 out of 6 doses taken). Sugar reading today was 168 \u2014 coming down.\n\nLooks like Bauji is getting comfortable with the calls. Your Sunday report will have the full picture." },
      ],
      stateChanges: "health_days/{date} populated for Day 1 and Day 2\nadherence tracking active\nfirst_report_sent: true",
      whyThisWorks: "The payer gets IMMEDIATE value \u2014 within hours of paying, they receive concrete health data about their parent. 'Sugar reading: 180' is more information than they've had in months. This is the 'aha moment' that locks in retention.\n\nThe Day 2 '3 calls picked up' message creates the feeling of a working system. The payer relaxes. They tell their spouse. They might even share with a friend. Viral loop begins.",
      risk: "If Bauji doesn't pick up Day 1 morning call:\n\u2192 Retry twice per the call state machine\n\u2192 If still no answer, WhatsApp to payer: 'Bauji didn't pick up this morning. This is normal for the first day \u2014 some parents need a reminder. Could you give him a quick call to remind him that the health call will come at 8:30 AM?'\n\u2192 This turns the payer into an active participant, which actually increases their engagement.\n\nIf Bauji picks up but is short/disengaged:\n\u2192 AI keeps call under 2 minutes. Doesn't push. Says 'Kal phir baat karte hain Bauji, aapka din achha jaaye!'\n\u2192 Day 2 and Day 3 calls will be warmer as patient gets familiar.\n\u2192 Most elderly Indians become CHATTY by Day 4-5 once they realize the AI actually listens.",
    }
  }
];

export default function HealthcareOnboarding() {
  const [activePhase, setActivePhase] = useState(0);
  const [showScript, setShowScript] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);
  const [showRisks, setShowRisks] = useState(false);

  const phase = PHASES[activePhase];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0a0a0f", color: "#e0e0e6", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #16213E 0%, #0F3460 50%, #1a1a2e 100%)", padding: "24px 32px", borderBottom: "2px solid #E94560" }}>
        <div style={{ fontSize: 13, color: "#E94560", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>Discipline.AI Healthcare</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>Onboarding Flow Blueprint</div>
        <div style={{ fontSize: 14, color: "#8892b0", marginTop: 4 }}>Complete 10-phase journey: NRI Child (Payer) &rarr; Patient Setup &rarr; Test Call &rarr; First 48 Hours</div>
      </div>

      {/* Phase Navigation */}
      <div style={{ display: "flex", overflowX: "auto", background: "#111118", borderBottom: "1px solid #2a2a35", padding: "0 16px" }}>
        {PHASES.map((ph, i) => (
          <button
            key={ph.id}
            onClick={() => setActivePhase(i)}
            style={{
              background: i === activePhase ? phase.color + "22" : "transparent",
              border: "none",
              borderBottom: i === activePhase ? `3px solid ${phase.color}` : "3px solid transparent",
              color: i === activePhase ? "#fff" : "#666",
              padding: "12px 14px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: 12,
              fontWeight: i === activePhase ? 700 : 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
          >
            <span style={{ fontSize: 16 }}>{ph.icon}</span>
            <span>{ph.label}</span>
            {ph.critical && <span style={{ background: "#E94560", color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>CRITICAL</span>}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 80px" }}>
        {/* Phase Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>{phase.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: phase.color, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Phase {activePhase + 1} of {PHASES.length} &bull; {phase.duration}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{phase.title}</div>
            </div>
          </div>
          <p style={{ fontSize: 15, color: "#b0b0bc", lineHeight: 1.7, margin: "12px 0 0" }}>{phase.content.summary}</p>
        </div>

        {/* Toggle Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[
            ["showScript", "\uD83D\uDCAC Conversation Script", showScript, setShowScript],
            ["showTech", "\u2699\uFE0F Technical Details", showTechnical, setShowTechnical],
            ["showRisk", "\u26A0\uFE0F Risks & Edge Cases", showRisks, setShowRisks]
          ].map(([key, label, state, setter]) => (
            <button
              key={key}
              onClick={() => setter(!state)}
              style={{
                background: state ? phase.color + "33" : "#1a1a25",
                border: `1px solid ${state ? phase.color : "#2a2a35"}`,
                color: state ? "#fff" : "#888",
                padding: "8px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conversation Script */}
        {showScript && phase.content.script && (
          <div style={{ background: "#13131d", borderRadius: 12, border: "1px solid #2a2a35", padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: phase.color, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Conversation Flow</div>
            {phase.content.script.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.sender === "USER" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{
                  maxWidth: "80%",
                  background: msg.sender === "USER" ? "#0F3460" : msg.sender === "BUTTONS" ? "#2a1a35" : msg.sender === "CALL" ? "#1a2e1a" : msg.sender === "SYSTEM" ? "#2a2a15" : msg.sender === "AI_TO_PAYER" ? "#1a2a2e" : "#1c1c28",
                  border: `1px solid ${msg.sender === "USER" ? "#1a4a80" : msg.sender === "CALL" ? "#2d6a4f" : msg.sender === "SYSTEM" ? "#6a6a2d" : "#2a2a35"}`,
                  borderRadius: 12,
                  padding: "10px 14px"
                }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: msg.sender === "USER" ? "#60a5fa" : msg.sender === "BUTTONS" ? "#a78bfa" : msg.sender === "CALL" ? "#6ee7b7" : msg.sender === "SYSTEM" ? "#fbbf24" : msg.sender === "AI_TO_PAYER" ? "#67e8f9" : phase.color,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: 1
                  }}>
                    {msg.sender === "AI" ? "\uD83E\uDD16 AI (WhatsApp)" : msg.sender === "USER" ? "\uD83D\uDC64 NRI Child (Payer)" : msg.sender === "BUTTONS" ? "\uD83D\uDD18 Button Options" : msg.sender === "CALL" ? "\uD83D\uDCDE Voice Call" : msg.sender === "SYSTEM" ? "\u2699\uFE0F System Event" : "\uD83D\uDCE8 AI \u2192 Payer"}
                  </div>
                  <div style={{ fontSize: 14, color: "#d0d0dc", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Why This Works */}
        {showScript && phase.content.whyThisWorks && (
          <div style={{ background: "#0f1f15", borderRadius: 12, border: "1px solid #2d6a4f", padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6ee7b7", marginBottom: 10 }}>\uD83D\uDCA1 WHY THIS DESIGN WORKS</div>
            <div style={{ fontSize: 14, color: "#b0d4c0", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{phase.content.whyThisWorks}</div>
          </div>
        )}

        {/* Technical Details */}
        {showTechnical && (
          <div style={{ background: "#111125", borderRadius: 12, border: "1px solid #2a2a50", padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 10 }}>\u2699\uFE0F TECHNICAL: STATE CHANGES & DATA</div>
            {phase.content.stateChanges && (
              <pre style={{ background: "#0a0a18", padding: 14, borderRadius: 8, fontSize: 13, color: "#a5b4fc", overflowX: "auto", lineHeight: 1.6, border: "1px solid #2a2a40" }}>{phase.content.stateChanges}</pre>
            )}
            {phase.content.fieldsCollected && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#818cf8", marginBottom: 6 }}>Fields Collected:</div>
                {phase.content.fieldsCollected.map((f, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#a0a0bc", padding: "3px 0" }}>&bull; {f}</div>
                ))}
              </div>
            )}
            {phase.content.channels && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#818cf8", marginBottom: 6 }}>Channels:</div>
                {phase.content.channels.map((ch, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#a0a0bc", padding: "3px 0" }}>&bull; {ch}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Risks */}
        {showRisks && phase.content.risk && (
          <div style={{ background: "#1f1115", borderRadius: 12, border: "1px solid #6a2d3a", padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fca5a5", marginBottom: 10 }}>\u26A0\uFE0F RISKS & EDGE CASES</div>
            <div style={{ fontSize: 14, color: "#d4a0a0", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{phase.content.risk}</div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
          <button
            onClick={() => setActivePhase(Math.max(0, activePhase - 1))}
            style={{ background: activePhase === 0 ? "#1a1a25" : "#16213E", border: "1px solid #2a2a45", color: activePhase === 0 ? "#444" : "#fff", padding: "10px 24px", borderRadius: 8, cursor: activePhase === 0 ? "default" : "pointer", fontSize: 14, fontWeight: 600 }}
          >
            &larr; Previous Phase
          </button>
          <div style={{ fontSize: 13, color: "#666", alignSelf: "center" }}>{activePhase + 1} / {PHASES.length}</div>
          <button
            onClick={() => setActivePhase(Math.min(PHASES.length - 1, activePhase + 1))}
            style={{ background: activePhase === PHASES.length - 1 ? "#1a1a25" : phase.color, border: "none", color: activePhase === PHASES.length - 1 ? "#444" : "#fff", padding: "10px 24px", borderRadius: 8, cursor: activePhase === PHASES.length - 1 ? "default" : "pointer", fontSize: 14, fontWeight: 600 }}
          >
            Next Phase &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
