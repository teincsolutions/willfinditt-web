import api from './api';
import { User } from '@/types/user';
import { Ad } from '@/types/ad';

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/users/profile');
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
