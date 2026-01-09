import { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about WillfindITT - Ghana\'s leading online marketplace for buying and selling cars, phones, electronics, real estate, and more. Discover our story and mission.',
  openGraph: {
    title: 'About Us | WillfindITT',
    description:
      'Learn about WillfindITT - Ghana\'s leading online marketplace.',
    type: 'website',
    url: 'https://willfinditt.com/about-us',
    siteName: 'WillfindITT',
  },
  twitter: {
    card: 'summary',
    title: 'About Us | WillfindITT',
    description:
      'Learn about WillfindITT - Ghana\'s leading online marketplace.',
  },
  alternates: {
    canonical: 'https://willfinditt.com/about-us',
  },
};

export default function AboutUsPage() {
  return <StaticPage slug="about-us" />;
}
