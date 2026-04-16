import api from './api';
import { User } from '@/types/user';

export const getProfile = async (): Promise<User> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const updateProfile = async (data: Partial<User>): Promise<User> => {
  const response = await api.patch('/users/me', data);
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/users/me');
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
