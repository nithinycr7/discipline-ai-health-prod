import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Try the AI Wellness Companion — Health Discipline AI',
  description:
    'Talk to our AI wellness companion right now. Experience the warm, caring voice that checks on your parents every day — in 11 Indian languages.',
  openGraph: {
    title: 'Try the AI Wellness Companion — Health Discipline AI',
    description:
      'Talk to our AI wellness companion right now. Experience the warm, caring voice that checks on your parents every day.',
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
