'use client';

import { Suspense, useState, useMemo, useRef } from 'react';
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
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isSubmittingRef = useRef(false);

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
      if (isSubmittingRef.current) {
        isSubmittingRef.current = false;
        toast.success('Password has been reset successfully');
        setTimeout(() => {
          router.push('/auth/login');
        }, 100);
      }
    },
    onError: (error: any) => {
      isSubmittingRef.current = false;
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  const onSubmit = (data: FormData) => {
    if (!token) {
        toast.error('Missing reset token');
        return;
    }
    if (isSubmittingRef.current || resetPasswordMutation.isPending) {
        return;
    }
    isSubmittingRef.current = true;
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
            <div className="mt-1 relative">
                <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('newPassword')}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-border-custom rounded-md shadow-sm placeholder-placeholder focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter new password"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-light-gray hover:text-text-gray"
                >
                    {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
                {errors.newPassword && <p className="text-error text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-text">Confirm New Password</label>
            <div className="mt-1 relative">
                <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-border-custom rounded-md shadow-sm placeholder-placeholder focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Confirm your password"
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-light-gray hover:text-text-gray"
                >
                    {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                    ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
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
