import { useQuery } from '@tanstack/react-query';
import { getHomeBanners } from '@/services/home-banners.service';

export const useHomeBanners = () => {
  return useQuery({
    queryKey: ['home-banners'],
    queryFn: getHomeBanners,
    staleTime: 60 * 1000,
  });
};
