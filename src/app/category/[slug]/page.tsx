'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { useSearchAds } from '@/hooks/useAds';
import {
  useCategoryBySlug,
  useCategoryFields,
  useSubcategories,
} from '@/hooks/useCategories';
import {
  applyFilterParams,
  countActiveFilters,
  emptyFilterValues,
  useSearchFilterValues,
} from '@/hooks/useSearchFilterParams';
import { useLocation } from '@/contexts/LocationContext';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { SubcategoryChips } from '@/components/search/SubcategoryChips';
import {
  SearchFiltersDrawer,
  SearchFiltersPanel,
} from '@/components/search/SearchFiltersPanel';
import { AdCondition, AdSearchSortBy, AdSearchSortOrder } from '@/types/ad';
import { Category } from '@/types/category';

function CategoryContent() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const pageFromUrl = Number(searchParams.get('page')) || 1;

  const { data: activeCategory, isLoading: categoryLoading } =
    useCategoryBySlug(slug);
  const { data: categoryFields = [] } = useCategoryFields(
    activeCategory?.id || ''
  );

  const filterValues = useSearchFilterValues();
  const activeFilterCount = countActiveFilters(filterValues);

  const parentId = activeCategory?.parent?.id || '';
  const { data: siblings = [] } = useSubcategories(parentId);
  const chipParent = activeCategory?.children?.length
    ? activeCategory
    : activeCategory?.parent || null;
  const chipChildren = activeCategory?.children?.length
    ? activeCategory.children
    : siblings;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Global location selection applies when the URL carries no explicit city.
  const { selectedCity } = useLocation();
  const effectiveCityId = filterValues.cityId || selectedCity?.id || undefined;

  const sortBy =
    (searchParams.get('sortBy') as AdSearchSortBy) || AdSearchSortBy.CREATED_AT;
  const sortOrder =
    (searchParams.get('sortOrder') as AdSearchSortOrder) ||
    AdSearchSortOrder.DESC;

  const { data: adsResponse, isLoading: adsLoading } = useSearchAds(
    {
      search: {
        query: searchParams.get('q') || undefined,
        categoryIds: activeCategory?.id ? [activeCategory.id] : undefined,
        page: pageFromUrl,
        limit: 12,
        priceMin: filterValues.minPrice
          ? Number(filterValues.minPrice)
          : undefined,
        priceMax: filterValues.maxPrice
          ? Number(filterValues.maxPrice)
          : undefined,
        conditions: filterValues.condition
          ? [filterValues.condition as AdCondition]
          : undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        categoryFields:
          filterValues.categoryFields.length > 0
            ? filterValues.categoryFields
            : undefined,
        cityIds: effectiveCityId ? [effectiveCityId] : undefined,
      },
    },
    { enabled: !!activeCategory?.id }
  );

  const isLoading = adsLoading || categoryLoading;
  const ads = adsResponse?.data || [];
  const meta = adsResponse?.meta;

  // Analytics: category list viewed (once per category/page).
  const trackedListRef = useRef('');
  useEffect(() => {
    if (!adsResponse || !activeCategory) return;
    const key = `${activeCategory.id}|${pageFromUrl}`;
    if (trackedListRef.current === key) return;
    trackedListRef.current = key;
    trackEvent('view_item_list', { category: activeCategory.name });
  }, [adsResponse, activeCategory, pageFromUrl]);

  const handlePageChange = (page: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', page.toString());
    router.push(`${pathname}?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (nextCategory: Category | null) => {
    if (nextCategory?.id === activeCategory?.id) return;

    // Category fields belong to the previous category; drop them and reset page.
    const next = new URLSearchParams(searchParams.toString());
    next.delete('categoryId');
    next.delete('page');
    Array.from(next.keys()).forEach((key) => {
      if (key.startsWith('categoryFields')) next.delete(key);
    });

    const query = next.toString();
    if (!nextCategory) {
      router.push(`/search${query ? `?${query}` : ''}`);
      return;
    }
    router.push(`/category/${nextCategory.slug}${query ? `?${query}` : ''}`);
  };

  const clearFilters = () => {
    const next = applyFilterParams(
      new URLSearchParams(searchParams.toString()),
      emptyFilterValues()
    );
    router.push(`${pathname}?${next.toString()}`);
  };

  const filterPanel = (
    <SearchFiltersPanel
      categoryId={activeCategory?.id || ''}
      category={activeCategory}
      categoryFields={categoryFields}
      onCategoryChange={handleCategoryChange}
      showSort
    />
  );

  if (!activeCategory && !categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-text mb-2">
          Category not found
        </h1>
        <p className="text-text-gray font-medium">
          The category you are looking for does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setIsFiltersOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-background border border-border-custom rounded-2xl shadow-sm font-bold text-text hover:bg-background-primary transition-all"
        >
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter Listings
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
            {filterPanel}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <SubcategoryChips
            parent={chipParent}
            children={chipChildren}
            currentId={activeCategory?.id}
            onSelect={handleCategoryChange}
          />

          {/* Results Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-text tracking-tight mb-2">
                {activeCategory?.parent
                  ? `${activeCategory.parent.name} › ${activeCategory.name}`
                  : activeCategory?.name || 'Category'}
              </h1>
              {meta && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <p className="text-sm font-bold text-text-gray">
                    {meta.total.toLocaleString()} listings found
                  </p>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {[...Array(6)].map((_, i) => (
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
              <div
                key={`ads-page-${pageFromUrl}`}
                className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 mb-12"
              >
                {ads.map((ad) => (
                  <div key={ad.id} className="break-inside-avoid mb-3 md:mb-0">
                    <ListingCard ad={ad} />
                  </div>
                ))}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="bg-background p-6 rounded-2xl border border-border-custom shadow-sm mb-10">
                  <Pagination
                    currentPage={pageFromUrl}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-background-primary/10 rounded-[3rem] border border-dashed border-border-custom shadow-inner">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-text mb-2">
                No matching ads found
              </h3>
              <p className="text-text-gray font-medium max-w-sm text-center">
                We couldn't find any results matching your search criteria. Try
                adjusting your filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      <SearchFiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        categoryId={activeCategory?.id || ''}
        category={activeCategory}
        categoryFields={categoryFields}
        onCategoryChange={handleCategoryChange}
        showSort
      />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 animate-pulse">
          Loading category...
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
