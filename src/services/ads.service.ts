import api from './api';
import {
  Ad,
  CreateAdData,
  UpdateAdData,
  AdsListParams,
  AdsResponse,
  AdSearchRequest,
  AdsStatsResponse,
  SuccessResponse,
  UpdateAdStatusData,
} from '@/types/ad';

// CRUD Operations
export const listAds = async (
  params: AdsListParams = {}
): Promise<AdsResponse> => {
  // Handle categoryFields parameter - convert to URL-encoded JSON string
  const apiParams: Record<string, unknown> = { ...params };
  if (params.categoryFields && params.categoryFields.length > 0) {
    apiParams.categoryFields = encodeURIComponent(
      JSON.stringify(params.categoryFields)
    );
  }

  const response = await api.get('/ads', { params: apiParams });
  return response.data;
};

export const getAd = async (id: string): Promise<Ad> => {
  const response = await api.get(`/ads/${id}`);
  return response.data;
};

export const createAd = async (data: CreateAdData): Promise<Ad> => {
  const response = await api.post('/ads', data);
  return response.data;
};

export const updateAd = async (data: UpdateAdData): Promise<Ad> => {
  const { id, ...updateData } = data;
  const response = await api.patch(`/ads/${id}`, updateData);
  return response.data;
};

export const deleteAd = async (id: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/ads/${id}`);
  return response.data;
};

// Search and Filtering
export const searchAds = async (
  searchRequest: AdSearchRequest
): Promise<AdsResponse> => {
  const response = await api.post('/ads/search', searchRequest);
  return response.data;
};

// User-Specific Operations
export const getUserAds = async (
  params: AdsListParams = {}
): Promise<AdsResponse> => {
  const apiParams: Record<string, unknown> = { ...params };
  if (params.categoryFields && params.categoryFields.length > 0) {
    apiParams.categoryFields = encodeURIComponent(
      JSON.stringify(params.categoryFields)
    );
  }

  const response = await api.get('/ads/my-ads', { params: apiParams });
  return response.data;
};

export const getUserAd = async (id: string): Promise<Ad> => {
  const response = await api.get(`/ads/${id}`);
  return response.data;
};

export const getSavedAds = async (
  params: AdsListParams = {}
): Promise<AdsResponse> => {
  const apiParams: Record<string, unknown> = { ...params };
  if (params.categoryFields && params.categoryFields.length > 0) {
    apiParams.categoryFields = encodeURIComponent(
      JSON.stringify(params.categoryFields)
    );
  }

  const response = await api.get('/ads/saved', { params: apiParams });
  return response.data;
};

export const saveAd = async (adId: string): Promise<SuccessResponse> => {
  const response = await api.post(`/ads/${adId}/save`);
  return response.data;
};

export const unsaveAd = async (adId: string): Promise<SuccessResponse> => {
  const response = await api.delete(`/ads/${adId}/save`);
  return response.data;
};

// Admin Operations
export const getAdAdmin = async (id: string): Promise<Ad> => {
  const response = await api.get(`/ads/${id}/admin`);
  return response.data;
};

export const getPendingAds = async (
  params: AdsListParams = {}
): Promise<AdsResponse> => {
  const apiParams: Record<string, unknown> = { ...params };
  if (params.categoryFields && params.categoryFields.length > 0) {
    apiParams.categoryFields = encodeURIComponent(
      JSON.stringify(params.categoryFields)
    );
  }

  const response = await api.get('/ads/admin/pending', { params: apiParams });
  return response.data;
};

export const approveAd = async (id: string): Promise<Ad> => {
  const response = await api.post(`/ads/${id}/admin/approve`);
  return response.data;
};

export const rejectAd = async (id: string): Promise<Ad> => {
  const response = await api.post(`/ads/${id}/admin/reject`);
  return response.data;
};

export const getAllAdsAdmin = async (
  params: AdsListParams = {}
): Promise<AdsResponse> => {
  const apiParams: Record<string, unknown> = { ...params };
  if (params.categoryFields && params.categoryFields.length > 0) {
    apiParams.categoryFields = encodeURIComponent(
      JSON.stringify(params.categoryFields)
    );
  }

  const response = await api.get('/ads/admin/all', { params: apiParams });
  return response.data;
};

export const updateAdStatusAdmin = async (
  id: string,
  statusData: UpdateAdStatusData
): Promise<Ad> => {
  const response = await api.patch(`/ads/${id}/admin/status`, statusData);
  return response.data;
};

export const getDeletedAds = async (
  params: AdsListParams = {}
): Promise<AdsResponse> => {
  const apiParams: Record<string, unknown> = { ...params };
  if (params.categoryFields && params.categoryFields.length > 0) {
    apiParams.categoryFields = encodeURIComponent(
      JSON.stringify(params.categoryFields)
    );
  }

  const response = await api.get('/ads/deleted', { params: apiParams });
  return response.data;
};

export const getDeletedAdById = async (id: string): Promise<Ad> => {
  const response = await api.get(`/ads/deleted/${id}`);
  return response.data;
};

// Statistics
export const getAdsStats = async (): Promise<AdsStatsResponse> => {
  const response = await api.get('/ads/stats/overview');
  return response.data;
};
