'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CocarelyLogo } from '@/components/cocarely-logo';
import { useAudienceOptional, Audience } from './audience-context';

const audienceTabs: { key: Audience; label: string; shortLabel: string }[] = [
  { key: 'nri', label: 'NRI Families', shortLabel: 'NRI' },
  { key: 'hospital', label: 'Hospitals', shortLabel: 'Hospitals' },
  { key: 'chronic', label: 'Chronic Care', shortLabel: 'Chronic' },
  { key: 'maternal', label: 'Maternal & Child', shortLabel: 'Maternal' },
];

const fallbackLinks = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Try Demo', href: '/demo' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ctx = useAudienceOptional();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/70 shadow-soft backdrop-blur-xl border-b border-border/60'
          : 'bg-transparent'
      }`}
    >
      <div className="section-container flex h-16 items-center justify-between sm:h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <CocarelyLogo className="h-8 w-8" />
          <span className="text-base font-bold text-foreground">Cocarely</span>
        </Link>

        {/* Desktop center: audience pills OR fallback links */}
        {ctx ? (
          <div className="hidden lg:flex items-center justify-center flex-1 px-6">
            <div className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm p-1">
              {audienceTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => ctx.setAudience(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-[0.8125rem] font-medium transition-all duration-200 whitespace-nowrap ${
                    ctx.audience === tab.key
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="hidden items-center gap-8 lg:flex">
            {fallbackLinks.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        )}

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex shrink-0">
          {ctx && (
            <Link
              href="/demo"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Try Demo
            </Link>
          )}
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Sign In
          </Link>
          <Link href="/register/payer" className="btn-primary !py-2.5 !px-5 !text-sm">
            Start Free Trial
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          mobileOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="section-container border-t border-border/60 bg-card/95 py-4 backdrop-blur-xl">
          {ctx ? (
            <>
              {/* Audience pills as 2×2 grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {audienceTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      ctx.setAudience(tab.key);
                      setMobileOpen(false);
                    }}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 text-center ${
                      ctx.audience === tab.key
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {tab.shortLabel}
                  </button>
                ))}
              </div>
              <div className="border-t border-secondary pt-3 space-y-1">
                <Link
                  href="/demo"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
                >
                  Try Demo
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/register/payer"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary !text-sm mx-3 mt-2 block text-center"
                >
                  Start Free Trial
                </Link>
              </div>
            </>
          ) : (
            <div className="space-y-1">
              {fallbackLinks.map((link) =>
                link.href.startsWith('#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-secondary">
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  Sign In
                </Link>
                <Link href="/register/payer" className="btn-primary !text-sm mx-3">
                  Start Free Trial
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
