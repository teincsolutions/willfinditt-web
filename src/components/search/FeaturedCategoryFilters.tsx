'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { OptimizedImage } from '@/components/OptimizedImage';
import {
  applyFilterParams,
  useSearchFilterValues,
} from '@/hooks/useSearchFilterParams';
import { Category, CategoryField, CategoryFieldFilter } from '@/types/category';

interface FeaturedCategoryFiltersProps {
  category?: Category;
  fields?: CategoryField[];
  className?: string;
}

type PriceBand = { label: string; min?: number; max?: number };

type FeaturedItem =
  | {
      kind: 'price';
      id: string;
      order: number;
      label: string;
      display: 'chips' | 'buttons' | 'cards';
      bands: PriceBand[];
    }
  | {
      kind: 'field';
      id: string;
      order: number;
      sortOrder: number;
      label: string;
      display: 'chips' | 'buttons' | 'cards';
      field: CategoryField;
    };

const ELIGIBLE_TYPES = ['SELECT', 'CHECKBOX'];

function isRangeValue(
  value: CategoryFieldFilter['value']
): value is { min?: number; max?: number } {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value)
  );
}

function getSelectedValues(
  fields: CategoryFieldFilter[],
  fieldId: string
): string[] {
  const filter = fields.find((item) => item.categoryFieldId === fieldId);
  if (!filter) return [];
  if (typeof filter.value === 'string') return [filter.value];
  if (Array.isArray(filter.value)) return filter.value;
  return [];
}

function upsertField(
  fields: CategoryFieldFilter[],
  fieldId: string,
  value: string | string[] | null
): CategoryFieldFilter[] {
  const withoutField = fields.filter(
    (item) => item.categoryFieldId !== fieldId
  );
  if (
    value === null ||
    (Array.isArray(value) && value.length === 0) ||
    value === ''
  ) {
    return withoutField;
  }
  return [...withoutField, { categoryFieldId: fieldId, value }];
}

function Monogram({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-black text-sm">
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

export function FeaturedCategoryFilters({
  category,
  fields = [],
  className = '',
}: FeaturedCategoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const values = useSearchFilterValues();

  // A child category without its own price config inherits its parent's,
  // matching the category-field fallback used by the API.
  const priceCategory = category?.featuredPriceEnabled
    ? category
    : category?.parent?.featuredPriceEnabled
      ? category.parent
      : null;

  const items = useMemo<FeaturedItem[]>(() => {
    const next: FeaturedItem[] = [];

    const bands = Array.isArray(priceCategory?.featuredPriceBands)
      ? priceCategory!.featuredPriceBands!.filter(
          (band) => band && typeof band.label === 'string' && band.label.trim()
        )
      : [];

    if (priceCategory && bands.length > 0) {
      next.push({
        kind: 'price',
        id: 'price',
        order: priceCategory.featuredPriceOrder ?? 0,
        label: priceCategory.featuredPriceLabel || 'Price',
        display: priceCategory.featuredPriceDisplay || 'buttons',
        bands,
      });
    }

    fields
      .filter(
        (field) =>
          field.showInFeaturedFilters &&
          ELIGIBLE_TYPES.includes(field.type) &&
          Array.isArray(field.options) &&
          field.options.length > 0
      )
      .forEach((field) => {
        next.push({
          kind: 'field',
          id: field.id,
          order: field.featuredOrder ?? 0,
          sortOrder: field.sortOrder ?? 0,
          label: field.label,
          display: field.featuredDisplay || 'chips',
          field,
        });
      });

    return next.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      // Deterministic tie-break: price group first, then regular field order.
      if (a.kind !== b.kind) return a.kind === 'price' ? -1 : 1;
      const aSort = a.kind === 'field' ? a.sortOrder : 0;
      const bSort = b.kind === 'field' ? b.sortOrder : 0;
      if (aSort !== bSort) return aSort - bSort;
      return a.id.localeCompare(b.id);
    });
  }, [fields, priceCategory]);

  if (items.length === 0) return null;

  const pushFilters = (next: {
    minPrice?: string;
    maxPrice?: string;
    categoryFields?: CategoryFieldFilter[];
  }) => {
    const params = applyFilterParams(new URLSearchParams(searchParams.toString()), {
      ...values,
      ...next,
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const selectedPriceBand = (band: PriceBand) =>
    (values.minPrice || '') === String(band.min ?? '') &&
    (values.maxPrice || '') === String(band.max ?? '');

  const handlePriceSelect = (band: PriceBand) => {
    if (selectedPriceBand(band)) {
      pushFilters({ minPrice: '', maxPrice: '' });
      return;
    }
    pushFilters({
      minPrice: band.min !== undefined ? String(band.min) : '',
      maxPrice: band.max !== undefined ? String(band.max) : '',
    });
  };

  const handleFieldSelect = (field: CategoryField, value: string) => {
    const selected = getSelectedValues(values.categoryFields, field.id);

    if (field.type === 'CHECKBOX') {
      const next = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
      pushFilters({ categoryFields: upsertField(values.categoryFields, field.id, next) });
      return;
    }

    const next = selected[0] === value ? null : value;
    pushFilters({ categoryFields: upsertField(values.categoryFields, field.id, next) });
  };

  const renderFieldOptions = (item: FeaturedItem) => {
    if (item.kind === 'price') {
      return item.bands.map((band) => (
        <OptionButton
          key={`${band.label}-${band.min ?? ''}-${band.max ?? ''}`}
          display={item.display}
          selected={selectedPriceBand(band)}
          label={band.label}
          onClick={() => handlePriceSelect(band)}
        />
      ));
    }

    const selected = getSelectedValues(values.categoryFields, item.field.id);
    return item.field.options!.map((option) => (
      <OptionButton
        key={option.value}
        display={item.display}
        selected={selected.includes(option.value)}
        label={option.label}
        icon={option.icon}
        onClick={() => handleFieldSelect(item.field, option.value)}
      />
    ));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item) => {
        const hasSelection =
          item.kind === 'price'
            ? Boolean(values.minPrice || values.maxPrice)
            : getSelectedValues(values.categoryFields, item.field.id).length > 0;

        return (
          <section key={`${item.kind}-${item.id}`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-black text-text uppercase tracking-wider">
                {item.label}
              </h3>
              {hasSelection && (
                <button
                  type="button"
                  className="text-xs font-bold text-primary hover:underline"
                  onClick={() =>
                    item.kind === 'price'
                      ? pushFilters({ minPrice: '', maxPrice: '' })
                      : pushFilters({
                          categoryFields: upsertField(
                            values.categoryFields,
                            item.field.id,
                            null
                          ),
                        })
                  }
                >
                  Clear
                </button>
              )}
            </div>

            <div
              className={
                item.display === 'chips'
                  ? 'flex flex-wrap gap-2'
                  : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
              }
            >
              {renderFieldOptions(item)}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface OptionButtonProps {
  display: 'chips' | 'buttons' | 'cards';
  selected: boolean;
  label: string;
  icon?: string;
  onClick: () => void;
}

function OptionButton({
  display,
  selected,
  label,
  icon,
  onClick,
}: OptionButtonProps) {
  const base =
    'transition-all border text-left disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/30';

  if (display === 'chips') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${base} inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${
          selected
            ? 'bg-primary text-white border-primary shadow-md'
            : 'bg-background-primary text-text-gray border-border-custom hover:border-primary/40 hover:text-primary'
        }`}
      >
        {icon && <OptionIcon icon={icon} label={label} size={18} />}
        {label}
      </button>
    );
  }

  if (display === 'cards') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={`${base} flex flex-col items-center justify-center gap-2 p-4 rounded-2xl ${
          selected
            ? 'bg-primary/10 border-primary shadow-sm'
            : 'bg-background border-border-custom hover:border-primary/40'
        }`}
      >
        {icon ? (
          <OptionIcon icon={icon} label={label} size={44} />
        ) : (
          <Monogram label={label} />
        )}
        <span className="text-xs font-bold text-text text-center">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${base} flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${
        selected
          ? 'bg-primary text-white border-primary shadow-md'
          : 'bg-background border-border-custom text-text-gray hover:border-primary/40 hover:text-primary'
      }`}
    >
      {icon && <OptionIcon icon={icon} label={label} size={24} />}
      {label}
    </button>
  );
}

function OptionIcon({
  icon,
  label,
  size,
}: {
  icon: string;
  label: string;
  size: number;
}) {
  return (
    <span
      className="relative inline-flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <OptimizedImage
        src={icon}
        alt={label}
        width={size}
        height={size}
        className="object-contain"
        containerClassName="!bg-transparent rounded-md"
      />
    </span>
  );
}
