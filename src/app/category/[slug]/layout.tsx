import { Metadata } from 'next';
import { Category } from '@/types/category';

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

// Server-side fetch function for category by slug
async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/slug/${slug}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

// Generate dynamic metadata for category pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
      description: 'The category you are looking for does not exist.',
    };
  }

  const title = `${category.name} for Sale in Ghana`;
  const description =
    category.description ||
    `Browse ${category.name} listings on WillfindITT. Find the best deals on ${category.name.toLowerCase()} in Ghana.`;

  const ogImage = category.image || '/images/og-default.png';

  return {
    title: title,
    description: description.substring(0, 160),
    keywords: [
      category.name,
      `${category.name} Ghana`,
      `buy ${category.name}`,
      `sell ${category.name}`,
      'WillfindITT',
      'Ghana marketplace',
    ],
    openGraph: {
      title: `${category.name} | WillfindITT`,
      description: description.substring(0, 160),
      type: 'website',
      url: `https://willfinditt.com/category/${slug}`,
      siteName: 'WillfindITT',
      locale: 'en_GH',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | WillfindITT`,
      description: description.substring(0, 160),
      images: [ogImage],
    },
    alternates: {
      canonical: `https://willfinditt.com/category/${slug}`,
    },
  };
}

// JSON-LD structured data for category
function generateJsonLd(category: Category, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description:
      category.description ||
      `Browse ${category.name} listings on WillfindITT`,
    url: `https://willfinditt.com/category/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name: `${category.name} Listings`,
      numberOfItems: category._count?.ads || 0,
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: CategoryLayoutProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  return (
    <>
      {category && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateJsonLd(category, slug)),
          }}
        />
      )}
      {children}
    </>
  );
}
