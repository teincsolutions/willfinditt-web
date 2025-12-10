export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  parentId?: string;
}

export interface CategoryField {
  id: string;
  categoryId: string;
  name: string;
  label: string;
  type:
    | 'TEXT'
    | 'NUMBER'
    | 'SELECT'
    | 'RADIO'
    | 'CHECKBOX'
    | 'TEXTAREA'
    | 'DATE'
    | 'BOOLEAN';
  options?: string[];
  isRequired: boolean;
}

export interface CategoryFieldFilter {
  fieldName: string;
  value: string;
  categoryId?: string;
}

export interface CategoriesResponse {
  data: Category[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
