'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { changePassword } from '@/services/auth.service';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const schema = yup.object().shape({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

type FormData = yup.InferType<typeof schema>;

export default function SecurityPage() {
  const { user } = useAuth();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const onSubmit = (data: FormData) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-2">Security Settings</h2>
      <p className="text-text-gray mb-8">Manage your password and account security.</p>

      {/* 2FA Status (Read Only for now) */}
      <div className={`border rounded-xl p-4 mb-8 flex items-center justify-between ${
        user?.twoFactorEnabled 
          ? 'bg-successLight border-success/20' 
          : 'bg-background-primary/50 border-primary/20'
      }`}>
        <div>
           <h3 className={`font-semibold ${user?.twoFactorEnabled ? 'text-success' : 'text-primary'}`}>
             Two-Factor Authentication
           </h3>
           <p className={`text-sm ${user?.twoFactorEnabled ? 'text-success/80' : 'text-primary/70'}`}>
             {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
           </p>
        </div>
        {/* Toggle would go here */}
      </div>
      
      <h3 className="font-semibold text-text mb-4">Change Password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-text">Current Password</label>
          <input
            type="password"
            {...register('currentPassword')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.currentPassword && <p className="text-error text-sm mt-1">{errors.currentPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">New Password</label>
          <input
            type="password"
            {...register('newPassword')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.newPassword && <p className="text-error text-sm mt-1">{errors.newPassword.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">Confirm New Password</label>
          <input
            type="password"
            {...register('confirmNewPassword')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.confirmNewPassword && <p className="text-error text-sm mt-1">{errors.confirmNewPassword.message}</p>}
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit" 
            disabled={changePasswordMutation.isPending}
            className="w-full md:w-auto"
          >
            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
