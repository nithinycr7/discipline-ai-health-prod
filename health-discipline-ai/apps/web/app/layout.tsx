import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  metadataBase: new URL('https://cocarely.com'),
  title: {
    default: 'Cocarely — Know How Your Parents Are Really Doing',
    template: '%s | Cocarely',
  },
  description:
    'A daily AI wellness companion that calls your parents in their language, checks on their health, medicines, and mood, and sends you a clear report. No app needed. 11 Indian languages.',
  keywords: [
    'elderly wellness monitoring',
    'elderly care India',
    'NRI parents health',
    'AI wellness calls',
    'daily health check-in',
    'parent wellness tracker',
    'mood and health monitoring',
    'senior care technology',
    'cocarely',
    'medicine reminder for parents',
    'elderly care app India',
    'AI health companion',
    'voice call health check',
  ],
  authors: [{ name: 'Cocarely', url: 'https://cocarely.com' }],
  creator: 'Cocarely',
  publisher: 'Cocarely',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Cocarely — Know How Your Parents Are Really Doing',
    description:
      'A daily AI wellness companion that calls your parents in their language, checks on their health and mood, and sends you the truth. No app needed.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Cocarely',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Cocarely — Daily wellness calls for your parents' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cocarely — Know How Your Parents Are Really Doing',
    description:
      'A daily AI wellness companion that calls your parents in their language, checks on their health and mood, and sends you the truth.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  verification: {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
