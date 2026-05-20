import { useQuery } from '@tanstack/react-query';
import {
  getMySellerProfile,
  getMySellerStats,
  getSellerById,
  getSellerStats,
} from '@/services/seller.service';

export const useSeller = (id: string) => {
  return useQuery({
    queryKey: ['seller', id],
    queryFn: () => getSellerById(id),
    enabled: !!id,
    retry: 1, // Fail fast if not found, we might just be looking at a regular user
  });
};

export const useSellerStats = (id: string) => {
  return useQuery({
    queryKey: ['seller', 'stats', id],
    queryFn: () => getSellerStats(id),
    enabled: !!id,
    retry: 1,
  });
};

export const useMySeller = () => {
  return useQuery({
    queryKey: ['seller', 'my-profile'],
    queryFn: getMySellerProfile,
    retry: 1,
  });
};

export const useMySellerStats = () => {
  return useQuery({
    queryKey: ['seller', 'my-stats'],
    queryFn: getMySellerStats,
    retry: 1,
  });
};
