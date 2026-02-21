'use client';

import { ScrollReveal } from './ui/scroll-reveal';

export function Problem() {
  return (
    <section className="relative section-padding overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/50 to-background" />

      <div className="section-container">
        <div className="mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
              The daily worry
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h2 className="mt-4 font-serif text-heading sm:text-display-sm text-foreground italic">
              &ldquo;Are they <span className="font-bold not-italic">really</span> okay?&rdquo;
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="mt-6 text-body-lg text-muted-foreground leading-relaxed">
              You call them every day. They always say &ldquo;I&apos;m fine.&rdquo;{' '}
              <span className="font-medium text-foreground/90">But are they really okay?</span>
            </p>
          </ScrollReveal>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              ),
              title: "You're always one crisis away from panic",
              description: "When the phone rings at 3 AM, your heart stops. You're terrified of missing the moment something actually goes wrong — and being powerless from 8,000 miles away.",
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                </svg>
              ),
              title: "They won't tell you the truth",
              description: "They skip medicines, hide their mood, lie about their BP. They don't want to burden you. So you only find out when something breaks.",
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              ),
              title: "You can't be there when they need you most",
              description: "Missing birthdays and anniversaries is one thing. Missing a health crisis? That's the guilt that keeps you up at night. They're alone, and you're powerless.",
            },
          ].map((card, index) => (
            <ScrollReveal key={card.title} delay={index * 100}>
              <div className="marketing-card group h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-light text-gold-dark transition-colors group-hover:bg-gold group-hover:text-white">
                  {card.icon}
                </div>
                <h3 className="mt-4 text-heading-sm text-foreground">{card.title}</h3>
                <p className="mt-2 text-body text-muted-foreground">{card.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={300}>
          <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <p className="text-body-lg text-primary font-medium leading-relaxed">
              What if your parents were monitored daily by someone who cares about their health, speaks their language, and sends you the truth — so you can finally sleep at night?
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
