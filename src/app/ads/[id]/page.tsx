import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdDetailClient } from './AdDetailClient';
import { Ad } from '@/types/ad';
import { resolveEffectiveFormConfig } from '@/lib/categoryFormConfig';

// Server-side fetch function for ad data
async function getAd(id: string): Promise<Ad | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/${id}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching ad:', error);
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
  const ad = await getAd(id);

  if (!ad) {
    return {
      title: 'Ad Not Found',
      description: 'The ad you are looking for does not exist.',
    };
  }

  const formConfig = resolveEffectiveFormConfig(ad.category);
  const priceDisplay =
    ad.price && ad.price > 0
      ? `${ad.currency || 'GHS'} ${ad.price.toLocaleString()}`
      : formConfig.hidePrice
        ? ad.category.name
        : 'Contact for price';

  const rawDesc = (ad.description || '').replace(/<[^>]*>/g, '').trim();
  const description = rawDesc
    ? rawDesc.substring(0, 160) + (rawDesc.length > 160 ? '...' : '')
    : `${ad.title} in ${ad.category.name}`;

  const ogImage = ad.images?.[0] || '/images/og-default.png';
  const location = ad.city?.name || ad.address || 'Ghana';

  return {
    title: ad.title,
    description: `${priceDisplay} - ${description}`,
    keywords: [
      ad.title,
      ad.category.name,
      location,
      'buy',
      'sell',
      'Ghana',
      'WillfindITT',
    ],
    openGraph: {
      title: `${ad.title} - ${priceDisplay}`,
      description: description,
      type: 'website',
      url: `https://willfinditt.com/ads/${id}`,
      siteName: 'WillfindITT',
      locale: 'en_GH',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ad.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${ad.title} - ${priceDisplay}`,
      description: description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://willfinditt.com/ads/${id}`,
    },
    other: {
      'product:price:amount': ad.price?.toString() || '',
      'product:price:currency': ad.currency || 'GHS',
      'product:condition': ad.condition || '',
      'product:category': ad.category.name,
    },
  };
}

// JSON-LD structured data for rich search results
function generateJsonLd(ad: Ad) {
  const formConfig = resolveEffectiveFormConfig(ad.category);
  const isSellerHidden = Boolean(
    ad.hideSellerInfo || formConfig.hideSellerInfo
  );
  const accountName =
    `${ad.user.firstName || ''} ${ad.user.lastName || ''}`.trim();
  const sellerName = isSellerHidden
    ? ad.nickname || ad.user.firstName || 'Anonymous'
    : ad.user.sellerProfile?.businessName || accountName || 'Private seller';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: ad.title,
    description: (ad.description || '').replace(/<[^>]*>/g, ''),
    image: ad.images,
    url: `https://willfinditt.com/ads/${ad.id}`,
    offers: {
      '@type': 'Offer',
      price: ad.price || 0,
      priceCurrency: ad.currency || 'GHS',
      availability:
        ad.status === 'ACTIVE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition:
        ad.condition === 'NEW'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Person',
        name: sellerName,
      },
    },
    category: ad.category.name,
    ...(ad.city?.name && {
      areaServed: {
        '@type': 'Place',
        name: ad.city.name,
      },
    }),
  };
}

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ad = await getAd(id);

  if (!ad) {
    notFound();
  }

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateJsonLd(ad)),
        }}
      />
      <AdDetailClient ad={ad} />
    </>
  );
}
