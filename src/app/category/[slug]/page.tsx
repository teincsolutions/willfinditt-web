'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAds } from '@/hooks/useAds';

import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';
import { AdCondition } from '@/types/ad';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    minPrice: '',
    maxPrice: '',
    location: '',
    condition: '',
  });

  const { data: ads, isLoading } = useAds({
    categoryId: slug, // Use slug directly as categoryId
    page: filters.page,
    limit: filters.limit,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    cityId: filters.location || undefined,
    condition: Object.values(AdCondition).includes(
      filters.condition as AdCondition
    )
      ? (filters.condition as AdCondition)
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
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Price
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Price
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Condition
              </label>
              <select
                value={filters.condition}
                onChange={(e) =>
                  handleFilterChange('condition', e.target.value)
                }
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Any</option>
                <option value={AdCondition.NEW}>New</option>
                <option value={AdCondition.LIKE_NEW}>Like New</option>
                <option value={AdCondition.GOOD}>Good</option>
                <option value={AdCondition.FAIR}>Fair</option>
                <option value={AdCondition.POOR}>Poor</option>
              </select>
            </div>

            <Button
              onClick={() =>
                setFilters({
                  page: 1,
                  limit: 12,
                  minPrice: '',
                  maxPrice: '',
                  location: '',
                  condition: '',
                })
              }
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Category Ads</h1>
            {ads && <p className="text-gray-600">{ads.meta.total} results</p>}
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : ads?.data.length ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
              <p className="text-gray-600">No ads found in this category.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
