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
    'AI calls your parents daily in their language, checks each medicine by name, and sends you a real report. No app needed. 11 Indian languages supported.',
  keywords: [
    'medication adherence',
    'elderly care India',
    'NRI parents health',
    'AI health monitoring',
    'medicine reminder calls',
    'daily health check',
  ],
  openGraph: {
    title: 'Health Discipline AI — Your Parents\' Health, One Call Away',
    description:
      'AI calls your parents daily in their language, checks each medicine by name, and sends you a real report. No app needed.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Health Discipline AI',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Health Discipline AI — Your Parents\' Health, One Call Away',
    description:
      'AI calls your parents daily in their language, checks each medicine by name, and sends you a real report.',
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
