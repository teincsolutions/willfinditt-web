import api from './api';
import { User } from '@/types/user';
import { Ad } from '@/types/ad';

export const getProfile = async (): Promise<User> => {
  // Try /auth/profile as seen in auth.service.ts, or /users/profile as commonly used
  const response = await api.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.patch('/users/me', data);
  return response.data;
};

export const getFavorites = async (): Promise<Ad[]> => {
  const response = await api.get('/users/favorites');
  return response.data;
};

export const addFavorite = async (adId: string): Promise<void> => {
  await api.post(`/users/favorites/${adId}`);
};

export const removeFavorite = async (adId: string): Promise<void> => {
  await api.delete(`/users/favorites/${adId}`);
};

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/users/me');
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
