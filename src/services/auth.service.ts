import api from './api';
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/auth';
import {
  LoginData,
  RegisterData,
  AuthResponse,
  User,
  ChangePasswordData,
} from '@/types/user';

const extractTokens = (data: any) => {
  const accessToken =
    data.access_token || data.accessToken || data.tokens?.accessToken;
  const refreshToken =
    data.refresh_token || data.refreshToken || data.tokens?.refreshToken;
  return { accessToken, refreshToken };
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/login', data);
    const { accessToken, refreshToken } = extractTokens(response.data);

    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/register', data);
    const { accessToken, refreshToken } = extractTokens(response.data);

    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const socialAuth = async (
  accessToken: string,
  provider: 'GOOGLE' | 'FACEBOOK'
): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/social-auth', {
      accessToken,
      provider,
    });
    const { accessToken: resToken, refreshToken } = extractTokens(
      response.data
    );

    if (resToken) setAccessToken(resToken);
    if (refreshToken) setRefreshToken(refreshToken);

    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
};

export const verifyEmail = async (token: string): Promise<void> => {
  await api.post('/auth/verify-email', { token });
};

export const resendVerification = async (data: {
  email?: string;
  phone?: string;
}): Promise<void> => {
  await api.post('/auth/resend-verification', data);
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // ignore
  }
  clearTokens();
};

export const refresh = async (): Promise<AuthResponse> => {
  const response = await api.post('/auth/refresh');
  const { accessToken, refreshToken } = extractTokens(response.data);

  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);

  return response.data;
};

export const me = async (): Promise<User> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const changePassword = async (
  data: ChangePasswordData
): Promise<void> => {
  await api.post('/auth/change-password', data);
};

export const forgotPassword = async (data: {
  email?: string;
  phone?: string;
}): Promise<void> => {
  await api.post('/auth/forgot-password', data);
};

export const resetPassword = async (data: any): Promise<void> => {
  await api.post('/auth/reset-password', data);
};

export const verifyResetPhoneOtp = async (data: {
  phone: string;
  otp: string;
}): Promise<void> => {
  await api.post('/auth/verify-reset-phone-otp', data);
};

export const resetPasswordWithPhone = async (data: {
  phone: string;
  otp: string;
  newPassword: string;
}): Promise<void> => {
  await api.post('/auth/reset-password-phone', data);
};
