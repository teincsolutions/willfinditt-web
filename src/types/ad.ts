import { User } from './user';
import { Category, CategoryFieldFilter } from './category';

// Enums matching API documentation
export enum AdStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  DELETED = 'DELETED',
}

export enum AdCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum AdSearchSortBy {
  RELEVANCE = 'relevance',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRICE = 'price',
  VIEWS = 'views',
  DISTANCE = 'distance',
  PROMOTION_PRIORITY = 'promotionPriority',
}

export enum AdSearchSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum AdPromotionFilter {
  ALL = 'all',
  PROMOTED_ONLY = 'promoted_only',
  NON_PROMOTED_ONLY = 'non_promoted_only',
}

export enum AdSearchDateRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom',
}

// Updated interfaces matching API documentation
export interface AdFieldValueDto {
  categoryFieldId: string;
  value: string;
}

export interface NamedAdFieldValueDto {
  fieldName: string;
  value: string | number | boolean | object;
  categoryId?: string;
}

export interface AdFieldValueResponseDto {
  id: string;
  categoryFieldId: string;
  value: string;
  categoryField: {
    id: string;
    name: string;
    label: string;
    type: string;
  };
}

export interface UserSummaryDto {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface CategorySummaryDto {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface LocationDto {
  id: string;
  name: string;
  state: {
    id: string;
    name: string;
    country: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price?: number;
  currency: string;
  condition?: AdCondition;
  images: string[];
  videos: string[];
  status: AdStatus;
  isPromoted: boolean;
  views: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  isNegotiable: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  user: UserSummaryDto;
  category: CategorySummaryDto;
  city?: LocationDto;
  fieldValues: AdFieldValueResponseDto[];
  _count: {
    savedBy: number;
    comments: number;
  };
  isSaved?: boolean;
}

export interface CreateAdData {
  title: string;
  description: string;
  price?: number;
  currency?: string;
  condition?: AdCondition;
  images?: string[];
  videos?: string[];
  status?: AdStatus;
  categoryId: string;
  cityId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  isNegotiable?: boolean;
  expiresAt?: string;
  fieldValues?: AdFieldValueDto[];
  namedFieldValues?: NamedAdFieldValueDto[];
}

export interface UpdateAdData extends Partial<CreateAdData> {
  id: string;
}

export interface AdsListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  cityId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: AdCondition;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: AdStatus;
  categoryFields?: CategoryFieldFilter[];
}

export interface AdSearchParams {
  page?: number;
  limit?: number;
  query?: string;
  categoryIds?: string[];
  cityIds?: string[];
  userId?: string;
  conditions?: AdCondition[];
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  promotionFilter?: 'all' | 'promoted_only' | 'non_promoted_only';
  statuses?: AdStatus[];
  categoryFields?: CategoryFieldFilter[];
  minimal?: boolean; // For lightweight responses
}

export interface AdSearchFacetDto {
  categories?: boolean;
  cities?: boolean;
  conditions?: boolean;
  priceRanges?: boolean;
  promotions?: boolean;
}

export interface AdSearchRequest {
  search: AdSearchParams;
  facets?: AdSearchFacetDto;
}

export interface AdsResponse {
  data: Ad[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  facets?: {
    categories?: Array<{
      id: string;
      name: string;
      count: number;
    }>;
    cities?: Array<{
      id: string;
      name: string;
      count: number;
    }>;
    conditions?: Array<{
      condition: string;
      count: number;
    }>;
    priceRanges?: Array<{
      min: number;
      max: number;
      count: number;
    }>;
    promotions?: {
      promoted: number;
      notPromoted: number;
    };
  };
}

export interface AdsStatsResponse {
  totalAds: number;
  activeAds: number;
  draftAds: number;
  soldAds: number;
  totalViews: number;
  totalSaved: number;
  totalUsers: number;
  avgViewsPerAd: number;
  adsCreatedToday: number;
  adsCreatedThisWeek: number;
  adsCreatedThisMonth: number;
}

export interface SuccessResponse {
  message: string;
}

export interface UpdateAdStatusData {
  status: AdStatus;
}
