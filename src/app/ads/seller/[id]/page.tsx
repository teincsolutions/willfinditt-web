import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SellerPageClient } from './SellerPageClient';
import { SellerProfile } from '@/services/seller.service';

// Server-side fetch function for seller data
async function getSeller(id: string): Promise<SellerProfile | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sellers/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching seller:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO and social sharing
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    return {
      title: 'Seller Not Found',
      description: 'The seller profile you are looking for does not exist.',
    };
  }

  const displayName =
    seller.businessName ||
    `${seller.user?.firstName || ''} ${seller.user?.lastName || ''}`.trim() ||
    'Seller';

  const description =
    seller.description ||
    `View listings and profile of ${displayName} on WillfindITT. ${seller.verified ? 'Verified seller.' : ''}`;

  const ogImage = seller.user?.avatar || '/images/og-default.png';

  return {
    title: `${displayName} - Seller Profile`,
    description: description.substring(0, 160),
    openGraph: {
      title: `${displayName} - Seller on WillfindITT`,
      description: description.substring(0, 160),
      type: 'profile',
      url: `https://willfinditt.com/ads/seller/${id}`,
      siteName: 'WillfindITT',
      locale: 'en_GH',
      images: [
        {
          url: ogImage,
          width: 400,
          height: 400,
          alt: displayName,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${displayName} - Seller on WillfindITT`,
      description: description.substring(0, 160),
      images: [ogImage],
    },
    alternates: {
      canonical: `https://willfinditt.com/ads/seller/${id}`,
    },
  };
}

// JSON-LD structured data for seller profile
function generateJsonLd(seller: SellerProfile) {
  const displayName =
    seller.businessName ||
    `${seller.user?.firstName || ''} ${seller.user?.lastName || ''}`.trim() ||
    'Seller';

  return {
    '@context': 'https://schema.org',
    '@type': seller.businessName ? 'Organization' : 'Person',
    name: displayName,
    url: `https://willfinditt.com/ads/seller/${seller.id}`,
    ...(seller.user?.avatar && { image: seller.user.avatar }),
    ...(seller.description && { description: seller.description }),
    ...(seller.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: seller.rating,
        reviewCount: seller.totalReviews,
      },
    }),
  };
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateJsonLd(seller)),
        }}
      />
      <SellerPageClient sellerProfile={seller} />
    </>
  );
}
