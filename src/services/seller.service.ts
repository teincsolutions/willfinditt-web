import api from './api';

export interface SellerSocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

export interface CreateSellerProfileRequest {
  businessName: string;
  businessType: string;
  description?: string;
  website?: string;
  socialMedia?: SellerSocialMedia;
}

export type UpdateSellerProfileRequest = Partial<CreateSellerProfileRequest>;

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
  isVerified: boolean;
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

export type SellerVerificationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface SellerVerificationMedia {
  url: string;
  thumbnail?: string;
}

export interface SellerVerification {
  id: string;
  sellerProfileId: string;
  status: SellerVerificationStatus;
  documentType: 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT';
  documentNumber: string;
  fullName?: string;
  documentIssueDate?: string;
  documentExpiryDate?: string;
  address: string;
  documents?: SellerVerificationMedia[];
  facePhoto?: SellerVerificationMedia[];
  additionalNotes?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitSellerVerificationRequest {
  sellerProfileId: string;
  documentType: 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT';
  documentNumber: string;
  fullName?: string;
  documentIssueDate?: string;
  documentExpiryDate?: string;
  address: string;
  documents?: string[];
  facePhoto: string[];
  additionalNotes?: string;
}

export type UpdateSellerVerificationRequest = Partial<
  Omit<SubmitSellerVerificationRequest, 'sellerProfileId'>
>;

export const getSellerById = async (id: string): Promise<SellerProfile> => {
  const response = await api.get<SellerProfile>(`/sellers/${id}`);
  return response.data;
};

export const createSellerProfile = async (
  data: CreateSellerProfileRequest
): Promise<SellerProfile> => {
  const response = await api.post<SellerProfile>('/sellers', data);
  return response.data;
};

export const updateSellerProfile = async (
  sellerId: string,
  data: UpdateSellerProfileRequest
): Promise<SellerProfile> => {
  const response = await api.patch<SellerProfile>(`/sellers/${sellerId}`, data);
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

export const getMyVerification = async (): Promise<SellerVerification> => {
  const response = await api.get<SellerVerification>(
    '/seller-verification/my-verification'
  );
  return response.data;
};

export const submitVerification = async (
  data: SubmitSellerVerificationRequest
): Promise<SellerVerification> => {
  const response = await api.post<SellerVerification>('/seller-verification', data);
  return response.data;
};

export const updateMyVerification = async (
  verificationId: string,
  data: UpdateSellerVerificationRequest
): Promise<SellerVerification> => {
  const response = await api.patch<SellerVerification>(
    `/seller-verification/${verificationId}`,
    data
  );
  return response.data;
};
