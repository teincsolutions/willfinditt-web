import { useQuery } from '@tanstack/react-query';
import {
  listCategories,
  getCategory,
  getCategoryFields,
} from '@/services/categories.service';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });
};

export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => getCategory(id),
    enabled: !!id,
  });
};

export const useCategoryFields = (categoryId: string) => {
  return useQuery({
    queryKey: ['categoryFields', categoryId],
    queryFn: () => getCategoryFields(categoryId),
    enabled: !!categoryId,
  });
};
