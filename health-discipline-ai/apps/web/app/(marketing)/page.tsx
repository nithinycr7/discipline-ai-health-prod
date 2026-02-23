import { Navbar } from '@/components/marketing/navbar';
import { Footer } from '@/components/marketing/footer';
import { AudiencePageContent } from '@/components/marketing/audience-page-content';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cocarely',
  url: 'https://cocarely.com',
  logo: 'https://cocarely.com/og-image.png',
  description:
    'A daily AI wellness companion that calls your parents in their language, checks on their health, medicines, and mood, and sends you a clear report.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hello@cocarely.com',
    contactType: 'customer service',
    availableLanguage: [
      'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada',
      'Bengali', 'Marathi', 'Gujarati', 'Malayalam', 'Punjabi', 'Odia',
    ],
  },
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Cocarely',
  url: 'https://cocarely.com',
  description:
    'AI-powered daily wellness calls for elderly parents in 11 Indian languages.',
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Cocarely Wellness Calls',
  provider: {
    '@type': 'Organization',
    name: 'Cocarely',
  },
  description:
    'Daily AI voice calls to elderly parents checking on health, medicine adherence, mood, and wellbeing. Reports sent via WhatsApp.',
  serviceType: 'AI Wellness Monitoring',
  areaServed: {
    '@type': 'Country',
    name: 'India',
  },
  availableChannel: {
    '@type': 'ServiceChannel',
    serviceType: 'Phone call',
    availableLanguage: [
      'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada',
      'Bengali', 'Marathi', 'Gujarati', 'Malayalam', 'Punjabi', 'Odia',
    ],
  },
  offers: {
    '@type': 'Offer',
    price: '1350',
    priceCurrency: 'INR',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '1350',
      priceCurrency: 'INR',
      unitText: 'MONTH',
    },
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "My parents won't talk to a robot.",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Our AI voice sounds natural and warm — many parents think they're talking to a real person. It greets them by name, speaks their language, asks about their day, and checks on their health. Most parents enjoy the daily calls within the first week.",
      },
    },
    {
      '@type': 'Question',
      name: 'Do my parents need a smartphone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. The call works on any phone — basic feature phone, landline, or smartphone. Your parents simply answer the phone and talk naturally. Zero tech skills needed.',
      },
    },
    {
      '@type': 'Question',
      name: 'What languages are supported?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We support 11 Indian languages: Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Odia, and English. The AI uses culturally appropriate greetings, medicine nicknames, and local expressions.',
      },
    },
    {
      '@type': 'Question',
      name: "What if my parent doesn't answer the call?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "You'll get an immediate alert on WhatsApp. The system can also retry the call after a configurable interval. We track answer patterns and recommend optimal call times.",
      },
    },
    {
      '@type': 'Question',
      name: "Is my parents' health data safe?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Absolutely. We're compliant with India's DPDP Act. Health data is encrypted, access-controlled, and never shared with third parties. Only authorized family members can view reports.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can the AI give medical advice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Cocarely is a wellness companion that checks in and reports — it never provides medical advice, suggests medicines, or changes dosages. For any health concerns, it directs patients to their doctor.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I cancel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Send a simple WhatsApp message. No phone calls, no retention tricks, no fine print. We also offer a full 7-day free trial with no credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'I live abroad. Can I pay in USD?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We accept payments via Stripe (USD, GBP, EUR) for international users and Razorpay (UPI, cards) for users in India. Plans start at $15/month.',
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />
      <AudiencePageContent />
      <Footer />
    </>
  );
}
