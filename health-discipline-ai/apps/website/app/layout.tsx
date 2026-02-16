import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://healthdiscipline.ai'),
  title: 'Health Discipline AI — Your Parents\' Health, One Call Away',
  description:
    'We call your parents daily in their language, check on their health routines, record what actually happened, and send you a clear report. No app needed. 11 Indian languages.',
  keywords: [
    'health routine monitoring',
    'elderly care India',
    'NRI parents health',
    'AI health calls',
    'medicine reminder calls',
    'daily health check',
    'medication adherence',
    'sentiment analysis',
  ],
  openGraph: {
    title: 'Health Discipline AI — Your Parents\' Health, One Call Away',
    description:
      'We call your parents daily in their language, check on their health routines, and send you a real record of what happened. No app needed.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Health Discipline AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Health Discipline AI — Your Parents\' Health, One Call Away',
    description:
      'We call your parents daily in their language, check on their health routines, and send you a real record of what happened.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
