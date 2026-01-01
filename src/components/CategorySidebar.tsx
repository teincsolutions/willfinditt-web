'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCategories, useCategoryFields } from '@/hooks/useCategories';
import { OptimizedImage } from './OptimizedImage';
import { CategoryFieldFilter } from '@/types/category';
import { Button } from './Button';

interface CategorySidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const CategorySidebar = ({
  isOpen = false,
  onClose,
}: CategorySidebarProps) => {
  const { data: categoriesResponse, isLoading } = useCategories();
  const categories = categoriesResponse?.data || [];
  const router = useRouter();

  const [filters, setFilters] = useState({
    category: '',
    location: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    negotiable: false,
  });

  const [categoryFieldFilters, setCategoryFieldFilters] = useState<
    CategoryFieldFilter[]
  >([]);

  const { data: categoryFields } = useCategoryFields(filters.category);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      // Clear category field filters when category changes
      if (key === 'category' && value !== prev.category) {
        setCategoryFieldFilters([]);
      }
      return newFilters;
    });
  };

  const handleCategoryFieldChange = (fieldName: string, value: string) => {
    setCategoryFieldFilters((prev) => {
      const existing = prev.find((f) => f.fieldName === fieldName);
      if (existing) {
        return prev.map((f) =>
          f.fieldName === fieldName ? { ...f, value } : f
        );
      } else {
        return [...prev, { fieldName, value }];
      }
    });
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.negotiable) params.set('negotiable', 'true');

    // Add category field filters
    categoryFieldFilters.forEach((filter, index) => {
      if (filter.value) {
        params.set(`categoryFields[${index}][fieldName]`, filter.fieldName);
        params.set(`categoryFields[${index}][value]`, filter.value);
        if (filter.categoryId) {
          params.set(`categoryFields[${index}][categoryId]`, filter.categoryId);
        }
      }
    });

    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      negotiable: false,
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 bg-background border-r border-border-custom h-screen sticky top-0 overflow-y-auto">
        <div className="p-6">
          {/* Categories Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text mb-4">
              Categories
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-background-primary/30 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <nav className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-text-gray hover:bg-background-primary hover:text-primary transition-colors"
                  >
                    <span className="text-lg">🏠</span>
                    <span className="font-medium">All Categories</span>
                  </Link>

                  {categories?.map((category) => (
                    <div key={category.id} className="relative group/sidebar">
                      <Link
                        href={`/category/${category.slug}`}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-text-gray hover:bg-background-primary hover:text-primary transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 bg-background-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm overflow-hidden">
                          {category.icon ? (
                            <OptimizedImage
                              src={category.icon}
                              alt=""
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-bold text-sm">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-sm flex-1">{category.name}</span>
                        {category.children && category.children.length > 0 && (
                          <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-text-light-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </Link>

                      {/* Subcategory Flyout */}
                      {category.children && category.children.length > 0 && (
                        <div className="absolute left-[95%] top-0 pl-3 z-50 invisible group-hover/sidebar:visible opacity-0 group-hover/sidebar:opacity-100 transition-all duration-200 translate-x-1 group-hover/sidebar:translate-x-0">
                          <div className="w-64 bg-background shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-border-custom rounded-2xl py-3 overflow-hidden">
                            <div className="px-4 py-2 border-b border-border-custom mb-2">
                                <p className="text-[10px] font-bold text-text-light-gray uppercase tracking-widest">{category.name}</p>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {category.children.map((subcat) => (
                                  <Link
                                    key={subcat.id}
                                    href={`/category/${subcat.slug}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-gray hover:bg-background-primary hover:text-primary transition-colors"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
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

          {/* Filters Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-text mb-4">
              Filters
            </h2>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange('category', e.target.value)
                  }
                  className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) =>
                    handleFilterChange('location', e.target.value)
                  }
                  placeholder="Enter city or region"
                  className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Price Range
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      handleFilterChange('minPrice', e.target.value)
                    }
                    placeholder="Min price"
                    className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      handleFilterChange('maxPrice', e.target.value)
                    }
                    placeholder="Max price"
                    className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Condition
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="condition"
                      value=""
                      checked={filters.condition === ''}
                      onChange={(e) =>
                        handleFilterChange('condition', e.target.value)
                      }
                      className="text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-text">Any</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="condition"
                      value="new"
                      checked={filters.condition === 'new'}
                      onChange={(e) =>
                        handleFilterChange('condition', e.target.value)
                      }
                      className="text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-text">New</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="condition"
                      value="used"
                      checked={filters.condition === 'used'}
                      onChange={(e) =>
                        handleFilterChange('condition', e.target.value)
                      }
                      className="text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-text">Used</span>
                  </label>
                </div>
              </div>

              {/* Negotiable Checkbox */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.negotiable}
                    onChange={(e) =>
                      handleFilterChange('negotiable', e.target.checked)
                    }
                    className="text-primary focus:ring-primary rounded"
                  />
                  <span className="ml-2 text-sm text-text">
                    Negotiable price
                  </span>
                </label>
              </div>

              {/* Dynamic Category Fields */}
              {categoryFields && categoryFields.length > 0 && (
                <div className="border-t border-border-custom pt-4">
                  <h3 className="text-sm font-medium text-text mb-3">
                    {categories?.find((c) => c.slug === filters.category)?.name}{' '}
                    Filters
                  </h3>
                  <div className="space-y-4">
                    {categoryFields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-sm font-medium text-text mb-2">
                          {field.label}
                        </label>
                        {field.type === 'SELECT' && field.options && (
                          <select
                            onChange={(e) =>
                              handleCategoryFieldChange(
                                field.name,
                                e.target.value
                              )
                            }
                            className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          >
                            <option value="">
                              Any {field.label.toLowerCase()}
                            </option>
                            {field.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                        {field.type === 'TEXT' && (
                          <input
                            type="text"
                            onChange={(e) =>
                              handleCategoryFieldChange(
                                field.name,
                                e.target.value
                              )
                            }
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        )}
                        {field.type === 'NUMBER' && (
                          <input
                            type="number"
                            onChange={(e) =>
                              handleCategoryFieldChange(
                                field.name,
                                e.target.value
                              )
                            }
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                          />
                        )}
                        {field.type === 'RADIO' && field.options && (
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name={field.name}
                                value=""
                                onChange={(e) =>
                                  handleCategoryFieldChange(
                                    field.name,
                                    e.target.value
                                  )
                                }
                                className="text-primary focus:ring-primary"
                              />
                              <span className="ml-2 text-sm text-text">
                                Any
                              </span>
                            </label>
                            {field.options.map((option) => (
                              <label key={option.value} className="flex items-center">
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={option.value}
                                  onChange={(e) =>
                                    handleCategoryFieldChange(
                                      field.name,
                                      e.target.value
                                    )
                                  }
                                  className="text-primary focus:ring-primary"
                                />
                                <span className="ml-2 text-sm text-text">
                                  {option.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                        {field.type === 'CHECKBOX' && (
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              onChange={(e) =>
                                handleCategoryFieldChange(
                                  field.name,
                                  e.target.checked ? 'true' : ''
                                )
                              }
                              className="text-primary focus:ring-primary rounded"
                            />
                            <span className="ml-2 text-sm text-text">
                              {field.label}
                            </span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Actions */}
              <div className="space-y-2">
                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
                </Button>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          <aside className="fixed left-0 top-0 w-80 h-full bg-background shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text">Menu</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Categories Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text mb-4">
                  Categories
                </h3>

                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 bg-background-primary/30 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <nav className="space-y-2">
                    <Link
                      href="/"
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-text-gray hover:bg-background-primary hover:text-primary transition-colors"
                      onClick={onClose}
                    >
                      <span className="text-lg">🏠</span>
                      <span className="font-medium">All Categories</span>
                    </Link>

                    {categories?.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg text-text-gray hover:bg-background-primary hover:text-primary transition-colors group"
                        onClick={onClose}
                      >
                        <div className="w-8 h-8 bg-background-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm overflow-hidden text-primary">
                          {category.icon ? (
                            <OptimizedImage
                              src={category.icon}
                              alt=""
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-sm">
                              {category.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </Link>
                    ))}
                  </nav>
                )}
              </div>

              {/* Filters Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text mb-4">
                  Filters
                </h3>

                <div className="space-y-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange('category', e.target.value)
                      }
                      className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      {categories?.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) =>
                        handleFilterChange('location', e.target.value)
                      }
                      placeholder="Enter city or region"
                      className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Price Range
                    </label>
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange('minPrice', e.target.value)
                        }
                        placeholder="Min price"
                        className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                      <input
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange('maxPrice', e.target.value)
                        }
                        placeholder="Max price"
                        className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Condition Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Condition
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="condition"
                          value=""
                          checked={filters.condition === ''}
                          onChange={(e) =>
                            handleFilterChange('condition', e.target.value)
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-text">Any</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="condition"
                          value="new"
                          checked={filters.condition === 'new'}
                          onChange={(e) =>
                            handleFilterChange('condition', e.target.value)
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-text">New</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="condition"
                          value="used"
                          checked={filters.condition === 'used'}
                          onChange={(e) =>
                            handleFilterChange('condition', e.target.value)
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-sm text-text">Used</span>
                      </label>
                    </div>
                  </div>

                  {/* Negotiable Checkbox */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.negotiable}
                        onChange={(e) =>
                          handleFilterChange('negotiable', e.target.checked)
                        }
                        className="text-primary focus:ring-primary rounded"
                      />
                      <span className="ml-2 text-sm text-text">
                        Negotiable price
                      </span>
                    </label>
                  </div>

                  {/* Dynamic Category Fields */}
                  {categoryFields && categoryFields.length > 0 && (
                    <div className="border-t border-border-custom pt-4">
                      <h4 className="text-sm font-medium text-text mb-3">
                        {
                          categories?.find((c) => c.slug === filters.category)
                            ?.name
                        }{' '}
                        Filters
                      </h4>
                      <div className="space-y-4">
                        {categoryFields.map((field) => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-text mb-2">
                              {field.label}
                            </label>
                            {field.type === 'SELECT' && field.options && (
                              <select
                                onChange={(e) =>
                                  handleCategoryFieldChange(
                                    field.name,
                                    e.target.value
                                  )
                                }
                                className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              >
                                <option value="">
                                  Any {field.label.toLowerCase()}
                                </option>
                                {field.options.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {field.type === 'TEXT' && (
                              <input
                                type="text"
                                onChange={(e) =>
                                  handleCategoryFieldChange(
                                    field.name,
                                    e.target.value
                                  )
                                }
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              />
                            )}
                            {field.type === 'NUMBER' && (
                              <input
                                type="number"
                                onChange={(e) =>
                                  handleCategoryFieldChange(
                                    field.name,
                                    e.target.value
                                  )
                                }
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                                className="w-full border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                              />
                            )}
                            {field.type === 'RADIO' && field.options && (
                              <div className="space-y-2">
                                <label className="flex items-center">
                                  <input
                                    type="radio"
                                    name={field.name}
                                    value=""
                                    onChange={(e) =>
                                      handleCategoryFieldChange(
                                        field.name,
                                        e.target.value
                                      )
                                    }
                                    className="text-primary focus:ring-primary"
                                  />
                                  <span className="ml-2 text-sm text-text">
                                    Any
                                  </span>
                                </label>
                                {field.options.map((option) => (
                                  <label
                                    key={option.value}
                                    className="flex items-center"
                                  >
                                    <input
                                      type="radio"
                                      name={field.name}
                                      value={option.value}
                                      onChange={(e) =>
                                        handleCategoryFieldChange(
                                          field.name,
                                          e.target.value
                                        )
                                      }
                                      className="text-primary focus:ring-primary"
                                    />
                                    <span className="ml-2 text-sm text-text">
                                      {option.label}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {field.type === 'CHECKBOX' && (
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  onChange={(e) =>
                                    handleCategoryFieldChange(
                                      field.name,
                                      e.target.checked ? 'true' : ''
                                    )
                                  }
                                  className="text-primary focus:ring-primary rounded"
                                />
                                <span className="ml-2 text-sm text-text">
                                  {field.label}
                                </span>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter Actions */}
                  <div className="space-y-2">
                    <Button onClick={applyFilters} className="w-full">
                      Apply Filters
                    </Button>
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="w-full"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
