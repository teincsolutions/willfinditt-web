'use client';

import { useState } from 'react';
import { useAds } from '@/hooks/useAds';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';

export default function Home() {
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Map frontend sort options to API parameters
  const getSortParams = (sortOption: string) => {
    switch (sortOption) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Find What You Need</h1>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Discover amazing deals on new and used items from trusted sellers
          </p>
          <div className="text-sm">
            Browse {ads?.meta?.total || 0} listings from our marketplace
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sorting and Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Listings</h2>
            <p className="text-gray-600">{ads?.meta?.total || 0} items found</p>
          </div>

          {/* Sorting Options - Horizontal Cards */}
          <div className="flex flex-wrap gap-2">
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
              💰 Price: Low to High
            </Button>
            <Button
              variant={sortBy === 'price_high' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSortChange('price_high')}
              className="rounded-full"
            >
              💎 Price: High to Low
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
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
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No listings found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new listings.
            </p>
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
