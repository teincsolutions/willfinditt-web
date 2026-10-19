import api from './api';
import { HomeBanner } from '@/types/home-banner';

export const getHomeBanners = async (): Promise<HomeBanner[]> => {
  const response = await api.get('/home-banners');
  return response.data?.data || [];
};
