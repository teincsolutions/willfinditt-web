import api from './api';
import { Category, CategoryField, CategoriesResponse } from '@/types/category';

export const listCategories = async (): Promise<CategoriesResponse> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategory = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

export const getCategoryFields = async (
  categoryId: string
): Promise<CategoryField[]> => {
  const response = await api.get(`/categories/${categoryId}/fields`);
  return response.data.data || response.data || [];
};
