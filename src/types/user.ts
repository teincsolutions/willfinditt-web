import { SellerProfile } from '@/services/seller.service';

export interface User {
  id: string;
  email: string;
  sellerProfile?: SellerProfile;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Display name
  avatar?: string;
  phoneNumber?: string; // Preferred
  phone?: string; // Legacy/Alias
  location?: string;
  role?: 'USER' | 'ADMIN' | 'SELLER' | 'MODERATOR';
  isVerified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  forcePasswordChange?: boolean;
  twoFactorEnabled?: boolean;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
