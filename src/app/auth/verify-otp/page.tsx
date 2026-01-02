'use client';

import { Suspense, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPasswordWithPhone } from '@/services/auth.service';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { OptimizedImage } from '@/components/OptimizedImage';

const schema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be 6 digits')
    .matches(/^\d+$/, 'OTP must be only digits'),
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

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const resetMutation = useMutation({
    mutationFn: resetPasswordWithPhone,
    onSuccess: () => {
      toast.success('Password has been reset successfully');
      router.push('/auth/login');
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ||
          'Failed to reset password. Please check your OTP.'
      );
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpValue];
    newOtp[index] = value;
    setOtpValue(newOtp);

    const fullOtp = newOtp.join('');
    setValue('otp', fullOtp, { shouldValidate: true });

    // Move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = (data: FormData) => {
    if (!phone) {
      toast.error('Phone number is missing');
      return;
    }
    resetMutation.mutate({
      phone,
      otp: data.otp,
      newPassword: data.newPassword,
    });
  };

  if (!phone) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-bold text-error">Missing Phone Number</h3>
        <p className="mt-2 text-text-gray">
          We couldn't find the phone number for this request.
        </p>
        <Link
          href="/auth/forgot-password"
          className="mt-4 inline-block text-primary hover:text-primaryLight transition-colors"
        >
          Go back
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
        <p className="text-sm text-center text-text-gray">
          We've sent a 6-digit code to{' '}
          <span className="font-semibold text-text">{phone}</span>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-4 text-center">
          Enter Verification Code
        </label>
        <div className="flex justify-center gap-2 sm:gap-4">
          {otpValue.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                otpRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all"
            />
          ))}
        </div>
        <input type="hidden" {...register('otp')} />
        {errors.otp && (
          <p className="text-error text-xs mt-2 text-center">
            {errors.otp.message}
          </p>
        )}
      </div>

      <div className="space-y-6 pt-4 border-t border-border-custom">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('newPassword')}
              className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-gray hover:text-text-gray"
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-error text-xs mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-gray hover:text-text-gray"
            >
              {showConfirmPassword ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-error text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={resetMutation.isPending}
          className="w-full py-4 border border-transparent rounded-2xl shadow-xl text-md font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetMutation.isPending ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </div>
    </form>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
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
          <h2 className="text-3xl font-extrabold text-text tracking-tight mb-2">
            Verify OTP
          </h2>
          <p className="text-text-gray">
            Set your new password to regain access
          </p>
        </div>

        <div className="bg-background py-10 px-6 sm:px-10 rounded-3xl shadow-2xl border border-border-custom/50">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-text-gray animate-pulse">
                  Loading verification form...
                </p>
              </div>
            }
          >
            <VerifyOtpForm />
          </Suspense>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/auth/forgot-password"
            title="Try another method"
            className="text-sm font-medium text-text-gray hover:text-primary transition-colors"
          >
            Didn't receive code? Request again
          </Link>
        </div>
      </div>
    </div>
  );
}
