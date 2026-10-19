'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CategoryFieldFilter } from '@/types/category';

export interface SearchFilterValues {
  cityId: string;
  cityName: string;
  stateId: string;
  minPrice: string;
  maxPrice: string;
  condition: string;
  categoryFields: CategoryFieldFilter[];
}

const EMPTY_VALUES: SearchFilterValues = {
  cityId: '',
  cityName: '',
  stateId: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  categoryFields: [],
};

/**
 * Read the dynamic category field filters from the URL
 * (`categoryFields[i][categoryFieldId]`, `[value]`, `[value][min|max]`).
 */
export function parseCategoryFieldFilters(
  params: URLSearchParams
): CategoryFieldFilter[] {
  const fields: CategoryFieldFilter[] = [];

  let i = 0;
  while (true) {
    const fieldId = params.get(`categoryFields[${i}][categoryFieldId]`);
    if (!fieldId) break;

    const value = params.get(`categoryFields[${i}][value]`);
    const minValue = params.get(`categoryFields[${i}][value][min]`);
    const maxValue = params.get(`categoryFields[${i}][value][max]`);

    if (minValue !== null || maxValue !== null) {
      const range: { min?: number; max?: number } = {};
      if (minValue !== null && minValue !== '') range.min = Number(minValue);
      if (maxValue !== null && maxValue !== '') range.max = Number(maxValue);
      fields.push({ categoryFieldId: fieldId, value: range });
    } else if (value) {
      fields.push({
        categoryFieldId: fieldId,
        value: value.includes(',') ? value.split(',') : value,
      });
    }

    i++;
  }

  return fields;
}

export function useSearchFilterValues(): SearchFilterValues {
  const searchParams = useSearchParams();

  return useMemo(
    () => ({
      cityId: searchParams.get('cityId') || '',
      cityName: searchParams.get('cityName') || '',
      stateId: searchParams.get('stateId') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      condition: searchParams.get('condition') || '',
      categoryFields: parseCategoryFieldFilters(
        new URLSearchParams(searchParams.toString())
      ),
    }),
    [searchParams]
  );
}

function removeCategoryFieldParams(params: URLSearchParams) {
  Array.from(params.keys()).forEach((key) => {
    if (key.startsWith('categoryFields')) params.delete(key);
  });
}

/**
 * Apply the sidebar filters to an existing query string. The category is not
 * touched here — it is navigation, handled separately by `withCategoryParam`.
 */
export function applyFilterParams(
  base: URLSearchParams,
  values: SearchFilterValues
): URLSearchParams {
  const params = new URLSearchParams(base.toString());

  ['cityId', 'cityName', 'stateId', 'minPrice', 'maxPrice', 'condition', 'page']
    .forEach((key) => params.delete(key));
  removeCategoryFieldParams(params);

  if (values.cityId) params.set('cityId', values.cityId);
  if (values.cityName) params.set('cityName', values.cityName);
  if (values.stateId) params.set('stateId', values.stateId);
  if (values.minPrice) params.set('minPrice', values.minPrice);
  if (values.maxPrice) params.set('maxPrice', values.maxPrice);
  if (values.condition) params.set('condition', values.condition);

  values.categoryFields.forEach((field, index) => {
    params.set(`categoryFields[${index}][categoryFieldId]`, field.categoryFieldId);

    if (typeof field.value === 'string') {
      params.set(`categoryFields[${index}][value]`, field.value);
    } else if (Array.isArray(field.value)) {
      params.set(`categoryFields[${index}][value]`, field.value.join(','));
    } else {
      if (field.value.min !== undefined) {
        params.set(
          `categoryFields[${index}][value][min]`,
          String(field.value.min)
        );
      }
      if (field.value.max !== undefined) {
        params.set(
          `categoryFields[${index}][value][max]`,
          String(field.value.max)
        );
      }
    }
  });

  return params;
}

/**
 * Change the selected category: resets page + category-field filters (they
 * belong to the previous category) and keeps q/sort/location/price/condition.
 */
export function withCategoryParam(
  base: URLSearchParams,
  categoryId: string | null
): URLSearchParams {
  const params = new URLSearchParams(base.toString());
  if (categoryId) {
    params.set('categoryId', categoryId);
  } else {
    params.delete('categoryId');
  }
  params.delete('page');
  removeCategoryFieldParams(params);
  return params;
}

export function emptyFilterValues(): SearchFilterValues {
  return { ...EMPTY_VALUES, categoryFields: [] };
}

/** Number of active filter inputs (category itself is navigation, not a filter). */
export function countActiveFilters(values: SearchFilterValues): number {
  return (
    (values.cityId ? 1 : 0) +
    (values.minPrice ? 1 : 0) +
    (values.maxPrice ? 1 : 0) +
    (values.condition ? 1 : 0) +
    values.categoryFields.length
  );
}
