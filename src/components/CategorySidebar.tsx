'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParentCategories, useCategoryFields } from '@/hooks/useCategories';
import { OptimizedImage } from './OptimizedImage';
import { Button } from './Button';

interface CategorySidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CategorySidebar = ({
  isOpen = false,
  onClose,
}: CategorySidebarProps) => {
  const { data: categories = [], isLoading } = useParentCategories(false);
  const router = useRouter();

  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
  });

  const [fieldValues, setFieldValues] = useState<{ categoryFieldId: string; value: string }[]>([]);

  const { data: categoryFields } = useCategoryFields(filters.categoryId);
  const searchParams = useSearchParams();

  // Initialize from URL
  useEffect(() => {
    const categoryId = searchParams.get('categoryId') || '';
    const cityId = searchParams.get('cityId') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const condition = searchParams.get('condition') || '';

    setFilters(prev => ({
      ...prev,
      categoryId,
      cityId,
      minPrice,
      maxPrice,
      condition,
    }));

    // Initialize field values
    const values: { categoryFieldId: string; value: string }[] = [];
    let i = 0;
    while (true) {
      const fieldId = searchParams.get(`fieldValues[${i}][categoryFieldId]`);
      const value = searchParams.get(`fieldValues[${i}][value]`);
      if (!fieldId || !value) break;
      values.push({ categoryFieldId: fieldId, value });
      i++;
    }
    setFieldValues(values);
  }, [searchParams]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Clear field values when category changes
      if (key === 'categoryId' && value !== prev.categoryId) {
        setFieldValues([]);
      }
      return newFilters;
    });
  };

  const handleCategoryFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => {
      const existing = prev.find((f) => f.categoryFieldId === fieldId);
      if (value === '') {
        return prev.filter((f) => f.categoryFieldId !== fieldId);
      }
      if (existing) {
        return prev.map((f) =>
          f.categoryFieldId === fieldId ? { ...f, value } : f
        );
      } else {
        return [...prev, { categoryFieldId: fieldId, value }];
      }
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    const currentCityId = searchParams.get('cityId');
    if (currentCityId) params.set('cityId', currentCityId);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.condition) params.set('condition', filters.condition);

    // Add field values
    fieldValues.forEach((field, index) => {
      params.set(`fieldValues[${index}][categoryFieldId]`, field.categoryFieldId);
      params.set(`fieldValues[${index}][value]`, field.value);
    });

    router.push(`/search?${params.toString()}`);
    if (onClose) onClose();
  };

  const clearFilters = () => {
    setFilters({
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
    });
    setFieldValues([]);
  };

  const renderFiltersBody = (isMobile = false) => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Category
        </label>
        <select
          value={filters.categoryId}
          onChange={(e) => handleFilterChange('categoryId', e.target.value)}
          className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>


      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Price Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            placeholder="Min"
            className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            placeholder="Max"
            className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Condition Filter */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Condition
        </label>
        <select
          value={filters.condition}
          onChange={(e) => handleFilterChange('condition', e.target.value)}
          className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Any Condition</option>
          <option value="NEW">New</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="GOOD">Good</option>
          <option value="FAIR">Fair</option>
          <option value="POOR">Poor</option>
        </select>
      </div>

      {/* Dynamic Category Fields */}
      {categoryFields && categoryFields.length > 0 && (
        <div className="border-t border-border-custom pt-6 space-y-6">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wider">
            {categories.find(c => c.id === filters.categoryId)?.name} Filters
          </h3>
          {categoryFields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-text mb-2">
                {field.label}
              </label>
              {field.type === 'SELECT' && field.options && (
                <select
                  value={fieldValues.find(f => f.categoryFieldId === field.id)?.value || ''}
                  onChange={(e) => handleCategoryFieldChange(field.id, e.target.value)}
                  className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Any {field.label.toLowerCase()}</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {(field.type === 'TEXT' || field.type === 'NUMBER') && (
                <input
                  type={field.type === 'NUMBER' ? 'number' : 'text'}
                  value={fieldValues.find(f => f.categoryFieldId === field.id)?.value || ''}
                  onChange={(e) => handleCategoryFieldChange(field.id, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              )}
              {field.type === 'RADIO' && field.options && (
                <div className="space-y-2">
                  {field.options.map((option) => (
                    <label key={option.value} className="flex items-center group cursor-pointer">
                      <input
                        type="radio"
                        name={field.id}
                        value={option.value}
                        checked={fieldValues.find(f => f.categoryFieldId === field.id)?.value === option.value}
                        onChange={(e) => handleCategoryFieldChange(field.id, e.target.value)}
                        className="w-4 h-4 text-primary border-border-custom focus:ring-primary"
                      />
                      <span className="ml-2 text-sm text-text-gray group-hover:text-primary transition-colors">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {field.type === 'CHECKBOX' && (
                <label className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldValues.find(f => f.categoryFieldId === field.id)?.value === 'true'}
                    onChange={(e) => handleCategoryFieldChange(field.id, e.target.checked ? 'true' : '')}
                    className="w-4 h-4 text-primary border-border-custom rounded focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-text-gray group-hover:text-primary transition-colors">
                    {field.label}
                  </span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-6 space-y-3">
        <Button onClick={applyFilters} className="w-full py-2.5">
          Apply Filters
        </Button>
        <Button onClick={clearFilters} variant="outline" className="w-full py-2.5">
          Clear All
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 bg-background border-r border-border-custom h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {/* Categories Nav */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-text mb-6">Categories</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 bg-background-primary/30 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : (
              <nav className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-text-gray hover:bg-background-primary hover:text-primary transition-all font-semibold"
                >
                  <span className="text-xl">🏠</span>
                  <span>All Categories</span>
                </Link>
                {categories?.map((category) => (
                  <div key={category.id} className="relative group/sidebar">
                    <Link
                      href={`/category/${category.slug}?categoryId=${category.id}`}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-semibold ${
                        filters.categoryId === category.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-text-gray hover:bg-background-primary hover:text-primary'
                      }`}
                    >
                      <div className="w-10 h-10 bg-background-primary rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        {category.icon ? (
                          <OptimizedImage
                            src={category.icon}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary">{category.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="flex-1 truncate">{category.name}</span>
                      {category.children && category.children.length > 0 && (
                         <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                      )}
                    </Link>

                    {/* Subcategories Flyout */}
                    {category.children && category.children.length > 0 && (
                      <div className="absolute left-[95%] top-0 pl-4 z-50 invisible group-hover/sidebar:visible opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200">
                        <div className="w-72 bg-background shadow-2xl border border-border-custom rounded-3xl p-3 overflow-hidden">
                           <div className="px-4 py-2 border-b border-border-custom mb-2">
                              <p className="text-[10px] font-black text-text-light-gray uppercase tracking-[0.2em]">{category.name}</p>
                           </div>
                           <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
                              {category.children.map((subcat) => (
                                <Link
                                  key={subcat.id}
                                  href={`/category/${subcat.slug}?categoryId=${subcat.id}`}
                                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-text-gray hover:bg-background-primary hover:text-primary rounded-xl transition-all"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                                  {subcat.name}
                                </Link>
                              ))}
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* Filters */}
          <div>
            <h2 className="text-xl font-bold text-text mb-6">Advanced Filters</h2>
            {renderFiltersBody()}
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="fixed left-0 top-0 w-[85%] max-w-sm h-full bg-background shadow-2xl overflow-y-auto flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-border-custom">
              <h2 className="text-xl font-black text-text tracking-tight italic">WILLFINDITT</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-background-primary rounded-xl transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-bold text-text mb-6">Explore & Filter</h3>
              {renderFiltersBody(true)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
