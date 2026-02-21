'use client';

import Link from 'next/link';
import { DemoConversation } from '@/components/marketing/demo-conversation';
import { CoCareLogo } from '@/components/cocare-logo';

export default function DemoPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-secondary/50" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] sm:h-[600px] sm:w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[250px] w-[250px] sm:h-[500px] sm:w-[500px] translate-y-1/4 -translate-x-1/4 rounded-full bg-gold-light/30 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <CoCareLogo className="h-8 w-8" />
          <span className="text-base font-bold text-foreground">CoCare</span>
        </Link>

        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <DemoConversation />
        </div>
      </main>

      {/* Trust footer */}
      <footer className="relative z-10 py-6 px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-muted-foreground/70">
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            Audio not recorded
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
            Microphone required
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            Free, no sign-up needed
          </span>
        </div>
      </footer>
    </div>
  );
}
