'use client';

import Image from 'next/image';
import { APP_URL } from '@/lib/constants';

const stats = [
  { value: '200+', label: 'Families trust us' },
  { value: '11', label: 'Indian languages' },
  { value: '95%', label: 'Call answer rate' },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/40 via-transparent to-transparent" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-brand-100/30 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[200px] w-[200px] sm:h-[400px] sm:w-[400px] translate-y-1/4 -translate-x-1/4 rounded-full bg-accent-light/40 blur-3xl" />
      </div>

      <div className="section-container">
        <div className="mx-auto max-w-4xl text-center">
          {/* Trust badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-200/40 bg-brand-50/60 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-brand-600 animate-fade-in">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-slow" />
            Trusted by 200+ families across India
          </div>

          {/* Headline */}
          <h1 className="text-display-sm sm:text-display text-gray-900 animate-fade-up">
            Know how your parents{' '}
            <span className="text-gradient">are really doing</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-gray-600 animate-fade-up animate-delay-100">
            A warm AI companion calls your parents daily in their language,
            checks on their wellbeing, medicines, and mood &mdash; then sends
            you a clear picture of how they&apos;re actually doing.{' '}
            <span className="font-medium text-gray-800">No app needed.</span>
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up animate-delay-200">
            <a href={`${APP_URL}/register/payer`} className="btn-primary">
              Start 7-Day Free Trial
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <a href="/demo" className="btn-secondary">
              Try a Live Demo
            </a>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto mt-16 max-w-3xl animate-fade-up animate-delay-300">
            <div className="relative overflow-hidden rounded-2xl border border-warm-200/80 bg-white shadow-elevated">
              <Image
                src="/images/hero-dashboard.png"
                alt="Health Discipline AI dashboard showing daily wellness tracking"
                width={1200}
                height={675}
                className="w-full"
                priority
              />
            </div>

            {/* Floating WhatsApp card */}
            <div className="absolute -bottom-6 -left-2 sm:-left-8 w-56 sm:w-72 rounded-xl glass shadow-card animate-fade-up animate-delay-400 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">Daily Report</p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                    Amma took all 3 medicines today. BP: 130/82. Mood: cheerful and talkative.
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">Just now</p>
                </div>
              </div>
            </div>

            {/* Floating language card */}
            <div className="absolute -top-4 -right-4 sm:-right-8 rounded-xl glass shadow-card animate-fade-up animate-delay-500 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Speaking in</p>
              <div className="flex items-center gap-1.5">
                {['हिं', 'తె', 'த', 'ಕ', 'বা'].map((lang, i) => (
                  <span
                    key={i}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600"
                  >
                    {lang}
                  </span>
                ))}
                <span className="text-xs text-gray-400 ml-0.5">+6</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-auto mt-20 flex max-w-lg flex-col items-center gap-8 sm:max-w-none sm:flex-row sm:justify-center sm:gap-16 animate-fade-up animate-delay-600">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-brand-600 sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
