import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSellerProfile,
  getMySellerProfile,
  getMySellerStats,
  getMyVerification,
  getSellerById,
  getVerificationGuidelines,
  getSellerStats,
  submitVerification,
  updateSellerProfile,
  CreateSellerProfileRequest,
  UpdateSellerProfileRequest,
  SubmitSellerVerificationV2Request,
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

export const useCreateSellerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSellerProfileRequest) => createSellerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useUpdateSellerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sellerId,
      data,
    }: {
      sellerId: string;
      data: UpdateSellerProfileRequest;
    }) => updateSellerProfile(sellerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-stats'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useMyVerification = () => {
  return useQuery({
    queryKey: ['seller', 'verification', 'mine'],
    queryFn: getMyVerification,
    retry: 1,
  });
};

export const useSubmitVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitSellerVerificationV2Request) =>
      submitVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'verification', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useVerificationGuidelines = () => {
  return useQuery({
    queryKey: ['seller', 'verification', 'guidelines'],
    queryFn: getVerificationGuidelines,
    staleTime: 60 * 60 * 1000,
  });
};
