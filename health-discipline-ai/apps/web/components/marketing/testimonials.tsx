'use client';

import Image from 'next/image';
import { ScrollReveal } from './ui/scroll-reveal';

const testimonials = [
  {
    quote: 'I used to call Amma every morning from San Jose and ask "Sab theek hai?" She always said yes. Now I get real reports — her mood, her medicines, her BP — and I finally know how she\'s actually doing.',
    name: 'Priya Ramesh',
    location: 'San Jose, USA',
    role: 'Daughter, caring for mother in Chennai',
    avatar: '/images/testimonial-priya.png',
  },
  {
    quote: 'Papa was skeptical at first. After the third call, he told me "woh ladki bahut achhi hai, roz phone karti hai." He thinks it\'s a real person. That\'s when I knew this works.',
    name: 'Rahul Sharma',
    location: 'London, UK',
    role: 'Son, caring for father in Lucknow',
    avatar: '/images/testimonial-rahul.png',
  },
  {
    quote: 'As a cardiologist, knowing how my elderly patients are doing between visits is my biggest challenge. This gives me daily wellness data — medicines, vitals, mood — and my patients actually enjoy the calls.',
    name: 'Dr. Anitha Venkatesh',
    location: 'Bangalore, India',
    role: 'Cardiologist, 15+ years practice',
    avatar: '/images/testimonial-doctor.png',
  },
];

export function Testimonials() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-secondary/50" />

      <div className="section-container">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary/80">
              Stories
            </p>
            <h2 className="mt-4 text-heading sm:text-display-sm text-foreground">
              Peace of mind, delivered daily
            </h2>
          </div>
        </ScrollReveal>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {testimonials.map((t, index) => (
            <ScrollReveal key={t.name} delay={index * 150}>
              <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-7 shadow-soft">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-4 w-4 text-gold"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <blockquote className="mt-4 flex-1 text-body text-muted-foreground leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                <div className="mt-6 flex items-center gap-3 border-t border-secondary pt-5">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-border">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground/70">{t.location}</p>
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
