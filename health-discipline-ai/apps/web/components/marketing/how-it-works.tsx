'use client';

import Image from 'next/image';
import { ScrollReveal } from './ui/scroll-reveal';

const steps = [
  {
    number: '01',
    title: 'Add your parent',
    description:
      'Enter their name, medicines, preferred language, and when they should be called. Takes 2 minutes.',
    image: '/images/step-add-parent.png',
    accent: 'bg-primary/5 text-primary',
  },
  {
    number: '02',
    title: 'AI calls daily',
    description:
      'A warm, natural voice calls at the scheduled time — greets them by name, asks about their wellbeing, checks on medicines and vitals.',
    image: '/images/step-ai-calls.png',
    accent: 'bg-gold-light text-gold-dark',
  },
  {
    number: '03',
    title: 'Get real reports',
    description:
      'Within 5 minutes, receive a detailed WhatsApp report — medicines, vitals, mood, and how they\'re really doing. Facts, not guesses.',
    image: '/images/step-get-reports.png',
    accent: 'bg-primary/5 text-primary',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding">
      <div className="section-container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
              How it works
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
              Simple as a phone call
            </h2>
            <p className="mt-4 text-body-lg text-muted-foreground">
              No downloads. No tech skills. Your parents just answer the phone.
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-16 max-w-5xl space-y-8 lg:space-y-0">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 150}>
              <div
                className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-16 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                } ${index > 0 ? 'mt-8 lg:mt-0' : ''}`}
              >
                <div className="flex-1 text-center lg:text-left">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${step.accent}`}
                  >
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-heading-sm sm:text-heading text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-body-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
                    {step.description}
                  </p>
                </div>

                <div className="flex-1">
                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={560}
                      height={400}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-auto my-4 hidden h-16 w-px bg-gradient-to-b from-border to-transparent lg:block" />
              )}
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
