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
import { trackEvent } from '@/lib/analytics';

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginData) => login(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      trackEvent('login', {
        method: (variables as LoginData & { email?: string }).email
          ? 'email'
          : 'phone',
      });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
    onSuccess: (_data, variables) => {
      const v = variables as RegisterData & { email?: string; phone?: string };
      trackEvent('sign_up', {
        method: v.email ? 'email' : 'phone',
        email: v.email,
        phone: v.phone,
      });
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

export const useMe = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled, // Only run query when explicitly enabled
    retry: 1,
    staleTime: 1000 * 60 * 15, // 15 minutes - increased from 5
    gcTime: 1000 * 60 * 30, // 30 minutes cache retention
    refetchOnWindowFocus: false, // Don't refetch on window focus to prevent logouts
    refetchInterval: false, // Disable periodic refetching
  });
};
