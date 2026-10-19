'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { useLocation } from '@/contexts/LocationContext';
import { useCities, useStates } from '@/hooks/useLocations';
import {
  applyFilterParams,
  emptyFilterValues,
  SearchFilterValues,
  useSearchFilterValues,
} from '@/hooks/useSearchFilterParams';
import { AdCondition } from '@/types/ad';
import { Category, CategoryField, CategoryFieldFilter } from '@/types/category';
import { CategoryPickerModal } from './CategoryPickerModal';

type FieldDraft = string | string[] | { min?: string; max?: string };

interface SearchFiltersPanelProps {
  categoryId: string;
  category?: Category;
  categoryFields?: CategoryField[];
  onCategoryChange: (category: Category | null) => void;
  showSort?: boolean;
  onClose?: () => void;
}

const conditionOptions = [
  { value: AdCondition.NEW, label: 'New' },
  { value: AdCondition.USED, label: 'Used' },
  { value: AdCondition.LIKE_NEW, label: 'Like New' },
  { value: AdCondition.GOOD, label: 'Good' },
  { value: AdCondition.FAIR, label: 'Fair' },
  { value: AdCondition.POOR, label: 'Poor' },
];

const sortOptions = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'views-desc', label: 'Most Popular' },
  { value: 'relevance-desc', label: 'Relevance' },
];

const inputClass =
  'w-full bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium';
const labelClass =
  'block text-sm font-bold text-text-gray mb-2 uppercase tracking-wider';

function fieldToDraft(field: CategoryFieldFilter): FieldDraft {
  if (typeof field.value === 'string') return field.value;
  if (Array.isArray(field.value)) return field.value;
  return {
    min: field.value.min !== undefined ? String(field.value.min) : '',
    max: field.value.max !== undefined ? String(field.value.max) : '',
  };
}

export function SearchFiltersPanel({
  categoryId,
  category,
  categoryFields = [],
  onCategoryChange,
  showSort = false,
  onClose,
}: SearchFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const values = useSearchFilterValues();

  const { countries, selectedCountry, selectedState, selectedCity } =
    useLocation();

  const [minPrice, setMinPrice] = useState(values.minPrice);
  const [maxPrice, setMaxPrice] = useState(values.maxPrice);
  const [condition, setCondition] = useState(values.condition);
  const [stateId, setStateId] = useState(
    values.stateId || selectedState?.id || ''
  );
  const [cityId, setCityId] = useState(values.cityId || selectedCity?.id || '');
  const [cityName, setCityName] = useState(
    values.cityName || selectedCity?.name || ''
  );
  const [fieldValues, setFieldValues] = useState<Map<string, FieldDraft>>(
    new Map()
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const countryId =
    selectedCountry?.id ||
    countries.find((country) => country.code === 'GHA' || country.code === 'GH')
      ?.id;

  const { data: states = [] } = useStates(countryId);
  const { data: cities = [] } = useCities(stateId || undefined);

  // Re-sync the draft whenever the URL changes (apply, reset, pagination).
  useEffect(() => {
    setMinPrice(values.minPrice);
    setMaxPrice(values.maxPrice);
    setCondition(values.condition);
    setStateId(values.stateId || selectedState?.id || '');
    setCityId(values.cityId || selectedCity?.id || '');
    setCityName(values.cityName || selectedCity?.name || '');

    const next = new Map<string, FieldDraft>();
    values.categoryFields.forEach((field) => {
      next.set(field.categoryFieldId, fieldToDraft(field));
    });
    setFieldValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const stateOptions = states;
  const cityOptions = cities;

  const getString = (fieldId: string) => {
    const value = fieldValues.get(fieldId);
    return typeof value === 'string' ? value : '';
  };

  const getRange = (fieldId: string): { min?: string; max?: string } => {
    const value = fieldValues.get(fieldId);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    return { min: '', max: '' };
  };

  const getArray = (fieldId: string): string[] => {
    const value = fieldValues.get(fieldId);
    return Array.isArray(value) ? value : [];
  };

  const setField = (fieldId: string, value: FieldDraft | undefined) => {
    setFieldValues((previous) => {
      const next = new Map(previous);
      if (value === undefined) {
        next.delete(fieldId);
      } else {
        next.set(fieldId, value);
      }
      return next;
    });
  };

  const handleStateChange = (nextStateId: string) => {
    setStateId(nextStateId);
    setCityId('');
    setCityName('');
  };

  const handleCityChange = (nextCityId: string) => {
    setCityId(nextCityId);
    const city = cities.find((item) => item.id === nextCityId);
    setCityName(city?.name || '');
  };

  const handleReset = () => {
    const cleared = emptyFilterValues();
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setStateId('');
    setCityId('');
    setCityName('');
    setFieldValues(new Map());

    const params = applyFilterParams(
      new URLSearchParams(paramsKey),
      cleared
    );
    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  };

  const handleApply = () => {
    const filters: CategoryFieldFilter[] = [];

    // Iterate the draft (seeded from the URL) rather than the fetched field
    // definitions, so applying cannot drop an existing filter while the field
    // definitions are still loading.
    fieldValues.forEach((value, fieldId) => {
      if (typeof value === 'string') {
        if (value.trim() !== '') {
          filters.push({ categoryFieldId: fieldId, value });
        }
        return;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          filters.push({ categoryFieldId: fieldId, value });
        }
        return;
      }

      const min =
        value.min !== undefined && value.min !== ''
          ? Number(value.min)
          : undefined;
      const max =
        value.max !== undefined && value.max !== ''
          ? Number(value.max)
          : undefined;
      if (min !== undefined || max !== undefined) {
        filters.push({ categoryFieldId: fieldId, value: { min, max } });
      }
    });

    const next: SearchFilterValues = {
      cityId,
      cityName,
      stateId,
      minPrice,
      maxPrice,
      condition,
      categoryFields: filters,
    };

    const params = applyFilterParams(new URLSearchParams(paramsKey), next);
    router.push(`${pathname}?${params.toString()}`);
    onClose?.();
  };

  const sortValue =
    `${searchParams.get('sortBy') || 'createdAt'}-${
      searchParams.get('sortOrder') || 'desc'
    }`;

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    const params = new URLSearchParams(paramsKey);
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = Boolean(
    minPrice || maxPrice || condition || cityId || fieldValues.size > 0
  );

  const renderField = (field: CategoryField) => {
    if (field.type === 'SELECT' && field.options) {
      return (
        <div key={field.id}>
          <label className={labelClass}>{field.label}</label>
          <select
            value={getString(field.id)}
            onChange={(event) => setField(field.id, event.target.value)}
            className={inputClass}
          >
            <option value="">Any {field.label}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'RADIO' && field.options) {
      return (
        <div key={field.id}>
          <label className={labelClass}>{field.label}</label>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {field.options.map((option) => {
              const active = getString(field.id) === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setField(field.id, active ? '' : option.value)
                  }
                  className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background hover:bg-background-primary/50 border-border-custom text-text-gray hover:text-text'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.type === 'CHECKBOX' && field.options) {
      return (
        <div key={field.id}>
          <label className={labelClass}>{field.label}</label>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
            {field.options.map((option) => {
              const selected = getArray(field.id);
              const checked = selected.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((value) => value !== option.value);
                      setField(field.id, next.length > 0 ? next : undefined);
                    }}
                    className="w-5 h-5 rounded border-border-custom text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm font-bold text-text-gray">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.type === 'NUMBER') {
      const range = getRange(field.id);
      return (
        <div key={field.id}>
          <label className={labelClass}>{field.label}</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={range.min ?? ''}
              onChange={(event) =>
                setField(field.id, {
                  ...range,
                  min: event.target.value,
                })
              }
              placeholder="Min"
              className={inputClass}
            />
            <input
              type="number"
              value={range.max ?? ''}
              onChange={(event) =>
                setField(field.id, {
                  ...range,
                  max: event.target.value,
                })
              }
              placeholder="Max"
              className={inputClass}
            />
          </div>
        </div>
      );
    }

    if (field.type === 'BOOLEAN') {
      return (
        <div key={field.id}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={getString(field.id) === 'true'}
              onChange={(event) =>
                setField(field.id, event.target.checked ? 'true' : undefined)
              }
              className="w-5 h-5 rounded border-border-custom text-primary focus:ring-primary/20"
            />
            <span className="text-sm font-bold text-text-gray">
              {field.label}
            </span>
          </label>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-background p-6 rounded-2xl shadow-sm border border-border-custom">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-bold text-primary hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Category */}
        <div>
          <label className={labelClass}>Category</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-between gap-3 bg-background-primary/30 border border-border-custom rounded-xl px-4 py-2.5 text-sm font-bold text-left hover:border-primary/40 transition-all"
          >
            <span className="truncate">
              {category
                ? category.parent
                  ? `${category.parent.name} › ${category.name}`
                  : category.name
                : 'All categories'}
            </span>
            <svg
              className="w-4 h-4 text-text-gray flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Location */}
        <div>
          <label className={labelClass}>Location</label>
          <div className="space-y-2">
            <select
              value={stateId}
              onChange={(event) => handleStateChange(event.target.value)}
              className={inputClass}
            >
              <option value="">All regions</option>
              {stateOptions.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <select
              value={cityId}
              onChange={(event) => handleCityChange(event.target.value)}
              className={inputClass}
              disabled={!stateId}
            >
              <option value="">
                {stateId ? 'All cities' : 'Select region first'}
              </option>
              {cityOptions.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>

            {cityId &&
              cityName &&
              !cityOptions.some((city) => city.id === cityId) && (
                <p className="text-xs font-medium text-text-gray">
                  Selected city: {cityName}
                </p>
              )}
          </div>
        </div>

        {/* Dynamic category fields */}
        {categoryId && categoryFields.length > 0 && (
          <div className="space-y-5 pt-5 border-t border-border-custom">
            {categoryFields.map(renderField)}
          </div>
        )}

        {/* Price */}
        <div className="pt-5 border-t border-border-custom">
          <label className={labelClass}>Price Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-gray text-xs font-bold">
                ₵
              </span>
              <input
                type="number"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min"
                className={`${inputClass} pl-7`}
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-gray text-xs font-bold">
                ₵
              </span>
              <input
                type="number"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max"
                className={`${inputClass} pl-7`}
              />
            </div>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className={labelClass}>Item Condition</label>
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className={inputClass}
          >
            <option value="">All Conditions</option>
            {conditionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort (category page) */}
        {showSort && (
          <div>
            <label className={labelClass}>Sort By</label>
            <select
              value={sortValue}
              onChange={(event) => handleSortChange(event.target.value)}
              className={inputClass}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button onClick={handleApply} className="w-full py-3 text-base">
          Apply Filters
        </Button>
      </div>

      <CategoryPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onCategoryChange}
        selectedId={category?.id}
      />
    </div>
  );
}

interface SearchFiltersDrawerProps
  extends Omit<SearchFiltersPanelProps, 'onClose'> {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchFiltersDrawer({
  isOpen,
  onClose,
  ...panelProps
}: SearchFiltersDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-[90%] max-w-sm bg-background shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background flex items-center justify-between p-4 border-b border-border-custom">
          <h2 className="text-lg font-black text-text">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="p-2 rounded-xl hover:bg-background-primary transition-colors text-text-gray"
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
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <SearchFiltersPanel {...panelProps} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
