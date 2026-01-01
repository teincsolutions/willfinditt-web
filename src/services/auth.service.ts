import api from './api';
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/auth';
import { LoginData, RegisterData, AuthResponse, User, ChangePasswordData } from '@/types/user';

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  // Robustly extract tokens whether they are at top level or nested in 'tokens'
  const accessToken = response.data.accessToken || response.data.tokens?.accessToken;
  const refreshToken = response.data.refreshToken || response.data.tokens?.refreshToken;
  
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  const accessToken = response.data.accessToken || response.data.tokens?.accessToken;
  const refreshToken = response.data.refreshToken || response.data.tokens?.refreshToken;
  
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  
  return response.data;
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
  const accessToken = response.data.accessToken || response.data.tokens?.accessToken;
  const refreshToken = response.data.refreshToken || response.data.tokens?.refreshToken;
  
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  
  return response.data;
};

export const me = async (): Promise<User> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  await api.post('/auth/change-password', data);
};

export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (data: any): Promise<void> => {
  await api.post('/auth/reset-password', data);
};
