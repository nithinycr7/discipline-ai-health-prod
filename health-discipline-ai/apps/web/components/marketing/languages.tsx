'use client';

import { ScrollReveal } from './ui/scroll-reveal';

const languages = [
  { name: 'Hindi', script: 'हिन्दी', greeting: 'नमस्ते' },
  { name: 'Telugu', script: 'తెలుగు', greeting: 'నమస్కారం' },
  { name: 'Tamil', script: 'தமிழ்', greeting: 'வணக்கம்' },
  { name: 'Kannada', script: 'ಕನ್ನಡ', greeting: 'ನಮಸ್ಕಾರ' },
  { name: 'Bengali', script: 'বাংলা', greeting: 'নমস্কার' },
  { name: 'Marathi', script: 'मराठी', greeting: 'नमस्कार' },
  { name: 'Gujarati', script: 'ગુજરાતી', greeting: 'નમસ્તે' },
  { name: 'Malayalam', script: 'മലയാളം', greeting: 'നമസ്കാരം' },
  { name: 'Punjabi', script: 'ਪੰਜਾਬੀ', greeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ' },
  { name: 'Odia', script: 'ଓଡ଼ିଆ', greeting: 'ନମସ୍କାର' },
  { name: 'English', script: 'English', greeting: 'Hello' },
];

export function Languages() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-primary" />
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </div>

      <div className="section-container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/70">
              Languages
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-white">
              We speak their language
            </h2>
            <p className="mt-4 text-body-lg text-primary-foreground/70">
              Not just translation — culturally adapted conversations with
              medicine nicknames, local expressions, and natural warmth.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-3">
          {languages.map((lang, index) => (
            <ScrollReveal key={lang.name} delay={index * 50}>
              <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:bg-white/10">
                <p className="text-lg font-bold text-white">{lang.script}</p>
                <p className="mt-0.5 text-sm text-primary-foreground/70">{lang.name}</p>
                <p className="mt-1 text-xs text-primary-foreground/50 italic">
                  &ldquo;{lang.greeting}&rdquo;
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <p className="mt-10 text-center text-sm text-primary-foreground/50">
            Your parent hears &ldquo;BP wali goli li?&rdquo; not
            &ldquo;Have you taken your Amlodipine?&rdquo;
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
