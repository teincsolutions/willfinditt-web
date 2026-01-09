import { useQuery } from '@tanstack/react-query';
import {
  listCategories,
  getCategory,
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
