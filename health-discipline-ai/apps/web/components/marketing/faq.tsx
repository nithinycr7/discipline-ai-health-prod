'use client';

import { useState } from 'react';
import { ScrollReveal } from './ui/scroll-reveal';

const faqs = [
  {
    question: 'My parents won\'t talk to a robot.',
    answer: 'Our AI voice sounds natural and warm — many parents think they\'re talking to a real person. It greets them by name, speaks their language, asks about their day, and checks on their health. Most parents enjoy the daily calls within the first week.',
  },
  {
    question: 'Do my parents need a smartphone?',
    answer: 'No. The call works on any phone — basic feature phone, landline, or smartphone. Your parents simply answer the phone and talk naturally. Zero tech skills needed.',
  },
  {
    question: 'What languages are supported?',
    answer: 'We support 11 Indian languages: Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Odia, and English. The AI uses culturally appropriate greetings, medicine nicknames, and local expressions.',
  },
  {
    question: 'What if my parent doesn\'t answer the call?',
    answer: 'You\'ll get an immediate alert on WhatsApp. The system can also retry the call after a configurable interval. We track answer patterns and recommend optimal call times.',
  },
  {
    question: 'Is my parents\' health data safe?',
    answer: 'Absolutely. We\'re compliant with India\'s DPDP Act. Health data is encrypted, access-controlled, and never shared with third parties. Only authorized family members can view reports.',
  },
  {
    question: 'Can the AI give medical advice?',
    answer: 'No. Health Discipline AI is a wellness companion that checks in and reports — it never provides medical advice, suggests medicines, or changes dosages. For any health concerns, it directs patients to their doctor.',
  },
  {
    question: 'How do I cancel?',
    answer: 'Send a simple WhatsApp message. No phone calls, no retention tricks, no fine print. We also offer a full 7-day free trial with no credit card required.',
  },
  {
    question: 'I live abroad. Can I pay in USD?',
    answer: 'Yes. We accept payments via Stripe (USD, GBP, EUR) for international users and Razorpay (UPI, cards) for users in India. Plans start at $15/month.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding">
      <div className="section-container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
              FAQ
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
              Common questions
            </h2>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-12 max-w-2xl divide-y divide-border/60">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 50}>
              <div className="py-5">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-start justify-between gap-4 text-left"
                >
                  <span className="text-base font-semibold text-foreground sm:text-lg">
                    {faq.question}
                  </span>
                  <span className="mt-1 shrink-0">
                    <svg
                      className={`h-5 w-5 text-muted-foreground/70 transition-transform duration-300 ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    openIndex === index
                      ? 'grid-rows-[1fr] opacity-100 mt-3'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-body text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
