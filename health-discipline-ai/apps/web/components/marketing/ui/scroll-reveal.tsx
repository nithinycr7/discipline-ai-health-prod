'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right';
  delay?: number;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const animationClass = {
    'fade-up': 'animate-fade-up',
    'fade-in': 'animate-fade-in',
    'slide-left': 'animate-slide-in-left',
    'slide-right': 'animate-slide-in-right',
  }[animation];

  return (
    <div
      ref={ref}
      className={clsx(className, isVisible ? animationClass : 'opacity-0')}
      style={isVisible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
