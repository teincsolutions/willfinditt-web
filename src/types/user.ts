import { SellerProfile } from '@/services/seller.service';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  provider: 'GOOGLE' | 'LOCAL';
  providerId: string;
  linkedProviders: string | null;
  countryId: string | null;
  accountLockedUntil: string | null;
  lastLoginAt: string;
  lastLoginIp: string;
  passwordChangedAt: string | null;
  forcePasswordChange: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresVerification?: boolean;
  message?: string;
  requires2FA?: boolean; // Added based on doc "2FA Required Response"
  userId?: string; // Added based on doc "2FA Required Response"
  phone?: string; // Added based on doc "2FA Required Response"
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}
