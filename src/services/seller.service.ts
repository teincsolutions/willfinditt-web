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
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export type VerificationType = 'INDIVIDUAL' | 'BUSINESS';

export type BusinessDocumentType =
  | 'BUSINESS_REGISTRATION'
  | 'BUSINESS_LICENSE'
  | 'TIN_CERTIFICATE'
  | 'PROOF_OF_ADDRESS';

export interface BusinessDocument {
  type: BusinessDocumentType;
  url: string;
  label?: string;
}

export interface FaceCapturePose {
  pose: 'CENTER' | 'LEFT' | 'RIGHT';
  yaw?: number;
  pitch?: number;
  roll?: number;
  faceConfidence?: number;
  capturedAt?: string;
}

export interface FaceCaptureMetadata {
  engine?: string;
  modelVersion?: string;
  poses?: FaceCapturePose[];
  livenessScore?: number;
  faceMatchScore?: number;
  [key: string]: unknown;
}

export interface SellerVerification {
  id: string;
  sellerProfileId: string;
  verificationType: VerificationType;
  status: SellerVerificationStatus;
  documentType: 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT';
  documentNumber: string;
  fullName?: string | null;
  documentIssueDate?: string | null;
  documentExpiryDate?: string | null;
  address: string;
  documents: string[];
  businessRegistrationNumber?: string | null;
  tin?: string | null;
  businessAddress?: string | null;
  businessDocuments: BusinessDocument[];
  facePhoto: string[];
  faceCapture?: FaceCaptureMetadata | null;
  livenessScore?: number | null;
  faceMatchScore?: number | null;
  notes?: string | null;
  additionalNotes?: string | null;
  decisionReason?: string | null;
  recommendations?: string | null;
  infoRequestMessage?: string | null;
  infoRequestedAt?: string | null;
  sellerNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  expiresAt?: string | null;
  updatedAt: string;
}

export interface SubmitSellerVerificationV2Request {
  verificationType: VerificationType;
  documentType: 'NATIONAL_ID' | 'DRIVERS_LICENSE' | 'PASSPORT';
  documentNumber: string;
  fullName?: string;
  documentIssueDate?: string;
  documentExpiryDate?: string;
  address: string;
  documents: string[];
  businessRegistrationNumber?: string;
  tin?: string;
  businessAddress?: string;
  businessDocuments?: BusinessDocument[];
  facePhoto: string[];
  faceCapture?: FaceCaptureMetadata;
  sellerNotes?: string;
  consent: boolean;
}

const API_V2_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(
  /\/v1\/?$/,
  '/v2'
);

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
    '/seller-verification/my-verification',
    { baseURL: API_V2_BASE }
  );
  return response.data;
};

export const submitVerification = async (
  data: SubmitSellerVerificationV2Request
): Promise<SellerVerification> => {
  const response = await api.post<SellerVerification>(
    '/seller-verification',
    data,
    { baseURL: API_V2_BASE }
  );
  return response.data;
};

export const getVerificationGuidelines = async () => {
  const response = await api.get('/seller-verification/guidelines', {
    baseURL: API_V2_BASE,
  });
  return response.data;
};
