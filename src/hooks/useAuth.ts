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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
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
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
