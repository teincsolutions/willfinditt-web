import { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Read the terms and conditions for using WillfindITT marketplace. Understand your rights and responsibilities when buying and selling on our platform.',
  openGraph: {
    title: 'Terms and Conditions | WillfindITT',
    description:
      'Read the terms and conditions for using WillfindITT marketplace.',
    type: 'website',
    url: 'https://willfinditt.com/terms',
    siteName: 'WillfindITT',
  },
  twitter: {
    card: 'summary',
    title: 'Terms and Conditions | WillfindITT',
    description:
      'Read the terms and conditions for using WillfindITT marketplace.',
  },
  alternates: {
    canonical: 'https://willfinditt.com/terms',
  },
};

export default function TermsPage() {
  return <StaticPage slug="terms" />;
}
