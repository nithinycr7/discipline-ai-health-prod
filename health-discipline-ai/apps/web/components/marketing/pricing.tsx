'use client';

import { useState } from 'react';
import Link from 'next/link';
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
      '1 daily wellness check-in call',
      'Real-time alerts if something seems off',
      'Up to 3 family members',
      'Daily WhatsApp wellness reports',
      'Weekly health & mood summaries',
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
      '2 daily wellness check-in calls',
      'Real-time alerts if something seems off',
      'Human follow-up on missed check-ins',
      'Priority outreach & escalation to local contact',
      'Unlimited family members',
      'Daily WhatsApp reports with mood & sentiment',
      'Weekly deep wellness review',
      'Doctor-ready health reports',
      'Wellness streak tracking',
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
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
              Pricing
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
              Less than a cup of coffee per day
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              Start with a free 7-day trial. No credit card required.
              Cancel anytime with a WhatsApp message.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm p-1.5">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  !isYearly
                    ? 'bg-card text-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground/80'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  isYearly
                    ? 'bg-card text-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground/80'
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
                    ? 'border-primary/40 bg-card/80 backdrop-blur-md shadow-elevated scale-[1.02]'
                    : 'border-border/60 bg-card/70 backdrop-blur-sm shadow-soft hover:shadow-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0">
                    <div className="rounded-bl-xl bg-primary px-4 py-1.5 text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <span className="text-sm text-muted-foreground/70 font-medium">{plan.nameHindi}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>
                </div>

                <div className="mt-6">
                  {isYearly ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-foreground">
                          ${plan.yearly.priceUSD}
                        </span>
                        <span className="text-muted-foreground/70">/year</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        ${Math.round(plan.yearly.priceUSD / 12)}/month &middot; ₹{plan.yearly.priceINR.toLocaleString('en-IN')}/year
                      </p>
                      <p className="mt-1.5 text-sm font-medium text-green-600">
                        Save ${plan.yearly.saveUSD}/year
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-foreground">
                          ${plan.monthly.priceUSD}
                        </span>
                        <span className="text-muted-foreground/70">/month</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        ₹{plan.monthly.priceINR.toLocaleString('en-IN')}/month
                      </p>
                    </>
                  )}
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="mt-0.5 h-5 w-5 shrink-0 text-primary/80"
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
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register/payer"
                  className={`mt-8 block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-primary text-white shadow-soft hover:bg-primary/90 hover:shadow-card hover:-translate-y-0.5'
                      : 'border border-border bg-card text-foreground/90 hover:border-border/80 hover:shadow-card hover:-translate-y-0.5'
                  }`}
                >
                  Start 7-Day Free Trial
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="mx-auto mt-10 max-w-lg text-center">
            <p className="text-sm text-muted-foreground/70">
              Both plans include a 7-day free trial. No credit card needed to start.
              Pay via Stripe (USD/GBP) or Razorpay (UPI/cards).
              For hospitals and bulk pricing,{' '}
              <Link
                href="/hospitals"
                className="font-medium text-primary underline decoration-primary/20 underline-offset-2 hover:decoration-primary/80"
              >
                see our B2B plans
              </Link>
              .
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
