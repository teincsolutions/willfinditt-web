import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  searchAds,
  getUserAds,
  getSavedAds,
  saveAd,
  unsaveAd,
} from '@/services/ads.service';
import {
  AdsListParams,
  CreateAdData,
  UpdateAdData,
  AdSearchRequest,
} from '@/types/ad';

// CRUD Operations
export const useAds = (params: AdsListParams = {}) => {
  return useQuery({
    queryKey: ['ads', params],
    queryFn: () => listAds(params),
  });
};

export const useAd = (id: string) => {
  return useQuery({
    queryKey: ['ad', id],
    queryFn: () => getAd(id),
    enabled: !!id,
  });
};

export const useCreateAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdData) => createAd(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });
};

export const useUpdateAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAdData) => updateAd(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad'] });
    },
  });
};

export const useDeleteAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
  });
};

// Search and Filtering
export const useSearchAds = (searchRequest: AdSearchRequest) => {
  return useQuery({
    queryKey: ['ads', 'search', searchRequest],
    queryFn: () => searchAds(searchRequest),
  });
};

// User-Specific Operations
export const useUserAds = (params: AdsListParams = {}) => {
  return useQuery({
    queryKey: ['ads', 'user', params],
    queryFn: () => getUserAds(params),
  });
};

export const useSavedAds = (params: AdsListParams = {}) => {
  return useQuery({
    queryKey: ['ads', 'saved', params],
    queryFn: () => getSavedAds(params),
  });
};

export const useSaveAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => saveAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', 'saved'] });
    },
  });
};

export const useUnsaveAd = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => unsaveAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads', 'saved'] });
    },
  });
};

// Export all hooks for convenience
export const adsHooks = {
  // CRUD
  useAds,
  useAd,
  useCreateAd,
  useUpdateAd,
  useDeleteAd,

  // Search
  useSearchAds,

  // User operations
  useUserAds,
  useSavedAds,
  useSaveAd,
  useUnsaveAd,
} as const;

// Note: Admin-only endpoints are not included in this frontend hook.
// Admin functionality should be implemented in a separate admin interface
// using the admin service functions directly from '@/services/ads.service'.
// Admin endpoints include: pending ads, approve/reject, admin status updates,
// deleted ads management, and statistics.
//
// Sort options are properly mapped from frontend values to API values:
// - 'newest' -> sortBy: 'createdAt', sortOrder: 'desc'
// - 'oldest' -> sortBy: 'createdAt', sortOrder: 'asc'
// - 'price_low' -> sortBy: 'price', sortOrder: 'asc'
// - 'price_high' -> sortBy: 'price', sortOrder: 'desc'
