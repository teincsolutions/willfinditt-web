'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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

type Display = 'chips' | 'buttons' | 'cards';

type FeaturedItem =
  | {
      kind: 'price';
      id: string;
      order: number;
      label: string;
      display: Display;
      bands: PriceBand[];
    }
  | {
      kind: 'field';
      id: string;
      order: number;
      sortOrder: number;
      label: string;
      display: Display;
      field: CategoryField;
    };

interface FeaturedOption {
  key: string;
  label: string;
  icon?: string;
  selected: boolean;
  /** Single-select groups close the dialog as soon as an option is picked. */
  closeOnSelect: boolean;
  onSelect: () => void;
}

const ELIGIBLE_TYPES = ['SELECT', 'CHECKBOX'];

/**
 * Featured groups are capped to two rows. Anything past that lives behind a
 * "View more" dialog - categories can expose dozens of options (brands,
 * models, ...) and rendering them inline used to dump a wall of chips/cards
 * into the page.
 */
const MAX_ROWS = 2;

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

/**
 * Measures how many options fit in the first two rows of the rendered grid and
 * clips the container at the third row. Rows are derived from the children's
 * real offsets, so it works for chips (flex-wrap) and for cards/buttons
 * (responsive grid) without hard-coding row heights.
 */
function useTwoRowClamp(itemCount: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [clamp, setClamp] = useState<{
    maxHeight: number;
    hidden: number;
  } | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) {
      setClamp(null);
      return;
    }

    const rowTops = Array.from(
      new Set(children.map((child) => Math.round(child.offsetTop)))
    ).sort((a, b) => a - b);

    if (rowTops.length <= MAX_ROWS) {
      setClamp(null);
      return;
    }

    const maxHeight = rowTops[MAX_ROWS] - rowTops[0];
    const hidden = children.filter(
      (child) => Math.round(child.offsetTop) >= rowTops[MAX_ROWS]
    ).length;

    if (maxHeight <= 0 || hidden === 0) {
      setClamp(null);
      return;
    }

    setClamp((previous) =>
      previous &&
      previous.maxHeight === maxHeight &&
      previous.hidden === hidden
        ? previous
        : { maxHeight, hidden }
    );
  }, []);

  useIsomorphicLayoutEffect(() => {
    measure();
  }, [measure, itemCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    Array.from(container.children).forEach((child) => observer.observe(child));
    window.addEventListener('resize', schedule);

    // Web fonts can change a row's height after the first paint.
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(schedule).catch(() => {});
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [measure, itemCount]);

  return { containerRef, clamp };
}

function Monogram({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary font-black text-sm">
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

function optionGridClass(display: Display, inDialog = false) {
  if (display === 'chips') return 'flex flex-wrap gap-2';
  return `grid grid-cols-2 ${
    inDialog ? 'sm:grid-cols-3' : 'sm:grid-cols-3 lg:grid-cols-4'
  } gap-3`;
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

  const buildOptions = (item: FeaturedItem): FeaturedOption[] => {
    if (item.kind === 'price') {
      return item.bands.map((band) => ({
        key: `${band.label}-${band.min ?? ''}-${band.max ?? ''}`,
        label: band.label,
        selected: selectedPriceBand(band),
        closeOnSelect: true,
        onSelect: () => handlePriceSelect(band),
      }));
    }

    const selected = getSelectedValues(values.categoryFields, item.field.id);
    return (item.field.options ?? []).map((option) => ({
      key: option.value,
      label: option.label,
      icon: option.icon,
      selected: selected.includes(option.value),
      closeOnSelect: item.field.type !== 'CHECKBOX',
      onSelect: () => handleFieldSelect(item.field, option.value),
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item) => {
        const options = buildOptions(item);
        const hasSelection =
          item.kind === 'price'
            ? Boolean(values.minPrice || values.maxPrice)
            : getSelectedValues(values.categoryFields, item.field.id).length > 0;

        return (
          <FeaturedSection
            key={`${item.kind}-${item.id}`}
            id={`featured-${item.kind}-${item.id}`}
            title={item.label}
            display={item.display}
            options={options}
            hasSelection={hasSelection}
            onClear={() =>
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
          />
        );
      })}
    </div>
  );
}

interface FeaturedSectionProps {
  id: string;
  title: string;
  display: Display;
  options: FeaturedOption[];
  hasSelection: boolean;
  onClear: () => void;
}

function FeaturedSection({
  id,
  title,
  display,
  options,
  hasSelection,
  onClear,
}: FeaturedSectionProps) {
  const { containerRef, clamp } = useTwoRowClamp(options.length);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section aria-labelledby={`${id}-label`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3
          id={`${id}-label`}
          className="text-sm font-black text-text uppercase tracking-wider"
        >
          {title}
        </h3>
        {hasSelection && (
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        className={optionGridClass(display)}
        style={clamp ? { maxHeight: clamp.maxHeight, overflow: 'hidden' } : undefined}
      >
        {options.map((option) => (
          <OptionButton
            key={option.key}
            display={display}
            selected={option.selected}
            label={option.label}
            icon={option.icon}
            onClick={option.onSelect}
          />
        ))}
      </div>

      {clamp && (
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={dialogOpen}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border-custom bg-background-primary/40 text-xs font-black uppercase tracking-wider text-primary transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          View more
          <span className="font-bold normal-case tracking-normal text-text-light-gray">
            ({clamp.hidden} more)
          </span>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      <FeaturedOptionsDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={title}
        display={display}
        options={options}
        onClear={onClear}
      />
    </section>
  );
}

interface FeaturedOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  display: Display;
  options: FeaturedOption[];
  onClear: () => void;
}

function FeaturedOptionsDialog({
  isOpen,
  onClose,
  title,
  display,
  options,
  onClear,
}: FeaturedOptionsDialogProps) {
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  // The dialog only opens after a user interaction, so there is no SSR/hydration
  // pass to guard against (unlike a modal that can render open on first paint).
  const close = () => {
    setQuery('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQuery('');
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = normalizedQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery)
      )
    : options;
  const selectedCount = options.filter((option) => option.selected).length;
  const showSearch = options.length > 12;

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border-custom bg-background shadow-2xl outline-none sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-custom p-5">
          <div>
            <h2 id={titleId} className="text-xl font-black text-text">
              {title}
            </h2>
            <p className="text-sm font-medium text-text-gray">
              {options.length} option{options.length === 1 ? '' : 's'}
              {selectedCount > 0 ? ` · ${selectedCount} selected` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="p-2 -mr-1 rounded-xl text-text-gray transition-colors hover:bg-background-primary"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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

        {showSearch && (
          <div className="border-b border-border-custom p-4">
            <label htmlFor={`${titleId}-search`} className="sr-only">
              Search {title}
            </label>
            <input
              id={`${titleId}-search`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full rounded-xl border border-border-custom bg-background-primary px-4 py-2.5 text-sm font-medium text-text placeholder-placeholder focus:border-primary focus:outline-none"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {visibleOptions.length > 0 ? (
            <div className={optionGridClass(display, true)}>
              {visibleOptions.map((option) => (
                <OptionButton
                  key={option.key}
                  display={display}
                  selected={option.selected}
                  label={option.label}
                  icon={option.icon}
                  onClick={() => {
                    option.onSelect();
                    if (option.closeOnSelect) close();
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm font-medium text-text-gray">
              No options match “{query.trim()}”.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-custom p-4">
          <button
            type="button"
            onClick={() => {
              onClear();
              close();
            }}
            disabled={selectedCount === 0}
            className="text-xs font-bold text-text-gray transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface OptionButtonProps {
  display: Display;
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
        <span className="min-w-0 break-words">{label}</span>
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
        <span className="text-xs font-bold text-text text-center break-words min-w-0">
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
      <span className="min-w-0 break-words">{label}</span>
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
