'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAds } from '@/hooks/useAds';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';
import { AdCondition } from '@/types/ad';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [filters, setFilters] = useState(() => ({
    page: 1,
    limit: 12,
  }));

  // Get URL params directly
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const location = searchParams.get('location') || '';
  const condition = searchParams.get('condition') || '';

  const { data: ads, isLoading } = useAds({
    search: q,
    page: filters.page,
    limit: filters.limit,
    categoryId: category || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    cityId: location || undefined,
    condition: Object.values(AdCondition).includes(condition as AdCondition)
      ? (condition as AdCondition)
      : undefined,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Active Filters Display */}
      {(category || location || minPrice || maxPrice || condition) && (
        <div className="mb-6 p-4 bg-background-primary/50 rounded-xl border border-primary/10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-text">
              Active filters:
            </span>
            {category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                Category: {category}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-successLight text-success border border-success/20">
                Location: {location}
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                Price: {minPrice || '0'} - {maxPrice || '∞'}
              </span>
            )}
            {condition && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primaryLight text-primary border border-primary/20">
                Condition: {condition}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Search Results {q && `for "${q}"`}
        </h1>
        {ads && <p className="text-text-gray">{ads.meta.total} results</p>}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : ads?.data.length ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {ads.data.map((ad) => (
              <ListingCard key={ad.id} ad={ad} />
            ))}
          </div>

          <Pagination
            currentPage={ads.meta.page}
            totalPages={ads.meta.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-text-gray">No ads found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

export default function Search() {
  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
