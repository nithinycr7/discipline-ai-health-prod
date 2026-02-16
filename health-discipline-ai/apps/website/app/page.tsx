import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/hero';
import { Problem } from '@/components/problem';
import { HowItWorks } from '@/components/how-it-works';
import { Features } from '@/components/features';
import { Languages } from '@/components/languages';
import { Pricing } from '@/components/pricing';
import { Testimonials } from '@/components/testimonials';
import { FAQ } from '@/components/faq';
import { CTASection } from '@/components/cta-section';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Languages />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
