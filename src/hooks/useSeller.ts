import { useQuery } from '@tanstack/react-query';
import { getSellerById, getSellerStats } from '@/services/seller.service';

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
