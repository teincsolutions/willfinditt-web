import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@/contexts/LocationContext';
import {
  listCategories,
  getCategory,
  getCategoryBySlug,
  getCategoryFields,
  getCategoriesTree,
  getParentCategories,
  getSubcategories,
  getCategoryCounts,
  type CategoryCountsFilters,
} from '@/services/categories.service';

// Get all categories (flat list)
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });
};

// Get single category by ID
export const useCategory = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id),
    enabled: options?.enabled ?? !!id,
  });
};

// Get single category by slug
export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => getCategoryBySlug(slug),
    enabled: !!slug,
  });
};

// Get category fields
export const useCategoryFields = (categoryId: string) => {
  return useQuery({
    queryKey: ['categoryFields', categoryId],
    queryFn: () => getCategoryFields(categoryId),
    enabled: !!categoryId,
  });
};

// Get categories as tree structure (for mega menu navigation)
export const useCategoriesTree = () => {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: getCategoriesTree,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

export interface ParentCategoryOptions {
  /** Attach each root category's children (mega menu, category picker). */
  includeChildren?: boolean;
  /** Attach custom fields. Rarely needed outside the ad form. */
  includeFields?: boolean;
}

/**
 * Root ("main") categories. The `/categories/parents` endpoint is not
 * paginated, so this always returns every top-level category. Pass
 * `{ includeChildren: false, includeFields: false }` for the plain list
 * (no relation joins) - that is all the home page tiles need.
 */
export const useParentCategories = (
  options: boolean | ParentCategoryOptions = true
) => {
  const normalized =
    typeof options === 'boolean' ? { includeChildren: options } : options;
  const includeChildren = normalized.includeChildren ?? true;
  const includeFields = normalized.includeFields ?? false;

  return useQuery({
    queryKey: ['categories', 'parents', { includeChildren, includeFields }],
    queryFn: () => getParentCategories({ includeChildren, includeFields }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

// Get subcategories by parent ID
export const useSubcategories = (parentId: string) => {
  return useQuery({
    queryKey: ['categories', 'subcategories', parentId],
    queryFn: () => getSubcategories(parentId),
    enabled: !!parentId,
  });
};

// Get filter-aware ad counts per category.
// Re-fetches whenever the active filters change (location, price, ...),
// so badges everywhere reflect what search would return.
export const useCategoryCounts = (filters: CategoryCountsFilters = {}) => {
  return useQuery({
    queryKey: ['categories', 'counts', filters],
    queryFn: () => getCategoryCounts(filters),
    staleTime: 60 * 1000, // Cache for 1 minute
  });
};

// Same as useCategoryCounts but defaults the city scope to the user's
// globally selected location (header). Pass an explicit cityId (e.g. from
// the URL) to override it, plus any other active search filters.
export const useLocatedCategoryCounts = (
  filters: CategoryCountsFilters & { cityId?: string } = {}
) => {
  const { selectedCity } = useLocation();
  const { cityId, ...rest } = filters;
  const effectiveCityId = cityId || selectedCity?.id || undefined;
  return useCategoryCounts(
    effectiveCityId ? { ...rest, cityIds: effectiveCityId } : rest
  );
};
