import api from './api';
import {
  Category,
  CategoryField,
  CategoriesResponse,
  CategoryTreeResponse,
} from '@/types/category';

interface ParentCategoriesParams {
  includeFields?: boolean;
  includeChildren?: boolean;
  includeInactive?: boolean;
}

// List all categories (flat)
export const listCategories = async (): Promise<CategoriesResponse> => {
  const response = await api.get('/categories');
  return response.data;
};

// Get category by ID
export const getCategory = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Get category by slug
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const response = await api.get(`/categories/slug/${slug}`);
  return response.data;
};

// Get categories as tree structure (for mega menu)
export const getCategoriesTree = async (): Promise<Category[]> => {
  const response = await api.get('/categories/tree');
  return response.data.data || response.data || [];
};

// Get parent categories only (top-level for navigation)
export const getParentCategories = async (
  params: ParentCategoriesParams = {}
): Promise<Category[]> => {
  const response = await api.get('/categories/parents', {
    params: {
      includeFields: params.includeFields ?? false,
      includeChildren: params.includeChildren ?? true,
      includeInactive: params.includeInactive ?? false,
    },
  });
  return response.data.data || response.data || [];
};

// Get subcategories by parent ID
export const getSubcategories = async (parentId: string): Promise<Category[]> => {
  const response = await api.get(`/categories/subcategories/${parentId}`);
  return response.data.data || response.data || [];
};

// Get category fields for a category
export const getCategoryFields = async (
  categoryId: string
): Promise<CategoryField[]> => {
  const response = await api.get(`/category-fields/category/${categoryId}`);
  return response.data.data || response.data || [];
};

const API_V2_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(
  /\/v1\/?$/,
  '/v2'
);

// Get category fields as a tree (v2): conditional sub-fields are nested under
// their parent field in `children`.
export const getCategoryFieldTree = async (
  categoryId: string
): Promise<CategoryField[]> => {
  const response = await api.get(`/category-fields/category/${categoryId}`, {
    baseURL: API_V2_BASE,
  });
  return response.data.data || response.data || [];
};

export interface CategoryCountsFilters {
  cityIds?: string;
  priceMin?: number;
  priceMax?: number;
  conditions?: string;
  query?: string;
  promotedOnly?: boolean;
}

// Get filter-aware ad counts per category (visible ads only).
// Omit a filter to count across it; omit all filters for global totals.
export const getCategoryCounts = async (
  filters: CategoryCountsFilters = {}
): Promise<Record<string, number>> => {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value;
    }
  });
  const response = await api.get('/categories/counts', { params });
  return response.data.counts || {};
};
