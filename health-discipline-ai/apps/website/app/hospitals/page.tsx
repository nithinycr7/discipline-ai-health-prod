'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { APP_URL } from '@/lib/constants';

const stats = [
  { value: '50%', label: 'of discharged patients miss medicines in the first week' },
  { value: '₹100+', label: 'cost per manual follow-up nurse call' },
  { value: '30%', label: 'hospital readmissions linked to non-adherence' },
];

const tiers = [
  {
    name: 'Starter',
    patients: 'Up to 100 patients',
    price: '₹200',
    unit: 'per patient/month',
    features: [
      'Daily AI wellness calls in 11 languages',
      'Medicine-by-medicine adherence tracking',
      'WhatsApp reports to family',
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

const benefits = [
  {
    title: 'Cut follow-up costs by 99%',
    description: 'Replace ₹100+ manual nurse calls with ₹2 AI calls that scale infinitely.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    title: 'Reduce readmissions',
    description: 'Proactive daily wellness check-ins catch non-adherence and declining health before complications.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: 'Structured adherence data',
    description: 'Medicine-by-medicine tracking, not vague nurse notes. Export-ready for clinical audits.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    title: 'Scale without hiring',
    description: 'Same infrastructure handles 50 or 5,000 patients. No additional staff needed.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
    ),
  },
  {
    title: '11 Indian languages',
    description: 'Serve diverse patient populations without multilingual staff. Culturally adapted conversations.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
  },
  {
    title: 'DPDP Act compliant',
    description: 'Patient data encrypted, access-controlled, and handled per India\'s data protection regulations.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
];

export default function HospitalsPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50/40 via-transparent to-transparent" />
          </div>

          <div className="section-container">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-600">
                For Hospitals & Clinics
              </div>

              <h1 className="text-display-sm sm:text-display text-gray-900">
                Post-discharge wellness monitoring,{' '}
                <span className="text-gradient">automated</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-body-lg text-gray-600">
                Replace expensive manual nurse follow-ups with AI wellness calls that
                monitor adherence, vitals, and patient wellbeing in 11 Indian languages
                &mdash; at a fraction of the cost.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a href={`${APP_URL}/register/hospital`} className="btn-primary">
                  Request a Pilot
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
                <a href="#" className="btn-secondary">
                  Download Brochure
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-warm-200/60 bg-warm-100/30 py-12">
          <div className="section-container">
            <div className="grid gap-8 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-extrabold text-brand-600 sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-gray-500 max-w-[200px] mx-auto">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="section-padding">
          <div className="section-container">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">
                  Why hospitals choose us
                </p>
                <h2 className="mt-4 text-heading sm:text-display-sm text-gray-900">
                  Better outcomes. Lower costs.
                </h2>
              </div>
            </ScrollReveal>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit, index) => (
                <ScrollReveal key={benefit.title} delay={index * 80}>
                  <div className="card group h-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      {benefit.icon}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {benefit.title}
                    </h3>
                    <p className="mt-2 text-body text-gray-500">
                      {benefit.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Calculator visual */}
        <section className="section-padding relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-warm-100/50" />
          <div className="section-container">
            <ScrollReveal>
              <div className="mx-auto max-w-3xl">
                <div className="text-center">
                  <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">
                    The math
                  </p>
                  <h2 className="mt-4 text-heading sm:text-display-sm text-gray-900">
                    The ROI speaks for itself
                  </h2>
                </div>

                <div className="mt-12 overflow-hidden rounded-2xl border border-warm-200/60 bg-white shadow-card">
                  <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 divide-warm-200/60">
                    {/* Manual */}
                    <div className="p-8">
                      <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                        Manual Nurse Calls
                      </p>
                      <p className="mt-4 text-4xl font-extrabold text-gray-900">
                        ₹100+
                      </p>
                      <p className="mt-1 text-sm text-gray-400">per call</p>
                      <ul className="mt-6 space-y-2 text-sm text-gray-500">
                        <li className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          Doesn&apos;t scale
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          Unstructured notes
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          Limited languages
                        </li>
                      </ul>
                    </div>

                    {/* AI */}
                    <div className="relative p-8">
                      <div className="absolute right-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wide">
                        99% cheaper
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">
                        Health Discipline AI
                      </p>
                      <p className="mt-4 text-4xl font-extrabold text-brand-600">
                        ~₹2
                      </p>
                      <p className="mt-1 text-sm text-gray-400">per call</p>
                      <ul className="mt-6 space-y-2 text-sm text-gray-500">
                        <li className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Infinitely scalable
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Structured data
                        </li>
                        <li className="flex items-center gap-2">
                          <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          11 Indian languages
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Pricing */}
        <section className="section-padding">
          <div className="section-container">
            <ScrollReveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">
                  Hospital Pricing
                </p>
                <h2 className="mt-4 text-heading sm:text-display-sm text-gray-900">
                  Transparent volume pricing
                </h2>
                <p className="mt-4 text-body-lg text-gray-500">
                  Start with a 30-day pilot. No setup fees.
                </p>
              </div>
            </ScrollReveal>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
              {tiers.map((tier, index) => (
                <ScrollReveal key={tier.name} delay={index * 150}>
                  <div
                    className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 ${
                      tier.popular
                        ? 'border-brand-500 bg-white shadow-elevated'
                        : 'border-warm-200 bg-white shadow-soft hover:shadow-card'
                    }`}
                  >
                    {tier.popular && (
                      <div className="absolute right-0 top-0">
                        <div className="rounded-bl-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white">
                          Recommended
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{tier.patients}</p>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">
                          {tier.price}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{tier.unit}</p>
                    </div>

                    <ul className="mt-8 flex-1 space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={tier.price === 'Custom' ? `mailto:hello@healthdiscipline.ai` : `${APP_URL}/register/hospital`}
                      className={`mt-8 block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
                        tier.popular
                          ? 'bg-brand-600 text-white hover:bg-brand-500 hover:-translate-y-0.5'
                          : 'border border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:-translate-y-0.5'
                      }`}
                    >
                      {tier.price === 'Custom' ? 'Contact Sales' : 'Start 30-Day Pilot'}
                    </a>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding">
          <div className="section-container">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-3xl bg-brand-600 px-8 py-16 sm:px-16 sm:py-20 text-center">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
                  <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
                </div>
                <div className="relative">
                  <h2 className="text-heading sm:text-display-sm text-white">
                    Ready to transform patient follow-up?
                  </h2>
                  <p className="mx-auto mt-5 max-w-lg text-body-lg text-brand-200">
                    Start a 30-day pilot with up to 50 patients. See the difference
                    in adherence rates, costs, and patient satisfaction.
                  </p>
                  <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <a
                      href={`${APP_URL}/register/hospital`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-[0.938rem] font-semibold text-brand-600 shadow-soft transition-all duration-300 hover:bg-brand-50 hover:-translate-y-0.5"
                    >
                      Request a Pilot
                    </a>
                    <a
                      href="mailto:hello@healthdiscipline.ai"
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
      </main>
      <Footer />
    </>
  );
}
