import api from './api';
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/auth';
import { LoginData, RegisterData, AuthResponse, User, ChangePasswordData } from '@/types/user';

const extractTokens = (data: any) => {
  const accessToken = data.access_token || data.accessToken || data.tokens?.accessToken;
  const refreshToken = data.refresh_token || data.refreshToken || data.tokens?.refreshToken;
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

export const changePassword = async (data: ChangePasswordData): Promise<void> => {
  await api.post('/auth/change-password', data);
};

export const forgotPassword = async (email: string): Promise<void> => {
  await api.post('/auth/forgot-password', { email });
};

export const resetPassword = async (data: any): Promise<void> => {
  await api.post('/auth/reset-password', data);
};
