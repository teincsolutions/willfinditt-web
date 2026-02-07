import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  login,
  register,
  logout,
  me,
  socialAuth,
  verifyPhone,
  forgotPassword,
} from '@/services/auth.service';
import { LoginData, RegisterData } from '@/types/user';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginData) => login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
  });
};

export const useSocialAuth = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      accessToken: string;
      provider: 'GOOGLE' | 'FACEBOOK';
    }) => socialAuth(data.accessToken, data.provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useVerifyPhone = () => {
  return useMutation({
    mutationFn: verifyPhone,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: me,
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes - increased from 5
    gcTime: 1000 * 60 * 30, // 30 minutes cache retention
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent logouts
    refetchInterval: false, // Disable periodic refetching
  });
};
