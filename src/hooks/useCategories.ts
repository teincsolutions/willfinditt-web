import { useQuery } from '@tanstack/react-query';
import {
  listCategories,
  getCategory,
  getCategoryBySlug,
  getCategoryFields,
  getCategoriesTree,
  getParentCategories,
  getSubcategories,
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

// Get parent categories with children (for navigation bar)
export const useParentCategories = (includeChildren = true) => {
  return useQuery({
    queryKey: ['categories', 'parents', { includeChildren }],
    queryFn: () => getParentCategories({ includeChildren }),
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
