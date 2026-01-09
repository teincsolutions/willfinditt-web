import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://willfinditt.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account/',
          '/api/',
          '/auth/',
          '/messages/',
          '/notifications/',
          '/ads/new',
          '/ads/*/edit',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
