import api from './api';

export interface SellerProfile {
  id: string;
  userId: string;
  businessName?: string;
  businessType?: string;
  description?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  rating: number;
  totalReviews: number;
  verified: boolean;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    email?: string;
  };
}

export interface SellerStats {
  sellerId: string;
  totalAds: number;
  activeAds: number;
  soldAds: number;
  totalViews: number;
  totalSaves: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>;
  responseRate?: number;
  averageResponseTime?: string;
  memberSince: string;
  lastActive?: string;
}

export interface MySellerStats {
  totalAds: number;
  activeAds: number;
  soldAds: number;
  pendingAds?: number;
  rejectedAds?: number;
  expiredAds?: number;
  closedAds?: number;
  draftAds?: number;
  suspendedAds?: number;
  totalViews?: number;
  totalSaves?: number;
  averageRating?: number;
  totalReviews?: number;
  approvalRate?: number;
  averageApprovalTime?: number;
}

export const getSellerById = async (id: string): Promise<SellerProfile> => {
  const response = await api.get<SellerProfile>(`/sellers/${id}`);
  return response.data;
};

export const getSellerStats = async (id: string): Promise<SellerStats> => {
  const response = await api.get<SellerStats>(`/sellers/${id}/stats`);
  return response.data;
};

export const getMySellerProfile = async (): Promise<SellerProfile> => {
  const response = await api.get<SellerProfile>('/sellers/my-profile');
  return response.data;
};

export const getMySellerStats = async (): Promise<MySellerStats> => {
  const response = await api.get<MySellerStats>('/sellers/my-stats');
  return response.data;
};
