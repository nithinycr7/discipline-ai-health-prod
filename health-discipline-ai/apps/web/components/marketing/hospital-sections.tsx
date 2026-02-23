'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from './ui/scroll-reveal';

/* ───────────────────────── DATA ───────────────────────── */

const stats = [
  { value: '41%', label: 'of hospital readmissions are avoidable with proper follow-up' },
  { value: '₹100+', label: 'cost per manual nurse follow-up call' },
  { value: '43%', label: 'average medication adherence rate in India' },
];

const benefits = [
  {
    title: 'Cut follow-up costs by 93%',
    description: 'Replace ₹100+ manual nurse calls with ~₹7 AI calls that scale to thousands of patients without additional staff.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    title: 'Reduce avoidable readmissions',
    description: 'Daily wellness check-ins catch non-adherence and declining health before complications. 41% of geriatric readmissions are preventable.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: 'Structured adherence data',
    description: 'Medicine-by-medicine tracking with structured reports — not vague nurse notes. Export-ready for clinical audits and NABH compliance.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    title: 'Scale without hiring',
    description: 'Same infrastructure handles 50 or 5,000 patients. No additional nursing staff, no call center overhead, no training costs.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
  },
  {
    title: '11 Indian languages',
    description: 'Serve diverse patient populations without multilingual staff. Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, and more.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: 'DPDP Act compliant',
    description: 'Patient data encrypted, access-controlled, and handled per India\'s Digital Personal Data Protection Act. Consent-first collection.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
];

const tiers = [
  {
    name: 'Starter',
    patients: 'Up to 100 patients',
    price: '₹200',
    unit: 'per patient/month',
    popular: false,
    features: [
      'Daily AI wellness calls in 11 languages',
      'Medicine-by-medicine adherence tracking',
      'WhatsApp reports to patient families',
      'Basic analytics dashboard',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    patients: '100 – 500 patients',
    price: '₹150',
    unit: 'per patient/month',
    popular: true,
    features: [
      'Everything in Starter',
      'Bulk patient CSV upload',
      'Doctor-branded reports',
      'Advanced analytics & trends',
      'Priority support',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Enterprise',
    patients: '500+ patients',
    price: 'Custom',
    unit: 'volume pricing',
    popular: false,
    features: [
      'Everything in Growth',
      'White-label solution',
      'Custom integrations (EHR/HMS)',
      'On-premise option available',
      'SLA guarantees',
      '24/7 dedicated support',
    ],
  },
];

const hospitalFaqs = [
  {
    question: 'How does integration with our HMS/EHR work?',
    answer: 'We provide REST APIs to import discharge data and patient details from your Hospital Management System. For pilots, no integration is required — you can upload patients via CSV or the dashboard. Full EHR integration is available in our Enterprise plan.',
  },
  {
    question: 'Can we start a pilot without IT integration?',
    answer: 'Yes. Upload a CSV of patients with their name, phone, language, and medicines. The AI begins calling within hours. Zero IT involvement required for the pilot phase.',
  },
  {
    question: 'How is patient data secured?',
    answer: 'End-to-end encryption, role-based access controls, and consent-first data collection. Fully compliant with India\'s DPDP Act. Data is hosted on India-based infrastructure. We can sign a Business Associate Agreement (BAA).',
  },
  {
    question: 'What happens if a patient doesn\'t answer?',
    answer: 'The system retries at a configurable interval (default: 2 hours later). If still unanswered, an alert is sent to the designated family member and your care coordinator via WhatsApp. We track answer patterns and recommend optimal call times.',
  },
  {
    question: 'Do we get structured reports or just call summaries?',
    answer: 'Structured data. Every call generates medicine-by-medicine adherence tracking, vitals readings, mood assessment, and complaint detection. Data is available via dashboard, API, and downloadable CSV/PDF reports for clinical audits.',
  },
  {
    question: 'How quickly can we go live?',
    answer: 'Same day for basic pilots. Upload your patient list, configure call schedules, and the AI begins calling. Full integration pilots with HMS connectivity typically take 1-2 weeks.',
  },
];

/* ───────────────────────── COMPONENT ───────────────────────── */

export function HospitalSections() {
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute right-0 top-0 h-[300px] w-[300px] sm:h-[500px] sm:w-[500px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
              For Hospitals &amp; Clinics
            </div>

            <h1 className="text-display-sm sm:text-display text-foreground animate-fade-up">
              Post-discharge wellness monitoring,{' '}
              <span className="text-gradient">automated</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground animate-fade-up animate-delay-100">
              Replace expensive manual nurse follow-ups with AI wellness calls that
              monitor adherence, vitals, and patient wellbeing in 11 Indian languages
              — at a fraction of the cost. 41% of hospital readmissions are avoidable.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up animate-delay-200">
              <Link href="/register/hospital" className="btn-primary">
                Request a 30-Day Pilot
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

      {/* ── Benefits ── */}
      <section className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                Why hospitals choose us
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Better outcomes. Lower costs.
              </h2>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <ScrollReveal key={benefit.title} delay={index * 80}>
                <div className="marketing-card group h-full">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {benefit.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{benefit.title}</h3>
                  <p className="mt-2 text-muted-foreground">{benefit.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI Calculator ── */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-secondary/50" />
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                  The math
                </p>
                <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                  The ROI speaks for itself
                </h2>
              </div>

              <div className="mt-12 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
                <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 divide-border/60">
                  {/* Manual */}
                  <div className="p-8">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/70">
                      Manual Nurse Calls
                    </p>
                    <p className="mt-4 text-4xl font-extrabold text-foreground">₹100+</p>
                    <p className="mt-1 text-sm text-muted-foreground/70">per call</p>
                    <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                      {['Doesn\'t scale', 'Unstructured notes', 'Limited languages'].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI */}
                  <div className="relative p-8">
                    <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground uppercase tracking-wide">
                      93% cheaper
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary/80">
                      Cocarely AI
                    </p>
                    <p className="mt-4 text-4xl font-extrabold text-primary">~₹7</p>
                    <p className="mt-1 text-sm text-muted-foreground/70">per call</p>
                    <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                      {['Infinitely scalable', 'Structured data', '11 Indian languages'].map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-primary/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="section-padding">
        <div className="section-container">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
                Hospital Pricing
              </p>
              <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
                Transparent volume pricing
              </h2>
              <p className="mt-4 text-body-lg text-muted-foreground">
                Start with a 30-day pilot. No setup fees. No long-term commitments.
              </p>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
            {tiers.map((tier, index) => (
              <ScrollReveal key={tier.name} delay={index * 150}>
                <div
                  className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                    tier.popular
                      ? 'border-primary bg-card shadow-elevated'
                      : 'border-border/60 bg-card shadow-soft hover:shadow-card'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute right-0 top-0">
                      <div className="rounded-bl-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                        Recommended
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tier.patients}</p>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{tier.price}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground/70">{tier.unit}</p>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.price === 'Custom' ? 'mailto:hello@cocarely.com' : '/register/hospital'}
                    className={`mt-8 block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
                      tier.popular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5'
                        : 'border border-border bg-card text-foreground/90 hover:border-border/80 hover:-translate-y-0.5'
                    }`}
                  >
                    {tier.price === 'Custom' ? 'Contact Sales' : 'Start 30-Day Pilot'}
                  </Link>
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
                Questions from hospital administrators
              </h2>
            </div>
          </ScrollReveal>

          <div className="mx-auto mt-12 max-w-2xl divide-y divide-border/60">
            {hospitalFaqs.map((faq, index) => (
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
                  Ready to transform patient follow-up?
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-body-lg text-primary-foreground/70">
                  Start a 30-day pilot with up to 50 patients. See the difference
                  in adherence rates, costs, and patient satisfaction — risk-free.
                </p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link
                    href="/register/hospital"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-[0.938rem] font-semibold text-primary shadow-soft transition-all duration-300 hover:bg-primary/5 hover:-translate-y-0.5"
                  >
                    Request a Pilot
                  </Link>
                  <a
                    href="mailto:hello@cocarely.com"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-[0.938rem] font-semibold text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10"
                  >
                    Schedule a Demo
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
