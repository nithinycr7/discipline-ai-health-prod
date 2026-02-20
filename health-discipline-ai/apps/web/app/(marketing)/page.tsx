import { Navbar } from '@/components/marketing/navbar';
import { Hero } from '@/components/marketing/hero';
import { Problem } from '@/components/marketing/problem';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Features } from '@/components/marketing/features';
import { Languages } from '@/components/marketing/languages';
import { Pricing } from '@/components/marketing/pricing';
import { Testimonials } from '@/components/marketing/testimonials';
import { FAQ } from '@/components/marketing/faq';
import { CTASection } from '@/components/marketing/cta-section';
import { Footer } from '@/components/marketing/footer';

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
