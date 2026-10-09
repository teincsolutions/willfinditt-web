import { MetadataRoute } from 'next';

const BASE_URL = 'https://willfinditt.com';

// Fetch categories from API
async function getCategories(): Promise<
  Array<{ slug: string; updatedAt?: string }>
> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.data || data || [];
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
    return [];
  }
}

// Fetch recent ads for sitemap (paginated; API caps limit at 100 per page)
async function getRecentAds(): Promise<
  Array<{ id: string; updatedAt: string }>
> {
  const allAds: Array<{ id: string; updatedAt: string }> = [];
  const PAGE_SIZE = 100;
  const MAX_ADS = 5000; // Bound sitemap build time (shard into index later)
  let page = 1;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ads?page=${page}&limit=${PAGE_SIZE}&sortBy=updatedAt&sortOrder=desc`,
        { next: { revalidate: 3600 } },
      );

      if (!res.ok) break;

      const data = await res.json();
      const ads: Array<{ id: string; updatedAt: string }> = data.data || [];
      allAds.push(...ads);

      if (ads.length < PAGE_SIZE || allAds.length >= MAX_ADS) break;
      page += 1;
    }
  } catch (error) {
    console.error('Error fetching ads for sitemap:', error);
  }

  return allAds.slice(0, MAX_ADS);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/seller-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Category pages
  const categories = await getCategories();
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Ad detail pages
  const ads = await getRecentAds();
  const adPages: MetadataRoute.Sitemap = ads.map((ad) => ({
    url: `${BASE_URL}/ads/${ad.id}`,
    lastModified: new Date(ad.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...adPages];
}
