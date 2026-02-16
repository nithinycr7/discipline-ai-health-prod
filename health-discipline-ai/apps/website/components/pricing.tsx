'use client';

import { useState } from 'react';
import { ScrollReveal } from './ui/scroll-reveal';

const plans = [
  {
    name: 'Suraksha',
    nameHindi: 'सुरक्षा',
    subtitle: 'Essential Care',
    monthly: { priceUSD: 15, priceINR: 1350 },
    yearly: { priceUSD: 149, priceINR: 13400, saveUSD: 31, saveINR: 2800 },
    popular: false,
    features: [
      '1 call daily (7 days/week)',
      'Real-time missed routine alerts',
      'Up to 3 family members',
      'Daily WhatsApp reports with mood analysis',
      'Weekly health summaries',
      'Blood pressure & glucose tracking',
      'All 11 Indian languages',
    ],
  },
  {
    name: 'Sampurna',
    nameHindi: 'सम्पूर्ण',
    subtitle: 'Complete Care',
    monthly: { priceUSD: 20, priceINR: 1800 },
    yearly: { priceUSD: 199, priceINR: 17900, saveUSD: 41, saveINR: 3700 },
    popular: true,
    features: [
      '2 calls daily (7 days/week)',
      'Real-time missed routine alerts',
      'Human verification on missed routines',
      'Priority outreach & escalation to local contact',
      'Unlimited family members',
      'Daily WhatsApp reports with mood & sentiment',
      'Weekly deep wellness check-in',
      'Doctor-ready health reports',
      'Adherence streak tracking',
    ],
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="section-padding">
      <div className="section-container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">
              Pricing
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-gray-900">
              Less than a cup of chai per day
            </h2>
            <p className="mt-4 text-body-lg text-gray-500">
              Start with a free 7-day trial. No credit card required.
              Cancel anytime with a WhatsApp message.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-warm-200 bg-warm-50 p-1.5">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  !isYearly
                    ? 'bg-white text-gray-900 shadow-soft'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  isYearly
                    ? 'bg-white text-gray-900 shadow-soft'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Yearly
                <span className="ml-1.5 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.name} delay={index * 150}>
              <div
                className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'border-brand-500 bg-white shadow-elevated scale-[1.02]'
                    : 'border-warm-200 bg-white shadow-soft hover:shadow-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0">
                    <div className="rounded-bl-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <span className="text-sm text-gray-400 font-medium">{plan.nameHindi}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{plan.subtitle}</p>
                </div>

                <div className="mt-6">
                  {isYearly ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ${plan.yearly.priceUSD}
                        </span>
                        <span className="text-gray-400">/year</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        ${Math.round(plan.yearly.priceUSD / 12)}/month &middot; ₹{plan.yearly.priceINR.toLocaleString('en-IN')}/year
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-green-600">
                        Save ${plan.yearly.saveUSD}/year
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ${plan.monthly.priceUSD}
                        </span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        ₹{plan.monthly.priceINR.toLocaleString('en-IN')}/month
                      </p>
                    </>
                  )}
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-brand-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12.75 11.25 15 15 9.75"
                        />
                        <circle cx="12" cy="12" r="9.75" strokeWidth={1.5} />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={`mt-8 block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-brand-600 text-white shadow-soft hover:bg-brand-500 hover:shadow-card hover:-translate-y-0.5'
                      : 'border border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:shadow-card hover:-translate-y-0.5'
                  }`}
                >
                  Start 7-Day Free Trial
                </a>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="mx-auto mt-10 max-w-lg text-center">
            <p className="text-sm text-gray-400">
              Both plans include a 7-day free trial. No credit card needed to start.
              Pay via Stripe (USD/GBP) or Razorpay (UPI/cards).
              For hospitals and bulk pricing,{' '}
              <a
                href="/hospitals"
                className="font-medium text-brand-600 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-500"
              >
                see our B2B plans
              </a>
              .
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
