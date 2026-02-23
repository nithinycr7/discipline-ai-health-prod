'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from './ui/scroll-reveal';

/* ───────────────────────── DATA ───────────────────────── */

const stats = [
  { value: '101M+', label: 'diabetics in India — the world\'s diabetes capital' },
  { value: '43%', label: 'average medication adherence for chronic conditions' },
  { value: '63%', label: 'of all deaths in India are caused by chronic diseases' },
];

const problemCards = [
  {
    title: 'Quarterly visits, zero follow-up',
    description: 'Patients see their doctor once every 3 months. In between? Nothing. No one checks if they took their Metformin, measured their BP, or noticed warning signs.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: '43% medication adherence',
    description: 'More than half of diabetic patients in India skip medicines regularly. The doctor only finds out at the next visit — if the patient comes at all. Non-adherence drives repeat hospitalizations.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
  {
    title: 'Language and literacy barriers',
    description: '65% of India lives in rural areas. Many patients can\'t read prescription labels in English. They need a voice in their language — not another app they won\'t open.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: '01',
    title: 'Doctor or hospital adds the patient',
    description: 'Upload patient details, medicines, preferred language, and call schedule via CSV or our dashboard. Takes under 2 minutes per patient. Bulk uploads supported.',
    accent: 'bg-primary/5 text-primary',
  },
  {
    number: '02',
    title: 'AI calls daily in their language',
    description: 'A warm, natural voice calls the patient — checks each medicine by name ("Aapne aaj sugar ki goli li?"), asks about symptoms, tracks vitals, and assesses mood. Works on any phone.',
    accent: 'bg-gold-light text-gold-dark',
  },
  {
    number: '03',
    title: 'Structured reports to doctor + family',
    description: 'Within 5 minutes: WhatsApp report to family, structured data on the doctor\'s dashboard. Missed-dose alerts, vitals trend detection, and mood anomaly flags — all automated.',
    accent: 'bg-primary/5 text-primary',
  },
];

const features = [
  {
    title: 'Daily medication tracking',
    description: 'Medicine-by-medicine adherence, not a vague "did you take your meds?" — we ask about each specific medicine by its local name and timing.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: 'Vitals monitoring',
    description: 'BP, glucose, and weight check-ins during the daily call. Trend detection flags deterioration before the next appointment. Anomaly alerts in real-time.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    title: 'Mood & wellness assessment',
    description: 'Chronic disease patients have 2-3x higher depression rates. Daily mood tracking catches mental health decline early — before it becomes a crisis.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
  },
  {
    title: '11 Indian languages',
    description: 'Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Odia, and English. Culturally adapted conversations with local medicine nicknames.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp reports',
    description: 'Daily adherence reports to patient families via WhatsApp. Weekly trend summaries for doctors. Missed-dose alerts in real-time. India\'s most-used messaging app.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    title: 'Doctor dashboard',
    description: 'Structured data: adherence rates, vitals trends, mood patterns. Filter by condition, severity, non-compliance. Export-ready for clinical audits. Population health view.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

const pricingFeatures = [
  'Daily AI wellness calls',
  'Medicine-by-medicine adherence tracking',
  'Vitals monitoring (BP, glucose)',
  'Mood & wellness assessment',
  'WhatsApp reports to family',
  'Doctor analytics dashboard',
  '11 Indian languages',
  'Real-time missed-dose alerts',
  'DPDP Act compliant',
];

const testimonials = [
  {
    quote: 'Between quarterly visits, I had zero visibility into whether my diabetic patients were actually taking their medicines. Now I get daily adherence data on 200+ patients — and it flags the ones who need urgent attention. This is what chronic care should look like.',
    name: 'Dr. Rajesh Khanna',
    location: 'Bangalore, India',
    role: 'Endocrinologist, 20+ years practice',
  },
  {
    quote: 'My mother-in-law has diabetes and hypertension. She used to forget her evening medicines every single day. Since the AI started calling her in Kannada, asking about each medicine by name, she hasn\'t missed a dose in 3 weeks. She even looks forward to the calls.',
    name: 'Meera Suresh',
    location: 'Mumbai, India',
    role: 'Daughter-in-law & primary caregiver',
  },
];

const chronicFaqs = [
  {
    question: 'Which chronic conditions does Cocarely support?',
    answer: 'Currently optimized for Type 2 diabetes, hypertension, cardiovascular disease (post-event), COPD, and chronic kidney disease. The AI adapts its questions, medicine checks, and vitals tracking based on condition-specific clinical protocols.',
  },
  {
    question: 'How does it work for a diabetic patient specifically?',
    answer: 'Daily call checks: fasting glucose reading, each prescribed medicine (Metformin, Glimepiride, insulin, etc.) by name and timing, diet adherence, foot care, any hypoglycemia symptoms. Reports flag trends like rising glucose levels and declining adherence patterns.',
  },
  {
    question: 'Do patients need a smartphone?',
    answer: 'No. The call works on any phone — basic feature phone, landline, or smartphone. Patients simply answer the phone and talk naturally in their preferred language. Zero tech skills or app downloads needed.',
  },
  {
    question: 'Who pays for this — the patient or the hospital?',
    answer: 'B2B2C model: the hospital, clinic, or insurer pays ₹300/patient/month. The patient receives the service at no cost. This ensures maximum adoption and compliance — patients are far more likely to engage when there\'s no cost barrier.',
  },
  {
    question: 'How quickly can we start a pilot?',
    answer: 'Same day. Upload a CSV of patients with their name, phone number, language preference, and medicine list. Configure call schedules, and the AI begins calling within hours. No IT integration required to start.',
  },
  {
    question: 'Is patient data secure and DPDP compliant?',
    answer: 'Yes. End-to-end encryption, role-based access, consent-first data collection. All data hosted on India-based infrastructure. Fully compliant with India\'s Digital Personal Data Protection Act. We can sign a BAA.',
  },
];

/* ───────────────────────── COMPONENT ───────────────────────── */

export function ChronicSections() {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute right-0 top-0 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-[200px] w-[200px] sm:h-[300px] sm:w-[300px] translate-y-1/4 -translate-x-1/4 rounded-full bg-gold-light/40 blur-3xl" />
        </div>

        <div className="section-container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/80 animate-pulse-slow" />
              For Chronic Disease Management
            </div>

            <h1 className="text-display-sm sm:text-display text-foreground animate-fade-up">
              101 million diabetics. 43% adherence.{' '}
              <span className="text-gradient">Let&apos;s fix this.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground animate-fade-up animate-delay-100">
              An AI voice companion that calls chronic disease patients daily in their language,
              checks every medicine by name, tracks vitals and mood, and sends structured reports
              to their doctor and family.{' '}
              <span className="font-medium text-foreground/90">No app. No smartphone. Just a phone call.</span>
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up animate-delay-200">
              <Link href="/register/hospital" className="btn-primary">
                Start a Pilot for Your Patients
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a href="mailto:hello@cocarely.com" className="btn-secondary">
                Schedule a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-border/60 bg-secondary/30 py-12">
        <div className="section-container">
          <div className="grid gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold text-primary sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-[220px] mx-auto">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section className="relative section-padding overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/50 to-background" />
        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <ScrollReveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
                The chronic care gap
              </p>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h2 className="mt-4 font-serif text-heading sm:text-display-sm text-foreground italic">
                &ldquo;Take your medicines&rdquo; isn&apos;t{' '}
                <span className="font-bold not-italic">enough</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="mt-6 text-body-lg text-muted-foreground leading-relaxed">
                NCDs account for 63% of all deaths in India. Most chronic care happens in the 10 minutes
                of a quarterly doctor visit.{' '}
                <span className="font-medium text-foreground/90">What happens in the 90 days between visits?</span>
              </p>
            </ScrollReveal>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
            {problemCards.map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 100}>
                <div className="marketing-card group h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-light text-gold-dark transition-colors group-hover:bg-gold group-hover:text-white">
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-heading-sm text-foreground">{card.title}</h3>
                  <p className="mt-2 text-body text-muted-foreground">{card.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                How it works
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                From prescription to daily monitoring in 3 steps
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                No IT integration needed. No app downloads for patients. Go live in hours.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-16 max-w-3xl space-y-6">
            {steps.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 150}>
                <div className="rounded-2xl border border-primary/20 bg-white/50 backdrop-blur-sm p-6 sm:p-8">
                  <div className="flex gap-4 sm:gap-6">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step.accent}`}>
                      {step.number}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-heading-sm text-foreground">{step.title}</h3>
                      <p className="mt-2 text-body text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-secondary/50" />
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                Built for chronic care
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Daily monitoring that actually works
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Designed for patients who won&apos;t use apps, can&apos;t read English, and need a voice they trust.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 80}>
                <div className="marketing-card group h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">Pricing</p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                One plan. Everything included. The hospital or insurer pays — the patient receives care at no cost.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="mx-auto mt-12 max-w-md">
              <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card/80 backdrop-blur-md p-8 shadow-elevated">
                <div className="absolute right-0 top-0">
                  <div className="rounded-bl-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                    All-Inclusive
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">Chronic Care Plan</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Per patient, per month</p>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">₹300</span>
                    <span className="text-muted-foreground/70">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    per patient &middot; billed monthly &middot; volume discounts available
                  </p>
                </div>

                <ul className="mt-8 space-y-3">
                  {pricingFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
                        <circle cx="12" cy="12" r="9.75" strokeWidth={1.5} />
                      </svg>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register/hospital"
                  className="mt-8 block w-full rounded-xl bg-primary px-6 py-3.5 text-center text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:bg-primary/90 hover:shadow-card hover:-translate-y-0.5"
                >
                  Start a Pilot
                </Link>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground/70">
                  30-day pilot available. No setup fees. Volume discounts for 500+ patients.{' '}
                  <a href="mailto:hello@cocarely.com" className="font-medium text-primary underline decoration-primary/20 underline-offset-2 hover:decoration-primary/80">
                    Contact us for enterprise pricing
                  </a>.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-secondary/50" />
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                What doctors and families say
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Better outcomes for patients and providers
              </h2>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 lg:grid-cols-2">
            {testimonials.map((t, index) => (
              <ScrollReveal key={t.name} delay={index * 150}>
                <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-soft">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-body text-muted-foreground leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 border-t border-secondary pt-5">
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground/70">{t.role} &middot; {t.location}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">FAQ</p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Common questions about chronic care monitoring
              </h2>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-12 max-w-2xl divide-y divide-border/60">
            {chronicFaqs.map((faq, index) => (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="py-5">
                  <button
                    onClick={() => setFaqOpenIndex(faqOpenIndex === index ? null : index)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <span className="text-base font-semibold text-foreground sm:text-lg">{faq.question}</span>
                    <span className="mt-1 shrink-0">
                      <svg
                        className={`h-5 w-5 text-muted-foreground/70 transition-transform duration-300 ${faqOpenIndex === index ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${faqOpenIndex === index ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="text-body text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-20 text-center">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
                <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
              </div>
              <div className="relative">
                <h2 className="text-heading sm:text-display-sm text-white">
                  Your patients deserve daily care,
                  <br />
                  <span className="font-light">not quarterly check-ins.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-body-lg text-primary-foreground/70">
                  101 million diabetics. 43% adherence. 63% of deaths from NCDs.
                  The numbers won&apos;t change with quarterly visits alone. Give your patients
                  the daily support they need — in their language, on their phone.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link
                    href="/register/hospital"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-[0.938rem] font-semibold text-primary shadow-soft transition-all duration-300 hover:bg-primary/5 hover:shadow-card hover:-translate-y-0.5"
                  >
                    Start a Pilot
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                  <a
                    href="mailto:hello@cocarely.com"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-[0.938rem] font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                  >
                    Schedule a Demo
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-primary-foreground/70">
                  {['30-day pilot', 'No setup fees', '₹300/patient/month'].map((badge) => (
                    <span key={badge} className="flex items-center gap-1.5 glass-dark rounded-full px-3 py-1.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
