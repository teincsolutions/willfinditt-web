'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useSearchAds } from '@/hooks/useAds';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { AdCondition, AdSearchSortBy, AdSearchSortOrder } from '@/types/ad';

import { CategorySidebar } from '@/components/CategorySidebar';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
  });

  // Get URL params directly
  const categoryId = searchParams.get('categoryId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const cityId = searchParams.get('cityId') || '';
  const condition = searchParams.get('condition') || '';

  // Parse fieldValues from URL (fieldValues[0][categoryFieldId]=...&fieldValues[0][value]=...)
  const fieldValues = useMemo(() => {
    const values: { categoryFieldId: string; value: string }[] = [];
    let i = 0;
    while (true) {
      const fieldId = searchParams.get(`fieldValues[${i}][categoryFieldId]`);
      const value = searchParams.get(`fieldValues[${i}][value]`);
      if (!fieldId || !value) break;
      values.push({ categoryFieldId: fieldId, value });
      i++;
    }
    return values.length > 0 ? values : undefined;
  }, [searchParams]);

  const [sort, setSort] = useState({
    sortBy: AdSearchSortBy.CREATED_AT,
    sortOrder: AdSearchSortOrder.DESC,
  });

  const { data: adsResponse, isLoading } = useSearchAds({
    search: {
      query: q,
      page: pagination.page,
      limit: pagination.limit,
      categoryIds: categoryId ? [categoryId] : undefined,
      cityIds: cityId ? [cityId] : undefined,
      priceMin: minPrice ? Number(minPrice) : undefined,
      priceMax: maxPrice ? Number(maxPrice) : undefined,
      conditions: condition ? [condition as AdCondition] : undefined,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder as 'asc' | 'desc',
      fieldValues,
    },
    facets: {
      categories: true,
      cities: true,
      conditions: true,
      priceRanges: true,
    },
  });

  const ads = adsResponse?.data || [];
  const meta = adsResponse?.meta;

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleSortChange = (sortBy: AdSearchSortBy) => {
    setSort((prev) => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy
          ? prev.sortOrder === AdSearchSortOrder.ASC
            ? AdSearchSortOrder.DESC
            : AdSearchSortOrder.ASC
          : AdSearchSortOrder.DESC,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <CategorySidebar />
        </aside>

        <main className="flex-1 min-w-0">
          {/* Active Filters Display */}
          {(categoryId ||
            cityId ||
            minPrice ||
            maxPrice ||
            condition ||
            (fieldValues && fieldValues.length > 0)) && (
            <div className="mb-8 p-6 bg-background rounded-2xl border border-border-custom shadow-sm flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-text-gray uppercase tracking-widest mr-2">
                Active filters:
              </span>
              {categoryId && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  Category Selected
                </span>
              )}
              {searchParams.get('cityId') && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
                  📍 {searchParams.get('cityName') || 'City Selected'}
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Price: {minPrice || '0'} - {maxPrice || '∞'}
                </span>
              )}
              {condition && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  {condition}
                </span>
              )}
              {fieldValues && fieldValues.length > 0 && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  {fieldValues.length} Custom Filters
                </span>
              )}
            </div>
          )}

          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-black text-text tracking-tight mb-2">
                {q ? `Results for "${q}"` : 'All Classifieds'}
              </h1>
              {meta && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <p className="text-text-gray font-bold">
                    {meta.total.toLocaleString()} listings found
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-background p-2 rounded-2xl border border-border-custom shadow-sm overflow-x-auto">
              <button
                onClick={() => handleSortChange(AdSearchSortBy.CREATED_AT)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sort.sortBy === AdSearchSortBy.CREATED_AT ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
              >
                Newest
              </button>
              <button
                onClick={() => handleSortChange(AdSearchSortBy.PRICE)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sort.sortBy === AdSearchSortBy.PRICE ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
              >
                Price
              </button>
              <button
                onClick={() => handleSortChange(AdSearchSortBy.VIEWS)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sort.sortBy === AdSearchSortBy.VIEWS ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
              >
                Popular
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-3 md:mb-0 bg-background rounded-xl overflow-hidden animate-pulse border border-border-custom flex flex-col h-full"
                >
                  <div className="aspect-[4/3] bg-background-primary/20" />
                  <div className="p-3 sm:p-5 flex-1 flex flex-col space-y-3">
                    <div className="h-4 bg-background-primary/20 rounded w-3/4" />
                    <div className="h-3 bg-background-primary/20 rounded w-1/2" />
                    <div className="mt-auto flex justify-between">
                      <div className="h-6 bg-background-primary/20 rounded w-1/3" />
                      <div className="h-3 bg-background-primary/20 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ads.length > 0 ? (
            <>
              <div className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-8 mb-12">
                {ads.map((ad) => (
                  <div key={ad.id} className="break-inside-avoid mb-3 md:mb-0">
                    <ListingCard ad={ad} />
                  </div>
                ))}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="bg-background p-6 rounded-2xl border border-border-custom shadow-sm">
                  <Pagination
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-background-primary/10 rounded-[3rem] border border-dashed border-border-custom text-center">
              <div className="w-24 h-24 bg-background-primary rounded-full flex items-center justify-center mb-8 shadow-md border border-border-custom">
                <svg
                  className="w-12 h-12 text-primary/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-text mb-2">
                No results found
              </h2>
              <p className="text-text-gray font-medium max-w-md">
                We couldn't find any ads that match your search. Try different
                keywords or adjust your filters.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Search() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 animate-pulse">
          Loading search...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
