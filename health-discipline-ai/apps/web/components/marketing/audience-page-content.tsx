'use client';

import { Suspense } from 'react';
import { AudienceProvider, useAudience } from './audience-context';
import { Navbar } from './navbar';

import { Hero } from './hero';
import { Problem } from './problem';
import { SolutionBridge } from './solution-bridge';
import { Pricing } from './pricing';
import { Testimonials } from './testimonials';
import { HowItWorks } from './how-it-works';
import { Features } from './features';
import { Languages } from './languages';
import { FAQ } from './faq';
import { CTASection } from './cta-section';

import { HospitalSections } from './hospital-sections';
import { ChronicSections } from './chronic-sections';
import { MaternalSections } from './maternal-sections';

function AudienceContent() {
  const { audience } = useAudience();

  return (
    <div key={audience} className="animate-fade-in">
      {audience === 'nri' && (
        <>
          <Hero />
          <Problem />
          <SolutionBridge />
          <Pricing />
          <Testimonials />
          <HowItWorks />
          <Features />
          <Languages />
          <FAQ />
          <CTASection />
        </>
      )}
      {audience === 'hospital' && (
        <>
          <HospitalSections />
          <Languages />
        </>
      )}
      {audience === 'chronic' && (
        <>
          <ChronicSections />
          <Languages />
        </>
      )}
      {audience === 'maternal' && (
        <>
          <MaternalSections />
          <Languages />
        </>
      )}
    </div>
  );
}

export function AudiencePageContent() {
  return (
    <Suspense fallback={null}>
      <AudienceProvider>
        <Navbar />
        <main>
          <AudienceContent />
        </main>
      </AudienceProvider>
    </Suspense>
  );
}
