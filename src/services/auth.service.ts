import api from './api';
import { setAccessToken, setRefreshToken, clearTokens } from '@/lib/auth';
import { LoginData, RegisterData, AuthResponse, User } from '@/types/user';

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  const { accessToken, refreshToken } = response.data;
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  const { accessToken, refreshToken } = response.data;
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
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
  const { accessToken, refreshToken } = response.data;
  setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  return response.data;
};

export const me = async (): Promise<User> => {
  const response = await api.get('/auth/profile');
  return response.data;
};
