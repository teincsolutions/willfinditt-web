export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  children?: Category[];
  _count?: {
    ads?: number;
    children?: number;
  };
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
  options?: Array<{ label: string; value: string }>;
  isRequired: boolean;
  sortOrder?: number;
}

export interface CategoryFieldFilter {
  categoryFieldId: string;
  value: string | string[] | { min?: number; max?: number };
  fieldName?: string; // Optional for backward compatibility during transition
}

export interface CategoriesResponse {
  data: Category[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryTreeResponse {
  data: Category[];
}
