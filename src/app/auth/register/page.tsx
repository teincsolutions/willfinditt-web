'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRegister, useSocialAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { isGoogleSignInConfigured } from '@/lib/google-auth';
import { Button } from '@/components/Button';
import { trackEvent } from '@/lib/analytics';

const schema = yup.object().shape(
  {
    firstName: yup
      .string()
      .required('First name is required')
      .min(2, 'Must be at least 2 characters'),
    lastName: yup
      .string()
      .required('Last name is required')
      .min(2, 'Must be at least 2 characters'),
    email: yup
      .string()
      .email('Invalid email')
      .when('phone', {
        is: (val: string) => !val || val.length === 0,
        then: (schema) =>
          schema.required('Email is required when phone is empty'),
        otherwise: (schema) => schema.notRequired(),
      }),
    phone: yup.string().when('email', {
      is: (val: string) => !val || val.length === 0,
      then: (schema) =>
        schema
          .required('Phone is required when email is empty')
          .matches(
            /^\+\d+$/,
            'Phone must be in international format starting with + (e.g., +233...)'
          )
          .min(10, 'Phone number is too short'),
      otherwise: (schema) => schema.notRequired(),
    }),
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords must match'),
    agreeToTerms: yup
      .boolean()
      .required('You must agree to the terms and conditions')
      .oneOf([true], 'You must agree to the terms and conditions'),
  },
  [['email', 'phone']]
);

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string | undefined;
  phone: string | undefined;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

import { OptimizedImage } from '@/components/OptimizedImage';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerMethod, setRegisterMethod] = useState<'EMAIL' | 'PHONE'>(
    'EMAIL'
  );
  const hasNavigatedRef = useRef(false);

  const {
    register: registerField,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema) as any,
  });

  const registerMutation = useRegister();
  const socialAuthMutation = useSocialAuth();

  const isLoading = registerMutation.isPending || socialAuthMutation.isPending;

  const onSubmit = async (data: RegisterFormData) => {
    if (registerMutation.isPending || hasNavigatedRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, agreeToTerms, ...registerData } = data;

      // Handle explicit undefined for unused contact method
      if (registerMethod === 'EMAIL') {
        registerData.phone = undefined;
      } else {
        registerData.email = undefined;
      }

      await registerMutation.mutateAsync(registerData);

      if (!hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        if (registerMethod === 'EMAIL') {
          toast.success('Account created! Please verify your email.');
          setTimeout(() => {
            router.push(
              `/auth/verify-email?email=${encodeURIComponent(data.email || '')}`
            );
          }, 300);
        } else {
          toast.success('Account created! Please verify your phone number.');
          setTimeout(() => {
            router.push(
              `/auth/verify-otp?phone=${encodeURIComponent(data.phone || '')}`
            );
          }, 300);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    if (hasNavigatedRef.current) return;
    try {
      if (response.credential) {
        await socialAuthMutation.mutateAsync({
          accessToken: response.credential, // Sending ID token as accessToken
          provider: 'GOOGLE',
        });
        trackEvent('sign_up', { method: 'google' });
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          toast.success('Google registration successful!');
          setTimeout(() => {
            router.push('/');
          }, 300);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Google registration failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google registration failed');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4 overflow-hidden rounded-2xli">
            <OptimizedImage
              src="/images/logo-favicon.png"
              alt="WillfindITT Logo"
              fill
              className="object-contain p-2"
            />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">
            Create your account
          </h1>
          <p className="text-text-gray">
            Join WillfindITT and start discovering amazing deals
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-background rounded-2xl shadow-xl border border-border-custom p-8">
          {/* Back Button */}
          <Link
            href="/"
            className="text-text-gray hover:text-text flex items-center gap-2 transition-colors mb-4"
          >
            <svg
              className="w-5 h-5"
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
            Back to Home
          </Link>
          {isGoogleSignInConfigured && (
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                size="large"
                text="signup_with"
                width="360"
              />
            </div>
          )}

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-custom" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-text-gray">
                or create account with email or phone
              </span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-errorLight border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  First Name
                </label>
                <input
                  {...registerField('firstName')}
                  type="text"
                  placeholder="First name"
                  className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-error">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Last Name
                </label>
                <input
                  {...registerField('lastName')}
                  type="text"
                  placeholder="Last name"
                  className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-error">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Registration Method Toggle */}
            <div className="flex bg-background-primary p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setRegisterMethod('EMAIL')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  registerMethod === 'EMAIL'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-gray hover:text-text'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisterMethod('PHONE');
                  const currentPhone = getValues('phone');
                  if (!currentPhone) {
                    setValue('phone', '+233');
                  }
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  registerMethod === 'PHONE'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-text-gray hover:text-text'
                }`}
              >
                Phone
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {registerMethod === 'EMAIL' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Email address
                  </label>
                  <input
                    {...registerField('email')}
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              )}

              {registerMethod === 'PHONE' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Phone number
                  </label>
                  <input
                    {...registerField('phone')}
                    type="tel"
                    placeholder="Enter your phone"
                    className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-error">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...registerField('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-gray hover:text-text-gray"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
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
                      className="w-5 h-5"
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
              {errors.password && (
                <p className="mt-1 text-sm text-error">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  {...registerField('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 pr-12 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light-gray hover:text-text-gray"
                >
                  {showConfirmPassword ? (
                    <svg
                      className="w-5 h-5"
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
                      className="w-5 h-5"
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
                <p className="mt-1 text-sm text-error">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-start">
                <input
                  {...registerField('agreeToTerms')}
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 text-primary border-border-custom rounded focus:ring-primary"
                />
                <span className="ml-2 text-sm text-text-gray">
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="text-primary hover:text-primaryLight font-medium"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy-policy"
                    className="text-primary hover:text-primaryLight font-medium"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-error">
                  {errors.agreeToTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-text-gray">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primaryLight font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-text-gray">
          <div className="flex justify-center space-x-6">
            <Link href="/terms" className="hover:text-text">
              Terms of Service
            </Link>
            <Link href="/privacy-policy" className="hover:text-text">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
