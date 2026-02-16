# Image Prompts for Gemini Generation

Generate each image below and save it to `apps/website/public/images/` with the exact filename specified.

All images should share a consistent visual language:
- **Style**: Clean, warm, modern illustration with subtle grain texture. Not photorealistic — more editorial/illustration style.
- **Color palette**: Deep forest green (#1B4332), warm gold (#C9A96E), off-white (#FAFAF7), soft grays
- **Mood**: Warm, caring, trustworthy, human — NOT clinical or tech-heavy
- **Resolution**: 2x (double the display size for retina)

---

## 1. Hero Dashboard Screenshot
**Filename**: `hero-dashboard.png`
**Size**: 2400 x 1350px (displays at 1200x675)

**Prompt**:
```
A clean, modern web dashboard UI screenshot for a health monitoring app. The dashboard shows:
- A header with "Good morning, Priya" and today's date
- A large circular chart showing "92% Weekly Adherence" in forest green
- A calendar grid for the month with green checkmarks on most days, 2-3 amber dots for partial, 1 red dot for missed
- A card showing "Today's Calls" with a patient name "Amma" and status "Completed - All medicines taken"
- A sidebar with navigation icons
- Color scheme: forest green (#1B4332) primary, warm gold (#C9A96E) accents, clean white background, soft shadows
- Modern, minimal UI design with generous spacing — think Linear or Vercel dashboard aesthetic
- No real patient data, use placeholder values that look realistic
```

---

## 2. Step 1 — Add Parent
**Filename**: `step-add-parent.png`
**Size**: 1120 x 800px (displays at 560x400)

**Prompt**:
```
A clean UI screenshot of a mobile/web form for adding a parent's details. The form shows:
- Fields: "Parent's Name" (filled with "Lakshmi Devi"), "Phone Number" (+91...), "Preferred Language" (dropdown showing "Telugu")
- A "Medicines" section with 3 pills listed: "BP medicine (morning)", "Sugar tablet (morning & evening)", "Thyroid (empty stomach)"
- A "Call Schedule" section showing morning 8:00 AM and evening 7:00 PM
- Clean, modern form design with rounded inputs, forest green accent buttons
- Warm, inviting color scheme with white background and subtle green accents
- Professional UI design, not a wireframe
```

---

## 3. Step 2 — AI Calls
**Filename**: `step-ai-calls.png`
**Size**: 1120 x 800px (displays at 560x400)

**Prompt**:
```
An editorial-style illustration showing the concept of an AI making a caring phone call to an elderly Indian person. Composition:
- Left side: Abstract representation of an AI voice assistant — smooth sound waves emanating from a phone icon, in forest green and gold
- Right side: A warm illustration of an elderly Indian woman (grandmother) smiling while talking on a basic phone, wearing a traditional saree
- Between them: Floating text bubbles in Hindi/Telugu script suggesting conversation — "Namaste Amma ji", "BP wali goli li?"
- Background: Soft, warm gradient with subtle abstract patterns
- Style: Modern editorial illustration, not photorealistic. Warm and human feeling.
- Colors: Forest green, warm gold, soft cream background
```

---

## 4. Step 3 — Get Reports
**Filename**: `step-get-reports.png`
**Size**: 1120 x 800px (displays at 560x400)

**Prompt**:
```
A clean mockup showing a WhatsApp-style report message on a phone screen. The message shows:
- A structured daily report card:
  "🏥 Daily Health Report — Lakshmi Devi
  📅 Today, 8:15 AM

  💊 Medicines:
  ✅ BP tablet — Taken
  ✅ Sugar tablet — Taken
  ❌ Thyroid — Missed

  🩺 Vitals:
  BP: 130/82 (Normal)

  😊 Mood: Good, mentioned knee pain"
- The phone is held in someone's hand, suggesting a family member reading it
- Clean, modern phone mockup with WhatsApp green header
- Background: Soft, warm with subtle blur
- Style: Clean product mockup, feels real but polished
```

---

## 5. Testimonial Avatar — Priya
**Filename**: `testimonial-priya.png`
**Size**: 160 x 160px (displays at 80x80)

**Prompt**:
```
A professional headshot-style portrait of a young Indian woman, age 30-35, warm smile, modern professional look. She could be a tech professional living in the US. Natural lighting, neutral background. Warm, approachable expression. Slight head tilt. Modern hairstyle. Professional but not corporate.
```

---

## 6. Testimonial Avatar — Rahul
**Filename**: `testimonial-rahul.png`
**Size**: 160 x 160px (displays at 80x80)

**Prompt**:
```
A professional headshot-style portrait of a young Indian man, age 30-35, friendly smile, modern look. He could be a professional living in London. Short neat hair, possibly light stubble. Natural lighting, neutral background. Warm, trustworthy expression. Casual professional — think tech startup founder.
```

---

## 7. Testimonial Avatar — Doctor
**Filename**: `testimonial-doctor.png`
**Size**: 160 x 160px (displays at 80x80)

**Prompt**:
```
A professional headshot-style portrait of an Indian woman doctor, age 45-50, confident and warm smile. She's wearing a white coat with a stethoscope. Silver/gray streaks in neatly styled hair. Kind eyes, authoritative but approachable. Natural lighting, neutral medical office background. Professional and distinguished.
```

---

## 8. OG Image (Social Sharing)
**Filename**: `og-image.png`
**Size**: 2400 x 1260px (displays at 1200x630)

**Prompt**:
```
A clean social media preview card for "Health Discipline AI". Layout:
- Left side: Large text "Your parents' health, one call away" in white, bold modern sans-serif font
- Below the text: "AI calls your parents daily in their language, checks each medicine by name, and sends you a real report." in smaller text
- Right side: A subtle illustration of a phone with sound waves, surrounded by small icons representing different Indian languages
- Background: Deep forest green (#1B4332) with subtle geometric pattern
- Bottom: "healthdiscipline.ai" in small text with a warm gold accent bar
- Clean, professional, editorial feel — not cluttered
```

---

## Summary of files needed

| # | Filename | Size | Purpose |
|---|----------|------|---------|
| 1 | `hero-dashboard.png` | 2400x1350 | Hero section main visual |
| 2 | `step-add-parent.png` | 1120x800 | How It Works step 1 |
| 3 | `step-ai-calls.png` | 1120x800 | How It Works step 2 |
| 4 | `step-get-reports.png` | 1120x800 | How It Works step 3 |
| 5 | `testimonial-priya.png` | 160x160 | Testimonial avatar |
| 6 | `testimonial-rahul.png` | 160x160 | Testimonial avatar |
| 7 | `testimonial-doctor.png` | 160x160 | Testimonial avatar |
| 8 | `og-image.png` | 2400x1260 | Social sharing preview |

Place all generated images in: `apps/website/public/images/`
