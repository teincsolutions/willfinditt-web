import { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = {
  title: 'Seller Policy',
  description:
    'Understand the rules and guidelines for selling on WillfindITT. Learn about listing requirements, prohibited items, and best practices for successful selling.',
  openGraph: {
    title: 'Seller Policy | WillfindITT',
    description:
      'Understand the rules and guidelines for selling on WillfindITT.',
    type: 'website',
    url: 'https://willfinditt.com/seller-policy',
    siteName: 'WillfindITT',
  },
  twitter: {
    card: 'summary',
    title: 'Seller Policy | WillfindITT',
    description:
      'Understand the rules and guidelines for selling on WillfindITT.',
  },
  alternates: {
    canonical: 'https://willfinditt.com/seller-policy',
  },
};

export default function SellerPolicyPage() {
  return <StaticPage slug="seller-policy" />;
}
