import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSavedAds,
  saveAd,
  unsaveAd,
} from '@/services/ads.service';
import { AdsListParams, AdsResponse } from '@/types/ad';

export const useFavorites = (params: AdsListParams = {}) => {
  return useQuery<AdsResponse>({
    queryKey: ['favorites', params],
    queryFn: () => getSavedAds(params),
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => saveAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad'] });
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => unsaveAd(adId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['ad'] });
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
};
