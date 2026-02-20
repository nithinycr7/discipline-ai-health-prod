'use client';

import Link from 'next/link';
import { ScrollReveal } from './ui/scroll-reveal';

export function CTASection() {
  return (
    <section className="section-padding">
      <div className="section-container">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
              <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
            </div>

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-heading sm:text-display-sm text-white">
                Stop wondering.
                <br />
                Start knowing.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-body-lg text-primary-foreground/70">
                7-day free trial. No credit card. No app needed. Your parents
                just answer the phone &mdash; you get a daily picture of how
                they&apos;re really doing.
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
                <Link
                  href="/hospitals"
                  className="inline-flex items-center justify-center gap-2 rounded-xl glass-dark px-8 py-4 text-[0.938rem] font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/15"
                >
                  For Hospitals
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6 text-sm text-primary-foreground/70">
                <span className="flex items-center gap-1.5 glass-dark rounded-full px-3 py-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  7-day free trial
                </span>
                <span className="flex items-center gap-1.5 glass-dark rounded-full px-3 py-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Cancel anytime
                </span>
                <span className="flex items-center gap-1.5 glass-dark rounded-full px-3 py-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  No card required
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
