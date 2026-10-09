import { Metadata } from 'next';
import { CookiePolicyContent } from './CookiePolicyContent';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'How WillfindITT uses cookies: strictly-necessary, analytics (Google Analytics 4) and marketing (Meta Pixel) cookies, retention, and how to change your preferences.',
  openGraph: {
    title: 'Cookie Policy | WillfindITT',
    description: 'How WillfindITT uses cookies and how to control them.',
    type: 'website',
    url: 'https://willfinditt.com/cookie-policy',
    siteName: 'WillfindITT',
  },
  twitter: {
    card: 'summary',
    title: 'Cookie Policy | WillfindITT',
    description: 'How WillfindITT uses cookies and how to control them.',
  },
  alternates: {
    canonical: 'https://willfinditt.com/cookie-policy',
  },
};

export default function CookiePolicyPage() {
  return <CookiePolicyContent />;
}
