'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/services/auth.service';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type FormData = yup.InferType<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success('Password has been reset successfully');
      router.push('/auth/login');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const onSubmit = (data: FormData) => {
    if (!token) {
        toast.error('Missing reset token');
        return;
    }
    resetPasswordMutation.mutate({ token, newPassword: data.newPassword });
  };

  if (!token) {
      return (
          <div className="text-center">
              <h3 className="text-lg font-bold text-error">Invalid Link</h3>
              <p className="mt-2 text-text-gray">This password reset link is invalid or missing a token.</p>
              <Link href="/auth/forgot-password" className="mt-4 inline-block text-primary hover:text-primaryLight transition-colors">
                  Request a new link
              </Link>
          </div>
      );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
            <label className="block text-sm font-medium text-text">New Password</label>
            <div className="mt-1">
                <input
                    type="password"
                    {...register('newPassword')}
                    className="appearance-none block w-full px-3 py-2 border border-border-custom rounded-md shadow-sm placeholder-placeholder focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                {errors.newPassword && <p className="text-error text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-text">Confirm New Password</label>
            <div className="mt-1">
                <input
                    type="password"
                    {...register('confirmPassword')}
                    className="appearance-none block w-full px-3 py-2 border border-border-custom rounded-md shadow-sm placeholder-placeholder focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
        </div>

        <div>
            <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
        </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
          Set new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-background py-8 px-4 shadow sm:rounded-lg sm:px-10">
           <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
             <ResetPasswordForm />
           </Suspense>
        </div>
      </div>
    </div>
  );
}
