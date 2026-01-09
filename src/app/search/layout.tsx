import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search for cars, phones, electronics, real estate, and more on WillfindITT - Ghana\'s leading marketplace.',
  openGraph: {
    title: 'Search | WillfindITT',
    description:
      'Search for cars, phones, electronics, real estate, and more on WillfindITT.',
    type: 'website',
    url: 'https://willfinditt.com/search',
    siteName: 'WillfindITT',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
