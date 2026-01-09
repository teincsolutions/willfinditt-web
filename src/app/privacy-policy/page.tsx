import { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how WillfindITT collects, uses, and protects your personal information. Our privacy policy explains your data rights and our security practices.',
  openGraph: {
    title: 'Privacy Policy | WillfindITT',
    description:
      'Learn how WillfindITT collects, uses, and protects your personal information.',
    type: 'website',
    url: 'https://willfinditt.com/privacy-policy',
    siteName: 'WillfindITT',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | WillfindITT',
    description:
      'Learn how WillfindITT collects, uses, and protects your personal information.',
  },
  alternates: {
    canonical: 'https://willfinditt.com/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return <StaticPage slug="privacy-policy" />;
}
