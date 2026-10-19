'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchAds } from '@/hooks/useAds';
import { useCategories, useParentCategories } from '@/hooks/useCategories';
import { AdStatus } from '@/types/ad';
import { ListingCard } from '@/components/ListingCard';
import { CategoryTiles } from '@/components/CategoryTiles';
import { HomeHeroCarousel } from '@/components/HomeHeroCarousel';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';

export default function Home() {
  const [sortBy, setSortBy] = useState('trending');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories for tiles
  const { data: categories = [], isLoading: categoriesLoading } =
    useParentCategories(true);

  // Total across ALL categories (flat list endpoint) — parents alone
  // undercount since ads live on leaf subcategories.
  const { data: allCategories } = useCategories();
  const totalCategories = Array.isArray(allCategories)
    ? allCategories.length
    : allCategories?.data?.length || categories.length;

  // Map frontend sort options to API parameters
  const getSortParams = (sortOption: string) => {
    switch (sortOption) {
      case 'trending':
        // Boosted slots + hourly-rotated organic (backend homeFeed sort).
        return { sortBy: 'homeFeed', sortOrder: 'desc' as const };
      case 'newest':
        return { sortBy: 'createdAt', sortOrder: 'desc' as const };
      case 'oldest':
        return { sortBy: 'createdAt', sortOrder: 'asc' as const };
      case 'price_low':
        return { sortBy: 'price', sortOrder: 'asc' as const };
      case 'price_high':
        return { sortBy: 'price', sortOrder: 'desc' as const };
      default:
        return { sortBy: 'createdAt', sortOrder: 'desc' as const };
    }
  };

  const sortParams = getSortParams(sortBy);

  const { data: ads, isLoading } = useSearchAds({
    search: {
      page: currentPage,
      limit: 20,
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
      statuses: [AdStatus.ACTIVE],
    },
  });

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-background">
      <HomeHeroCarousel />

      {/* Category Tiles Section */}
      <CategoryTiles categories={categories} isLoading={categoriesLoading} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sorting and Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text">Latest Listings</h2>
            <p className="text-text-gray">
              {ads?.meta?.total?.toLocaleString() || 0} items found
            </p>
          </div>

          {/* Sorting Options */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === 'trending' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('trending')}
              className="rounded-full flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-orange-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-6.12-6.5-13.33-6.5-13.33zM12 18c-2.21 0-4-1.79-4-4 0-1.28.61-2.42 1.55-3.15C9.74 12.03 10.74 13 12 13c1.26 0 2.26-.97 2.45-2.15.94.73 1.55 1.87 1.55 3.15 0 2.21-1.79 4-4 4z" />
              </svg>
              Trending
            </Button>
            <Button
              variant={sortBy === 'newest' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('newest')}
              className="rounded-full flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
                />
              </svg>
              Newest
            </Button>
            <Button
              variant={sortBy === 'oldest' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('oldest')}
              className="rounded-full flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Oldest
            </Button>
            <Button
              variant={sortBy === 'price_low' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('price_low')}
              className="rounded-full flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              Low to High
            </Button>
            <Button
              variant={sortBy === 'price_high' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('price_high')}
              className="rounded-full flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8V4m0 0L8 8m4-4l4 4m-8 8h8a2 2 0 002-2v-3a2 2 0 00-2-2h-8m0 5V9m0 5c0 1.1.9 2 2 2h1"
                />
              </svg>
              High to Low
            </Button>
          </div>
        </div>

        {/* Pagination Top */}
        {ads && ads.meta.totalPages > 1 && (
          <div className="mb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={ads.meta.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Ads Grid */}
        {isLoading ? (
          <div className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-3 md:mb-0 bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden animate-pulse flex flex-col h-full"
              >
                <div className="aspect-[4/3] bg-background-primary/30" />
                <div className="p-3 sm:p-5 flex-1 flex flex-col space-y-3">
                  <div className="h-4 bg-background-primary/30 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-background-primary/30 rounded w-1/2 mb-2" />
                  <div className="mt-auto flex justify-between items-center">
                    <div className="h-6 bg-background-primary/30 rounded w-1/3" />
                    <div className="h-3 bg-background-primary/30 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ads?.data.length ? (
          <div className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {ads.data.map((ad: any) => (
              <div key={ad.id} className="break-inside-avoid mb-3 md:mb-0">
                <ListingCard ad={ad} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background rounded-2xl border border-border-custom">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-background-primary rounded-full flex items-center justify-center text-text-light-gray">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-text mb-2">
              No listings yet
            </h3>
            <p className="text-text-gray mb-6">
              Be the first to post an ad and reach thousands of buyers!
            </p>
            <Link href="/ads/new">
              <Button>Post Your First Ad</Button>
            </Link>
          </div>
        )}

        {/* Pagination Bottom */}
        {ads && ads.meta.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={ads.meta.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
