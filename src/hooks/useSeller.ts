import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSellerProfile,
  getMySellerProfile,
  getMySellerStats,
  getMyVerification,
  getSellerById,
  getSellerStats,
  submitVerification,
  updateMyVerification,
  updateSellerProfile,
  CreateSellerProfileRequest,
  UpdateSellerProfileRequest,
  SubmitSellerVerificationRequest,
  UpdateSellerVerificationRequest,
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
    mutationFn: (data: SubmitSellerVerificationRequest) => submitVerification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'verification', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-profile'] });
    },
  });
};

export const useUpdateMyVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      verificationId,
      data,
    }: {
      verificationId: string;
      data: UpdateSellerVerificationRequest;
    }) => updateMyVerification(verificationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'verification', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['seller', 'my-profile'] });
    },
  });
};
