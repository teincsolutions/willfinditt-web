import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, logout, me } from '@/services/auth.service';
import { LoginData, RegisterData } from '@/types/user';

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginData) => login(data),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => register(data),
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
  });
};
