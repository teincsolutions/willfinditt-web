import type { Metadata } from 'next';
import { DatingPageClient } from '@/components/community/DatingHubPanel';

export const metadata: Metadata = {
  title: 'Love & Dating | WillfindITT Community',
  description: 'A private, ID-verified community space on WillfindITT.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DatingPage() {
  return <DatingPageClient />;
}
