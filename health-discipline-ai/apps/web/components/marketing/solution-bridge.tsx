'use client';

import { ScrollReveal } from './ui/scroll-reveal';

const solutions = [
  {
    problem: 'You're always one crisis away from panic',
    solution: 'Real-time alerts notify you instantly',
    detail: 'If vitals spike, medicines are missed, or a call goes unanswered, you know within minutes — not hours.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
  {
    problem: 'They won't tell you the truth',
    solution: 'We hear what they don't say',
    detail: 'Our AI detects tone, mood changes, and unspoken concerns. You see the real picture, not just "I'm fine."',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
      </svg>
    ),
  },
  {
    problem: 'You can't be there when they need you most',
    solution: 'We're there every single day',
    detail: '365 days a year, an AI companion calls to check in, know their status, and alert you to changes — while you sleep.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

export function SolutionBridge() {
  return (
    <section className="section-padding bg-primary/2">
      <div className="section-container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
              How we solve it
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
              From worry to peace of mind
            </h2>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-14 max-w-4xl space-y-6">
          {solutions.map((item, index) => (
            <ScrollReveal key={item.problem} delay={index * 100}>
              <div className="rounded-2xl border border-primary/20 bg-white/50 backdrop-blur-sm p-6 sm:p-8">
                <div className="flex gap-4 sm:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
                      <p className="text-sm font-semibold text-muted-foreground">Problem:</p>
                      <p className="text-base font-semibold text-foreground">{item.problem}</p>
                    </div>
                    <div className="mt-3 border-l-2 border-primary/30 pl-4">
                      <p className="text-sm font-semibold text-primary">{item.solution}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
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
