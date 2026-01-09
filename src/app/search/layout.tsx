import { Metadata } from 'next';

interface SearchLayoutProps {
  children: React.ReactNode;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const searchQuery = q || '';

  if (!searchQuery) {
    return {
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
        index: false, // Don't index empty search pages
        follow: true,
      },
    };
  }

  const title = `Search results for "${searchQuery}"`;
  const description = `Find ${searchQuery} on WillfindITT. Browse listings and great deals in Ghana.`;

  return {
    title: title,
    description: description,
    openGraph: {
      title: `${title} | WillfindITT`,
      description: description,
      type: 'website',
      url: `https://willfinditt.com/search?q=${encodeURIComponent(searchQuery)}`,
      siteName: 'WillfindITT',
      locale: 'en_GH',
    },
    twitter: {
      card: 'summary',
      title: `${title} | WillfindITT`,
      description: description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function SearchLayout({ children }: SearchLayoutProps) {
  return <>{children}</>;
}
