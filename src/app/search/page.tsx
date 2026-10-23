'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearchAds } from '@/hooks/useAds';
import {
  useCategory,
  useCategoryFields,
  useSubcategories,
} from '@/hooks/useCategories';
import {
  countActiveFilters,
  useSearchFilterValues,
  withCategoryParam,
} from '@/hooks/useSearchFilterParams';
import { trackEvent } from '@/lib/analytics';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { SubcategoryChips } from '@/components/search/SubcategoryChips';
import { FeaturedCategoryFilters } from '@/components/search/FeaturedCategoryFilters';
import {
  SearchFiltersDrawer,
  SearchFiltersPanel,
} from '@/components/search/SearchFiltersPanel';
import { useLocation } from '@/contexts/LocationContext';
import { AdCondition, AdSearchSortBy, AdSearchSortOrder } from '@/types/ad';
import { Category } from '@/types/category';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  // Get pagination from URL
  const page = Number(searchParams.get('page')) || 1;
  const limit = 12;

  // URL-driven filters
  const categoryId = searchParams.get('categoryId') || '';
  const filterValues = useSearchFilterValues();
  const activeFilterCount = countActiveFilters(filterValues);

  // Resolve category + its fields so the sidebar can render the right filters.
  const { data: category } = useCategory(categoryId, { enabled: !!categoryId });
  const { data: categoryFields = [] } = useCategoryFields(categoryId);

  // Subcategory chips: show children of the current category, or siblings when
  // the current category is a child (with the parent as the "All …" target).
  const parentId = category?.parentId || category?.parent?.id || '';
  const { data: siblings = [] } = useSubcategories(parentId);
  const chipParent = category?.children?.length
    ? category
    : category?.parent || null;
  const chipChildren = category?.children?.length ? category.children : siblings;

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Global location selection applies when the URL carries no explicit city.
  const { selectedCity } = useLocation();
  const effectiveCityId = filterValues.cityId || selectedCity?.id || '';

  const hasQuery = Boolean(q.trim());
  const sortByParam = searchParams.get('sortBy') as AdSearchSortBy | null;
  const sortBy =
    !hasQuery && sortByParam === AdSearchSortBy.RELEVANCE
      ? AdSearchSortBy.CREATED_AT
      : sortByParam ||
        (hasQuery ? AdSearchSortBy.RELEVANCE : AdSearchSortBy.CREATED_AT);
  const sortOrder =
    (searchParams.get('sortOrder') as AdSearchSortOrder) ||
    AdSearchSortOrder.DESC;

  const { data: adsResponse, isLoading } = useSearchAds({
    search: {
      query: q,
      page,
      limit,
      categoryIds: categoryId ? [categoryId] : undefined,
      cityIds: effectiveCityId ? [effectiveCityId] : undefined,
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
    },
  });

  const ads = adsResponse?.data || [];
  const meta = adsResponse?.meta;

  // Analytics: results list viewed (once per query/page).
  const trackedListRef = useRef('');
  useEffect(() => {
    if (!adsResponse) return;
    const key = `${q}|${page}|${categoryId || ''}`;
    if (trackedListRef.current === key) return;
    trackedListRef.current = key;
    trackEvent('view_item_list', { searchTerm: q || undefined });
  }, [adsResponse, q, page, categoryId]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  const handleCategoryChange = (nextCategory: Category | null) => {
    const params = withCategoryParam(
      new URLSearchParams(searchParams.toString()),
      nextCategory?.id ?? null
    );
    router.push(`/search?${params.toString()}`);
  };

  const handleSortChange = (newSortBy: AdSearchSortBy) => {
    const params = new URLSearchParams(searchParams.toString());

    // Toggle order if clicking the same sort (relevance is always desc).
    let newOrder = AdSearchSortOrder.DESC;
    if (sortBy === newSortBy && newSortBy !== AdSearchSortBy.RELEVANCE) {
      newOrder =
        sortOrder === AdSearchSortOrder.ASC
          ? AdSearchSortOrder.DESC
          : AdSearchSortOrder.ASC;
    }

    params.set('sortBy', newSortBy);
    params.set('sortOrder', newOrder);

    // Reset to page 1 on sort change
    params.set('page', '1');

    router.push(`/search?${params.toString()}`);
  };

  const heading = q
    ? `Results for "${q}"`
    : category
      ? category.parent
        ? `${category.parent.name} › ${category.name}`
        : category.name
      : 'All Classifieds';

  const filterPanel = (
    <SearchFiltersPanel
      categoryId={categoryId}
      category={category}
      categoryFields={categoryFields}
      onCategoryChange={handleCategoryChange}
    />
  );

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
          <div className="mb-8">
            <h1 className="text-4xl font-black text-text tracking-tight mb-2">
              {heading}
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

          <FeaturedCategoryFilters
            category={category}
            fields={categoryFields}
            className="mb-8"
          />

          <SubcategoryChips
            parent={chipParent}
            children={chipChildren}
            currentId={category?.id}
            onSelect={handleCategoryChange}
          />

          {/* Active Filters Display */}
          {(categoryId ||
            filterValues.cityId ||
            filterValues.minPrice ||
            filterValues.maxPrice ||
            filterValues.condition ||
            filterValues.categoryFields.length > 0) && (
            <div className="mb-8 p-6 bg-background rounded-2xl border border-border-custom shadow-sm flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-text-gray uppercase tracking-widest mr-2">
                Active filters:
              </span>
              {categoryId && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {category?.name || 'Category selected'}
                </span>
              )}
              {filterValues.cityId && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
                  📍 {filterValues.cityName || 'City selected'}
                </span>
              )}
              {(filterValues.minPrice || filterValues.maxPrice) && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Price: {filterValues.minPrice || '0'} -{' '}
                  {filterValues.maxPrice || '∞'}
                </span>
              )}
              {filterValues.condition && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  {filterValues.condition.replace(/_/g, ' ')}
                </span>
              )}
              {filterValues.categoryFields.length > 0 && (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  {filterValues.categoryFields.length} Custom Filters
                </span>
              )}
            </div>
          )}

          {/* Sort Toolbar */}
          <div className="flex items-center justify-end mb-8">
            <div className="flex items-center gap-3 bg-background p-2 rounded-2xl border border-border-custom shadow-sm overflow-x-auto">
              {hasQuery && (
                <button
                  onClick={() => handleSortChange(AdSearchSortBy.RELEVANCE)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === AdSearchSortBy.RELEVANCE ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
                >
                  Best Match
                </button>
              )}
              <button
                onClick={() => handleSortChange(AdSearchSortBy.CREATED_AT)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === AdSearchSortBy.CREATED_AT ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
              >
                Newest
              </button>
              <button
                onClick={() => handleSortChange(AdSearchSortBy.PRICE)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === AdSearchSortBy.PRICE ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
              >
                Price
              </button>
              <button
                onClick={() => handleSortChange(AdSearchSortBy.VIEWS)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${sortBy === AdSearchSortBy.VIEWS ? 'bg-primary text-white shadow-md' : 'text-text-gray hover:bg-background-primary'}`}
              >
                Popular
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-3 md:mb-6 bg-background rounded-xl overflow-hidden animate-pulse border border-border-custom flex flex-col h-full"
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
                key={`ads-page-${page}`}
                className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-8 mb-12"
              >
                {ads.map((ad) => (
                  <div key={ad.id} className="break-inside-avoid mb-3 md:mb-6">
                    <ListingCard ad={ad} />
                  </div>
                ))}
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="bg-background p-6 rounded-2xl border border-border-custom shadow-sm">
                  <Pagination
                    currentPage={page}
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

      <SearchFiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        categoryId={categoryId}
        category={category}
        categoryFields={categoryFields}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}

function SearchInner() {
  const searchParams = useSearchParams();
  const key = searchParams.toString();

  return <SearchContent key={key} />;
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
      <SearchInner />
    </Suspense>
  );
}
