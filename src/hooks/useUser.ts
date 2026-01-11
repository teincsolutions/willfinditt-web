import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '@/services/users.service';
import { User } from '@/types/user';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
