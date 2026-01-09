'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { useSearchAds } from '@/hooks/useAds';
import { useCategoryBySlug, useCategoryFields } from '@/hooks/useCategories';

import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';
import { AdCondition, AdSearchSortBy, AdSearchSortOrder } from '@/types/ad';
import { CategoryFieldFilter } from '@/types/category';

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const pageFromUrl = Number(searchParams.get('page')) || 1;

  // Fetch current category by slug
  const { data: activeCategory, isLoading: categoryLoading } = useCategoryBySlug(slug);

  // Fetch dynamic fields for this category
  const { data: categoryFields } = useCategoryFields(activeCategory?.id || '');

  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    minPrice: '',
    maxPrice: '',
    condition: '',
    sortBy: AdSearchSortBy.CREATED_AT,
    sortOrder: AdSearchSortOrder.DESC,
  });

  const [categoryFieldFilters, setCategoryFieldFilters] = useState<
    CategoryFieldFilter[]
  >([]);

  // Active filters used for fetching data
  const [activeFilters, setActiveFilters] = useState(filters);
  const [activeCategoryFieldFilters, setActiveCategoryFieldFilters] =
    useState(categoryFieldFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Use the advanced search endpoint
  const { data: adsResponse, isLoading: adsLoading } = useSearchAds({
    search: {
      categoryIds: activeCategory?.id ? [activeCategory.id] : undefined,
      page: pageFromUrl,
      limit: activeFilters.limit,
      priceMin: activeFilters.minPrice
        ? Number(activeFilters.minPrice)
        : undefined,
      priceMax: activeFilters.maxPrice
        ? Number(activeFilters.maxPrice)
        : undefined,
      conditions: activeFilters.condition
        ? [activeFilters.condition as AdCondition]
        : undefined,
      sortBy: activeFilters.sortBy,
      sortOrder: activeFilters.sortOrder as 'asc' | 'desc',
      categoryFields:
        activeCategoryFieldFilters.length > 0
          ? activeCategoryFieldFilters
          : undefined,
      cityIds: searchParams.get('cityId')
        ? [searchParams.get('cityId') as string]
        : undefined,
    },
    facets: {
      categories: true,
      cities: true,
      conditions: true,
      priceRanges: true,
    },
  });

  const isLoading = adsLoading || categoryLoading;

  const ads = adsResponse?.data || [];
  const meta = adsResponse?.meta;

  const handleFilterChange = (key: string, value: string) => {
    // For sort/pagination, apply immediately
    if (['sortBy', 'sortOrder', 'page'].includes(key)) {
      setFilters((prev) => {
        const next = { ...prev, [key]: value };
        setActiveFilters(next);
        return next;
      });
    } else {
      // For content filters, just update UI state
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const applyFilters = () => {
    setActiveFilters({ ...filters, page: 1 });
    setActiveCategoryFieldFilters(categoryFieldFilters);
    setIsFilterDrawerOpen(false);
  };

  const handleCategoryFieldChange = (
    categoryFieldId: string,
    value: string
  ) => {
    setCategoryFieldFilters((prev) => {
      const existing = prev.find((f) => f.categoryFieldId === categoryFieldId);
      if (value === '') {
        return prev.filter((f) => f.categoryFieldId !== categoryFieldId);
      }
      if (existing) {
        return prev.map((f) =>
          f.categoryFieldId === categoryFieldId ? { ...f, value } : f
        );
      } else {
        return [...prev, { categoryFieldId, value }];
      }
    });
    // Don't reset page here, wait for apply
  };

  // Handle NUMBER field range changes (min/max)
  const handleNumberRangeChange = (
    categoryFieldId: string,
    type: 'min' | 'max',
    value: string
  ) => {
    setCategoryFieldFilters((prev) => {
      const existing = prev.find((f) => f.categoryFieldId === categoryFieldId);
      const currentVal = existing?.value;
      const rangeValue =
        typeof currentVal === 'object' && !Array.isArray(currentVal)
          ? { ...currentVal }
          : { min: undefined, max: undefined };

      if (value) {
        rangeValue[type] = Number(value);
      } else {
        delete rangeValue[type];
      }

      // Remove if both min and max are empty
      if (rangeValue.min === undefined && rangeValue.max === undefined) {
        return prev.filter((f) => f.categoryFieldId !== categoryFieldId);
      }

      if (existing) {
        return prev.map((f) =>
          f.categoryFieldId === categoryFieldId
            ? { ...f, value: rangeValue }
            : f
        );
      } else {
        return [...prev, { categoryFieldId, value: rangeValue }];
      }
    });
    // Don't reset page here, wait for apply
  };

  // Handle CHECKBOX multi-select changes
  const handleCheckboxMultiSelect = (
    categoryFieldId: string,
    optionValue: string,
    checked: boolean
  ) => {
    setCategoryFieldFilters((prev) => {
      const existing = prev.find((f) => f.categoryFieldId === categoryFieldId);
      const currentVal = existing?.value;
      let values: string[] = Array.isArray(currentVal) ? [...currentVal] : [];

      if (checked) {
        if (!values.includes(optionValue)) {
          values.push(optionValue);
        }
      } else {
        values = values.filter((v) => v !== optionValue);
      }

      if (values.length === 0) {
        return prev.filter((f) => f.categoryFieldId !== categoryFieldId);
      }

      if (existing) {
        return prev.map((f) =>
          f.categoryFieldId === categoryFieldId ? { ...f, value: values } : f
        );
      } else {
        return [...prev, { categoryFieldId, value: values }];
      }
    });
    // Don't reset page here, wait for apply
  };

  // Helper to get string value
  const getStringValue = (categoryFieldId: string): string => {
    const filter = categoryFieldFilters.find(
      (f) => f.categoryFieldId === categoryFieldId
    );
    return typeof filter?.value === 'string' ? filter.value : '';
  };

  // Helper to get range value
  const getRangeValue = (
    categoryFieldId: string
  ): { min?: number; max?: number } => {
    const filter = categoryFieldFilters.find(
      (f) => f.categoryFieldId === categoryFieldId
    );
    const val = filter?.value;
    if (typeof val === 'object' && !Array.isArray(val)) {
      return val as { min?: number; max?: number };
    }
    return {};
  };

  // Helper to get array value for CHECKBOX multi-select
  const getArrayValue = (categoryFieldId: string): string[] => {
    const filter = categoryFieldFilters.find(
      (f) => f.categoryFieldId === categoryFieldId
    );
    return Array.isArray(filter?.value) ? (filter.value as string[]) : [];
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/category/${slug}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: AdSearchSortBy.CREATED_AT,
      sortOrder: AdSearchSortOrder.DESC,
    });
    setActiveCategoryFieldFilters([]);
    setActiveFilters({
      page: 1,
      limit: 12,
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: AdSearchSortBy.CREATED_AT,
      sortOrder: AdSearchSortOrder.DESC,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
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
          {activeCategoryFieldFilters.length +
            (filters.minPrice || filters.maxPrice || filters.condition
              ? 1
              : 0) >
            0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px]">
              {activeCategoryFieldFilters.length +
                (filters.minPrice || filters.maxPrice || filters.condition
                  ? 1
                  : 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0">
          <div className="bg-background p-6 rounded-2xl shadow-sm border border-border-custom sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text">Filters</h3>
              {(filters.minPrice ||
                filters.maxPrice ||
                filters.condition ||
                categoryFieldFilters.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Dynamic Category Fields */}
              {categoryFields && categoryFields.length > 0 && (
                <div className="space-y-6 pb-6 border-b border-border-custom">
                  {categoryFields.map((field) => (
                    <div key={field.id}>
                      {field.type !== 'TEXT' && (
                        <label className="block text-sm font-bold text-text-gray mb-3 uppercase tracking-wider">
                          {field.label}
                        </label>
                      )}

                      {/* SELECT field - dropdown */}
                      {field.type === 'SELECT' && field.options && (
                        <select
                          value={getStringValue(field.id)}
                          onChange={(e) =>
                            handleCategoryFieldChange(field.id, e.target.value)
                          }
                          className="w-full bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                        >
                          <option value="">Any {field.label}</option>
                          {field.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* RADIO field - single selection */}
                      {field.type === 'RADIO' && field.options && (
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                          {field.options.map((option) => {
                            const isActive =
                              getStringValue(field.id) === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() =>
                                  handleCategoryFieldChange(
                                    field.id,
                                    isActive ? '' : option.value
                                  )
                                }
                                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  isActive
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-background hover:bg-background-primary/50 border-border-custom text-text-gray hover:text-text'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {/* NUMBER field - range inputs (min/max) */}
                      {field.type === 'NUMBER' && (
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            value={getRangeValue(field.id).min ?? ''}
                            onChange={(e) =>
                              handleNumberRangeChange(
                                field.id,
                                'min',
                                e.target.value
                              )
                            }
                            placeholder="Min"
                            className="w-full bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                          />
                          <input
                            type="number"
                            value={getRangeValue(field.id).max ?? ''}
                            onChange={(e) =>
                              handleNumberRangeChange(
                                field.id,
                                'max',
                                e.target.value
                              )
                            }
                            placeholder="Max"
                            className="w-full bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                          />
                        </div>
                      )}

                      {/* CHECKBOX field - multi-select from options */}
                      {field.type === 'CHECKBOX' && field.options && (
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                          {field.options.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center group cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={getArrayValue(field.id).includes(
                                  option.value
                                )}
                                onChange={(e) =>
                                  handleCheckboxMultiSelect(
                                    field.id,
                                    option.value,
                                    e.target.checked
                                  )
                                }
                                className="w-5 h-5 rounded border-border-custom text-primary focus:ring-primary/20 transition-all cursor-pointer"
                              />
                              <span className="ml-3 text-sm font-bold text-text-gray group-hover:text-text transition-colors">
                                {option.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* BOOLEAN field - simple toggle (for CHECKBOX without options) */}
                      {field.type === 'BOOLEAN' && (
                        <label className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={getStringValue(field.id) === 'true'}
                            onChange={(e) =>
                              handleCategoryFieldChange(
                                field.id,
                                e.target.checked ? 'true' : ''
                              )
                            }
                            className="w-5 h-5 rounded border-border-custom text-primary focus:ring-primary/20 transition-all cursor-pointer"
                          />
                          <span className="ml-3 text-sm font-bold text-text-gray group-hover:text-text transition-colors">
                            Yes
                          </span>
                        </label>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold text-text-gray mb-3 uppercase tracking-wider">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-gray text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange('minPrice', e.target.value)
                      }
                      className="w-full bg-background-primary/30 border border-border-custom rounded-xl pl-6 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                      placeholder="Min"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-gray text-xs font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange('maxPrice', e.target.value)
                      }
                      className="w-full bg-background-primary/30 border border-border-custom rounded-xl pl-6 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-bold text-text-gray mb-3 uppercase tracking-wider">
                  Item Condition
                </label>
                <select
                  value={filters.condition}
                  onChange={(e) =>
                    handleFilterChange('condition', e.target.value)
                  }
                  className="w-full bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                >
                  <option value="">All Conditions</option>
                  <option value={AdCondition.NEW}>New</option>
                  <option value={AdCondition.USED}>Used</option>
                  <option value={AdCondition.LIKE_NEW}>Like New</option>
                  <option value={AdCondition.GOOD}>Good</option>
                  <option value={AdCondition.FAIR}>Fair</option>
                  <option value={AdCondition.POOR}>Poor</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-bold text-text-gray mb-3 uppercase tracking-wider">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                >
                  <option value={AdSearchSortBy.CREATED_AT}>
                    Newest First
                  </option>
                  <option value={AdSearchSortBy.PRICE}>Price</option>
                  <option value={AdSearchSortBy.VIEWS}>Most Popular</option>
                  <option value={AdSearchSortBy.RELEVANCE}>Relevance</option>
                </select>
              </div>

              <div className="pt-4">
                <Button
                  onClick={applyFilters}
                  className="w-full py-3 text-base"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background shadow-2xl overflow-y-auto flex flex-col transform transition-transform duration-300">
              <div className="flex items-center justify-between p-6 border-b border-border-custom sticky top-0 bg-background z-10">
                <h2 className="text-xl font-black text-text italic">FILTERS</h2>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-2 hover:bg-background-primary rounded-xl transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-text-gray"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-text-gray uppercase tracking-widest">
                    Refine Search
                  </h3>
                  {(filters.minPrice ||
                    filters.maxPrice ||
                    filters.condition ||
                    categoryFieldFilters.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-bold text-primary hover:underline px-2 py-1 bg-primary/5 rounded-lg"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Reuse internal filter logic here if possible, but for simplicity we'll just replicate or refactor later */}
                  {/* Dynamic Category Fields */}
                  {categoryFields && categoryFields.length > 0 && (
                    <div className="space-y-8 pb-8 border-b border-border-custom">
                      {categoryFields.map((field) => (
                        <div key={field.id} className="space-y-4">
                          {field.type !== 'TEXT' && (
                            <label className="block text-sm font-bold text-text-gray uppercase tracking-widest">
                              {field.label}
                            </label>
                          )}

                          {/* SELECT */}
                          {field.type === 'SELECT' && field.options && (
                            <select
                              value={getStringValue(field.name)}
                              onChange={(e) =>
                                handleCategoryFieldChange(
                                  field.name,
                                  e.target.value
                                )
                              }
                              className="w-full bg-background-primary/30 border border-border-custom rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                            >
                              <option value="">Any {field.label}</option>
                              {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* RADIO with scroll */}
                          {field.type === 'RADIO' && field.options && (
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                              {field.options.map((option) => {
                                const isActive =
                                  getStringValue(field.name) === option.value;
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      handleCategoryFieldChange(
                                        field.name,
                                        isActive ? '' : option.value
                                      )
                                    }
                                    className={`flex items-center px-5 py-3.5 rounded-2xl text-xs font-bold transition-all border ${
                                      isActive
                                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                        : 'bg-background hover:bg-background-primary/50 border-border-custom text-text-gray hover:text-text'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* NUMBER range */}
                          {field.type === 'NUMBER' && (
                            <div className="grid grid-cols-2 gap-4">
                              <input
                                type="number"
                                value={getRangeValue(field.id).min ?? ''}
                                onChange={(e) =>
                                  handleNumberRangeChange(
                                    field.id,
                                    'min',
                                    e.target.value
                                  )
                                }
                                placeholder="Min"
                                className="w-full bg-background-primary/30 border border-border-custom rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                              />
                              <input
                                type="number"
                                value={getRangeValue(field.id).max ?? ''}
                                onChange={(e) =>
                                  handleNumberRangeChange(
                                    field.id,
                                    'max',
                                    e.target.value
                                  )
                                }
                                placeholder="Max"
                                className="w-full bg-background-primary/30 border border-border-custom rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                              />
                            </div>
                          )}

                          {/* CHECKBOX with scroll */}
                          {field.type === 'CHECKBOX' && field.options && (
                            <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                              {field.options.map((option) => (
                                <label
                                  key={option.value}
                                  className="flex items-center group cursor-pointer p-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={getArrayValue(field.id).includes(
                                      option.value
                                    )}
                                    onChange={(e) =>
                                      handleCheckboxMultiSelect(
                                        field.id,
                                        option.value,
                                        e.target.checked
                                      )
                                    }
                                    className="w-6 h-6 rounded-lg border-border-custom text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                  />
                                  <span className="ml-4 text-sm font-bold text-text-gray group-hover:text-text transition-colors">
                                    {option.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Price Range */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-text-gray uppercase tracking-widest">
                      Price Range
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light-gray font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) =>
                            handleFilterChange('minPrice', e.target.value)
                          }
                          className="w-full bg-background-primary/30 border border-border-custom rounded-2xl pl-8 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                          placeholder="Min"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light-gray font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) =>
                            handleFilterChange('maxPrice', e.target.value)
                          }
                          className="w-full bg-background-primary/30 border border-border-custom rounded-2xl pl-8 pr-4 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-text-gray uppercase tracking-widest">
                      Item Condition
                    </label>
                    <select
                      value={filters.condition}
                      onChange={(e) =>
                        handleFilterChange('condition', e.target.value)
                      }
                      className="w-full bg-background-primary/30 border border-border-custom rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold"
                    >
                      <option value="">All Conditions</option>
                      <option value={AdCondition.NEW}>New</option>
                      <option value={AdCondition.USED}>Used</option>
                      <option value={AdCondition.LIKE_NEW}>Like New</option>
                      <option value={AdCondition.GOOD}>Good</option>
                      <option value={AdCondition.FAIR}>Fair</option>
                      <option value={AdCondition.POOR}>Poor</option>
                    </select>
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 pt-10 pb-6 bg-gradient-to-t from-background via-background to-transparent mt-10">
                  <Button
                    onClick={applyFilters}
                    className="w-full py-5 text-lg font-black shadow-xl shadow-primary/30 rounded-2xl"
                  >
                    Set Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-background p-6 rounded-2xl border border-border-custom shadow-sm">
            <div>
              <h1 className="text-3xl font-black text-text tracking-tight mb-2">
                {activeCategory?.name || 'Category Ads'}
              </h1>
              {meta && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  <p className="text-sm font-bold text-text-gray">
                    {meta.total.toLocaleString()} listings found
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleFilterChange(
                    'sortOrder',
                    filters.sortOrder === AdSearchSortOrder.ASC
                      ? AdSearchSortOrder.DESC
                      : AdSearchSortOrder.ASC
                  )
                }
                className="p-2.5 bg-background-primary/50 text-text rounded-xl border border-border-custom hover:border-primary/30 transition-all font-bold text-sm flex items-center gap-2"
              >
                {filters.sortOrder === AdSearchSortOrder.ASC
                  ? 'Increasing'
                  : 'Decreasing'}
                <svg
                  className={`w-4 h-4 transition-transform ${filters.sortOrder === AdSearchSortOrder.ASC ? '' : 'rotate-180'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
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
              <div className="columns-2 gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 mb-12">
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
              <p className="text-text-gray font-medium max-sm text-center">
                We couldn't find any results matching your search criteria. Try
                adjusting your filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/25 hover:opacity-90 transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center">
          Loading category...
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
