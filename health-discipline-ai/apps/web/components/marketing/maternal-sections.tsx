'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from './ui/scroll-reveal';

/* ───────────────────────── DATA ───────────────────────── */

const stats = [
  { value: '26M+', label: 'pregnancies every year in India' },
  { value: '22%', label: 'of new mothers experience postpartum depression' },
  { value: '1 in 4', label: 'children miss essential vaccinations on time' },
];

const problemCards = [
  {
    title: 'ANC visits missed or incomplete',
    description: 'Only 58% of women in India complete all recommended antenatal visits. In rural areas, 32% receive inadequate care. No one follows up between appointments.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'Postpartum depression goes undetected',
    description: '22% of Indian mothers experience PPD — yet screening is virtually nonexistent outside urban hospitals. Stigma prevents women from seeking help on their own.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
  },
  {
    title: 'Vaccination schedules are forgotten',
    description: '1 in 4 children misses essential vaccines. Parents forget dates, ASHA workers are overburdened, and there is no automated reminder system that works on basic phones.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: '01',
    title: 'Register the expecting mother',
    description: 'Hospital, clinic, or family member adds the mother\'s details — due date, preferred language, doctor, and any high-risk conditions. Takes under 2 minutes.',
    accent: 'bg-pink-50 text-pink-700',
  },
  {
    number: '02',
    title: 'AI calls daily in her language',
    description: 'A warm, caring voice calls the mother — checks how she\'s feeling, asks about nutrition, medicines, symptoms, and mood. Adapts questions based on trimester, postpartum stage, or child\'s age.',
    accent: 'bg-primary/5 text-primary',
  },
  {
    number: '03',
    title: 'Structured reports to doctor & family',
    description: 'Within minutes: WhatsApp report to family, structured data on the doctor\'s dashboard. Red-flag alerts for danger signs (bleeding, severe headaches, reduced fetal movement). Vaccination reminders auto-scheduled.',
    accent: 'bg-pink-50 text-pink-700',
  },
];

const features = [
  {
    title: 'Trimester-adapted check-ins',
    description: 'Questions adapt automatically — first trimester focuses on nausea, nutrition, and folic acid. Third trimester monitors swelling, BP, and fetal movement. Postpartum tracks recovery and newborn care.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    title: 'PPD & mood screening',
    description: 'Conversational mood assessment every call — not a clinical questionnaire, but natural questions about sleep, appetite, and feelings. Flags depression markers early, before they escalate.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    title: 'Vaccination reminders',
    description: 'Auto-scheduled reminders for the entire immunization calendar — BCG, OPV, DPT, Hepatitis B, Measles, and all boosters. Calls the family 2 days before, on the day, and follows up if missed.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    title: 'Danger sign detection',
    description: 'AI is trained on WHO & FOGSI danger signs — severe headache, blurred vision, reduced fetal movement, heavy bleeding, high fever. Immediate escalation alert to doctor and family.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    title: '11 Indian languages',
    description: 'Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Odia, and English. Culturally sensitive conversations that respect family dynamics and local practices.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: 'Child milestone tracking',
    description: 'Post-birth, the AI tracks developmental milestones — first smile, rolling over, sitting, crawling, first words. Flags delays early and recommends specialist consultation when needed.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

const journeyPhases = [
  {
    phase: 'Pregnancy (9 months)',
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    items: [
      'Daily wellness check-in call',
      'Nutrition & iron/folic acid reminders',
      'ANC visit appointment reminders',
      'Danger sign monitoring',
      'Mood & anxiety tracking',
      'High-risk pregnancy alerts',
    ],
  },
  {
    phase: 'Postpartum (0-6 months)',
    color: 'bg-primary/10 text-primary border-primary/20',
    items: [
      'Recovery & healing check-ins',
      'Breastfeeding support & guidance',
      'PPD screening via mood tracking',
      'Newborn care tips (bathing, cord care)',
      'Vaccination schedule reminders',
      'Family planning awareness',
    ],
  },
  {
    phase: 'Child Care (6-24 months)',
    color: 'bg-gold-light text-gold-dark border-gold/30',
    items: [
      'Vaccination reminders (full schedule)',
      'Developmental milestone tracking',
      'Complementary feeding guidance',
      'Growth monitoring check-ins',
      'Illness symptom screening',
      'Specialist referral alerts',
    ],
  },
];

const pricingFeatures = [
  'Daily AI wellness calls throughout pregnancy',
  'Postpartum recovery & PPD screening',
  'Full vaccination schedule reminders',
  'Danger sign detection & doctor alerts',
  'Child developmental milestone tracking',
  'WhatsApp reports to family',
  'Doctor analytics dashboard',
  '11 Indian languages',
  'DPDP Act compliant',
];

const testimonials = [
  {
    quote: 'My sister is pregnant in Lucknow and I\'m in Toronto. I used to worry every day — is she eating well? Is she taking her iron tablets? Now I get a daily WhatsApp report after the AI calls her in Hindi. Last week it flagged low haemoglobin symptoms and she got checked immediately. This is exactly what NRI families need.',
    name: 'Priya Sharma',
    location: 'Toronto, Canada',
    role: 'NRI sister & Cocarely subscriber',
  },
  {
    quote: 'We discharge 200+ maternity patients a month. Post-delivery follow-up was our biggest gap — we\'d lose track after day 3. With Cocarely calling every new mother daily, we caught 4 cases of postpartum complications in the first month that would have been missed. The ROI is undeniable.',
    name: 'Dr. Anjali Mehta',
    location: 'Pune, India',
    role: 'Head of Obstetrics, City Hospital',
  },
];

const maternalFaqs = [
  {
    question: 'When does the AI start calling — and for how long?',
    answer: 'Calls can begin as early as the first trimester and continue through pregnancy, postpartum (up to 6 months), and child care (up to 24 months). The total engagement window is up to 33 months. You choose the duration based on your program needs.',
  },
  {
    question: 'What happens if the AI detects a danger sign?',
    answer: 'Immediate escalation. If the mother reports symptoms matching WHO/FOGSI danger signs (heavy bleeding, severe headache, blurred vision, reduced fetal movement, high fever), the system sends real-time alerts to the registered doctor and family members via WhatsApp and SMS. No delays.',
  },
  {
    question: 'How does vaccination tracking work?',
    answer: 'Based on the child\'s date of birth, the AI auto-schedules the entire immunization calendar (BCG, OPV, DPT, Hepatitis B, Measles, MR, and all boosters as per India\'s Universal Immunization Programme). Reminder calls go out 2 days before, on the day, and a follow-up if the vaccine was missed.',
  },
  {
    question: 'Does the mother need a smartphone?',
    answer: 'No. The AI calls work on any phone — basic feature phone, landline, or smartphone. The mother simply answers and speaks naturally in her preferred language. Zero app downloads or tech skills needed. This is critical for reaching rural and low-literacy populations.',
  },
  {
    question: 'How is this different from the government\'s Kilkari program?',
    answer: 'Kilkari sends pre-recorded, one-way voice messages. Cocarely conducts interactive AI conversations — it listens, asks follow-up questions, collects health data, detects danger signs, and adapts to each mother\'s specific stage and condition. It\'s the difference between receiving a pamphlet and talking to a nurse.',
  },
  {
    question: 'Can NRI family members monitor from abroad?',
    answer: 'Yes. NRI family members get a real-time English dashboard showing the mother\'s daily wellness status, mood trends, upcoming vaccination dates, and any red flags. Daily WhatsApp summaries are sent automatically. You stay informed without making daily international calls.',
  },
];

/* ───────────────────────── COMPONENT ───────────────────────── */

export function MaternalSections() {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-50/80 via-transparent to-transparent" />
          <div className="absolute right-0 top-0 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-pink-100/60 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-[200px] w-[200px] sm:h-[300px] sm:w-[300px] translate-y-1/4 -translate-x-1/4 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="section-container">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1.5 text-sm font-medium text-pink-700 animate-fade-in">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse-slow" />
              Maternal &amp; Child Health
            </div>

            <h1 className="text-display-sm sm:text-display text-foreground animate-fade-up">
              26 million pregnancies. Zero daily monitoring.{' '}
              <span className="text-gradient">Until now.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground animate-fade-up animate-delay-100">
              An AI voice companion that cares for expecting and new mothers daily — checking wellness,
              tracking nutrition, screening for postpartum depression, and reminding families about
              every vaccination.{' '}
              <span className="font-medium text-foreground/90">In her language. On any phone.</span>
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up animate-delay-200">
              <Link href="/register/payer" className="btn-primary">
                Start Monitoring a Loved One
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link href="/register/hospital" className="btn-secondary">
                For Hospitals &amp; Clinics
              </Link>
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
              <p className="text-sm font-semibold uppercase tracking-widest text-pink-600">
                The maternal care gap
              </p>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <h2 className="mt-4 font-serif text-heading sm:text-display-sm text-foreground italic">
                Between appointments,{' '}
                <span className="font-bold not-italic">who&apos;s checking on her?</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <p className="mt-6 text-body-lg text-muted-foreground leading-relaxed">
                India records 28,000+ maternal deaths every year. Most complications are preventable
                with timely detection. But who monitors the mother between her monthly doctor visit?{' '}
                <span className="font-medium text-foreground/90">Nobody — until now.</span>
              </p>
            </ScrollReveal>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
            {problemCards.map((card, index) => (
              <ScrollReveal key={card.title} delay={index * 100}>
                <div className="marketing-card group h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 transition-colors group-hover:bg-pink-500 group-hover:text-white">
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

      {/* ── The Journey ── */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-secondary/50" />
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                Complete care continuum
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Pregnancy to toddlerhood — one platform
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Cocarely adapts its daily calls across every stage — from first trimester to the child&apos;s second birthday.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {journeyPhases.map((phase, index) => (
              <ScrollReveal key={phase.phase} delay={index * 150}>
                <div className="flex flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-soft h-full">
                  <span className={`inline-flex self-start items-center rounded-full border px-3 py-1 text-xs font-semibold ${phase.color}`}>
                    {phase.phase}
                  </span>
                  <ul className="mt-5 flex-1 space-y-3">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                How it works
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                From registration to daily care in 3 steps
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Works for NRI families, private hospitals, and public health programs alike.
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
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-secondary/50" />
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                Built for maternal care
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Every feature a mother and her family need
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Designed for women who need a caring voice — not another app to download.
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
      <section className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">Pricing</p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Affordable care for every mother
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                For NRI families or hospitals — one simple plan that covers pregnancy through the child&apos;s first 2 years.
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
                  <h3 className="text-xl font-bold text-foreground">Maternal &amp; Child Plan</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Per mother, per month</p>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">₹399</span>
                    <span className="text-muted-foreground/70">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    per mother &middot; billed monthly &middot; hospital volume discounts available
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
                  href="/register/payer"
                  className="mt-8 block w-full rounded-xl bg-primary px-6 py-3.5 text-center text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:bg-primary/90 hover:shadow-card hover:-translate-y-0.5"
                >
                  Start 7-Day Free Trial
                </Link>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground/70">
                  7-day free trial. No setup fees. Hospital B2B pricing from ₹200/patient/month.{' '}
                  <a href="mailto:hello@cocarely.com" className="font-medium text-primary underline decoration-primary/20 underline-offset-2 hover:decoration-primary/80">
                    Contact us for volume pricing
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
                Stories from families and doctors
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Peace of mind for families, better outcomes for hospitals
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
      <section className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">FAQ</p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Common questions about maternal &amp; child care
              </h2>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-12 max-w-2xl divide-y divide-border/60">
            {maternalFaqs.map((faq, index) => (
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
                  Every mother deserves a daily check-in.
                  <br />
                  <span className="font-light">Not just a monthly appointment.</span>
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-body-lg text-primary-foreground/70">
                  26 million pregnancies. 28,000 maternal deaths. 1 in 4 children under-vaccinated.
                  A single daily phone call can change these numbers — starting with the mothers you care about.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link
                    href="/register/payer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-[0.938rem] font-semibold text-primary shadow-soft transition-all duration-300 hover:bg-primary/5 hover:shadow-card hover:-translate-y-0.5"
                  >
                    Start Free Trial
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
                  {['7-day free trial', 'No setup fees', '₹399/mother/month'].map((badge) => (
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
