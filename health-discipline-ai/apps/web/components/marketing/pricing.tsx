'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ScrollReveal } from './ui/scroll-reveal';

const plans = [
  {
    name: 'Echo Basic',
    nameHindi: 'सुरक्षा',
    subtitle: 'Essential Monitoring',
    monthly: { priceUSD: 17, priceINR: 1499 },
    yearly: { priceUSD: 199, priceINR: 16900, saveUSD: 5, saveINR: 900 },
    popular: false,
    features: [
      '1 monthly AI wellness call',
      'Medication reminder alerts',
      'Family dashboard access',
      'Quarterly health report',
      '24/7 emergency contact chain',
      'Up to 5 family members',
      'All 11 Indian languages',
    ],
  },
  {
    name: 'Echo Care',
    nameHindi: 'सम्पूर्ण',
    subtitle: 'Complete Care',
    monthly: { priceUSD: 30, priceINR: 2699 },
    yearly: { priceUSD: 349, priceINR: 29900, saveUSD: 11, saveINR: 1300 },
    popular: true,
    features: [
      '1 weekly AI wellness call',
      'Daily medication reminders',
      'Vitals tracking (BP, glucose)',
      'Bi-weekly health summary',
      'Real-time alerts to family',
      '1 quarterly doctor video consult*',
      'Unlimited family members',
      'WhatsApp health reports',
    ],
  },
  {
    name: 'Echo Guardian',
    nameHindi: 'रक्षक',
    subtitle: 'Premium Care',
    monthly: { priceUSD: 50, priceINR: 4499 },
    yearly: { priceUSD: 599, priceINR: 50900, saveUSD: 1, saveINR: 4900 },
    popular: false,
    features: [
      'Daily AI check-in calls',
      'Advanced vitals tracking (BP, glucose, SpO2)',
      'Real-time anomaly detection',
      '1 monthly doctor tele-visit*',
      'Full care coordination',
      'Emergency dispatch support',
      'Dedicated care manager',
      'Priority support 24/7',
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
              Less than what you'd spend on one flight home
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              <strong className="text-foreground/90">Echo Care:</strong> $349/year = $29/month = $0.95 per day
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a free 7-day trial. No credit card required. Cancel anytime with a WhatsApp message.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm p-1.5">
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

            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                7-day free trial
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                No card needed
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Cancel anytime
              </span>
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
              All plans include a 7-day free trial. No credit card needed to start.
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
            <p className="mt-3 text-xs text-muted-foreground/60">
              *Doctor consultations are for health coordination & monitoring review. Your family manages their own primary care relationships.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
