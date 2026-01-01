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
