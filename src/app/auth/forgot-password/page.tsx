'use client';

import { useForm } from 'react-hook-form';
import { useForgotPassword } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { OptimizedImage } from '@/components/OptimizedImage';

interface FormData {
  identifier: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = (data: FormData) => {
    const isEmail = data.identifier.includes('@');
    forgotPasswordMutation.mutate(
      isEmail ? { email: data.identifier } : { phone: data.identifier },
      {
        onSuccess: (_, variables) => {
          if (variables.phone) {
            toast.success('OTP sent to your phone');
            router.push(
              `/auth/verify-otp?phone=${encodeURIComponent(variables.phone)}`
            );
          } else {
            toast.success('Password reset instructions sent to your email');
          }
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || 'Failed to send reset instructions'
          );
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4 overflow-hidden rounded-2xl">
            <OptimizedImage
              src="/images/logo-favicon.png"
              alt="WillfindITT Logo"
              fill
              className="object-contain p-2"
            />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Reset password</h1>
          <p className="text-text-gray">
            Enter your email or phone number to receive reset instructions
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-background rounded-2xl shadow-xl border border-border-custom p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-text mb-2"
              >
                Email or Phone number
              </label>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your email or phone (e.g. +233...)"
                {...register('identifier', {
                  required: 'Email or phone number is required',
                })}
                className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors bg-background"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-error">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {forgotPasswordMutation.isPending
                ? 'Sending...'
                : 'Send Instructions'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-primary hover:text-primaryLight font-semibold flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
