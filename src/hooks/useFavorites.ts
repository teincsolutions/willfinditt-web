import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '@/services/users.service';

export const useFavorites = () => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => addFavorite(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => removeFavorite(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
};
