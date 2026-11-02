export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  parentId?: string | null;
  parent?: Category | null;
  sortOrder?: number;
  isActive?: boolean;
  children?: Category[];
  totalAdsCount?: number;
  featuredPriceEnabled?: boolean;
  featuredPriceLabel?: string;
  featuredPriceDisplay?: 'chips' | 'buttons' | 'cards';
  featuredPriceOrder?: number;
  featuredPriceBands?: Array<{ label: string; min?: number; max?: number }>;
  fields?: CategoryField[];
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
  options?: Array<{ label: string; value: string; icon?: string }>;
  isRequired: boolean;
  sortOrder?: number;
  showInFeaturedFilters?: boolean;
  featuredDisplay?: 'chips' | 'buttons' | 'cards';
  featuredOrder?: number;
  // Conditional sub-field: shown only when the parent field has this option
  // selected. Only the v2 fields endpoint returns sub-fields (as `children`).
  parentFieldId?: string | null;
  parentOptionValue?: string | null;
  children?: CategoryField[];
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
