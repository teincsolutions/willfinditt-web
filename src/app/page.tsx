'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAds } from '@/hooks/useAds';
import { useParentCategories } from '@/hooks/useCategories';
import { ListingCard } from '@/components/ListingCard';
import { CategoryTiles } from '@/components/CategoryTiles';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';

export default function Home() {
  const [sortBy, setSortBy] = useState('trending');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories for tiles
  const { data: categories = [], isLoading: categoriesLoading } = useParentCategories(true);

  // Map frontend sort options to API parameters
  const getSortParams = (sortOption: string) => {
    switch (sortOption) {
      case 'trending':
        return { sortBy: 'views', sortOrder: 'desc' as const };
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

  const { data: ads, isLoading } = useAds({
    page: currentPage,
    limit: 20,
    ...sortParams,
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
      {/* Hero Section */}
      <section className="bg-primary text-white py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primaryLight/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find What You Need
          </h1>
          <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto text-orange-100">
            Discover amazing deals on new and used items from trusted sellers
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span>{ads?.meta?.total?.toLocaleString() || 0} listings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full" />
              <span>{categories.length} categories</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/ads/new">
              <Button className="bg-secondary text-black hover:bg-yellow shadow-lg font-bold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post an Ad
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" className="border-white/30 text-white hover:bg-background/10">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse All
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Tiles Section */}
      <CategoryTiles categories={categories} isLoading={categoriesLoading} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sorting and Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-text">Latest Listings</h2>
            <p className="text-text-gray">{ads?.meta?.total?.toLocaleString() || 0} items found</p>
          </div>

          {/* Sorting Options */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === 'trending' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('trending')}
              className="rounded-full"
            >
              🔥 Trending
            </Button>
            <Button
              variant={sortBy === 'newest' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('newest')}
              className="rounded-full"
            >
              🆕 Newest
            </Button>
            <Button
              variant={sortBy === 'oldest' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('oldest')}
              className="rounded-full"
            >
              📅 Oldest
            </Button>
            <Button
              variant={sortBy === 'price_low' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('price_low')}
              className="rounded-full"
            >
              💰 Low to High
            </Button>
            <Button
              variant={sortBy === 'price_high' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('price_high')}
              className="rounded-full"
            >
              💎 High to Low
            </Button>
          </div>
        </div>

        {/* Pagination Top */}
        {ads && ads.meta.totalPages > 1 && (
          <div className="mb-6">
            <Pagination
              currentPage={ads.meta.page}
              totalPages={ads.meta.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        {/* Ads Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-xl shadow-sm border border-border-custom p-5 animate-pulse"
              >
                <div className="h-48 bg-background-primary/30 rounded-lg mb-4" />
                <div className="h-4 bg-background-primary/30 rounded mb-2" />
                <div className="h-4 bg-background-primary/30 rounded w-3/4 mb-2" />
                <div className="h-6 bg-background-primary/30 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : ads?.data.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {ads.data.map((ad) => (
              <ListingCard key={ad.id} ad={ad} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background rounded-2xl border border-border-custom">
            <div className="text-6xl mb-4">📭</div>
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
              currentPage={ads.meta.page}
              totalPages={ads.meta.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
