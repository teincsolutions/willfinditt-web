'use client';

import { Suspense, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVerifyPhone } from '@/hooks/useAuth';
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
});

type FormData = yup.InferType<typeof schema>;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
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

  const verifyMutation = useVerifyPhone();

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
    verifyMutation.mutate(
      {
        phone,
        token: data.otp,
      },
      {
        onSuccess: () => {
          toast.success('Phone verification successful! Please login.');
          router.push('/auth/login');
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message ||
              'Failed to verify OTP. Please try again.'
          );
        },
      }
    );
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

      <div className="pt-4 border-t border-border-custom">
        <Button
          type="submit"
          disabled={verifyMutation.isPending}
          className="w-full py-4 border border-transparent rounded-2xl shadow-xl text-md font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifyMutation.isPending ? 'Verifying...' : 'Verify Phone'}
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
          <p className="text-text-gray">Verify your phone number to continue</p>
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
