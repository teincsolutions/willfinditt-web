'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { useSocialAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';

const schema = yup.object({
  identifier: yup.string().required('Email or phone number is required'),
  password: yup.string().required('Password is required'),
});

import { OptimizedImage } from '@/components/OptimizedImage';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const socialAuthMutation = useSocialAuth();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const hasNavigatedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { identifier: string; password: string }) => {
    if (isSubmittingForm || hasNavigatedRef.current) return;
    setIsSubmittingForm(true);
    try {
      setError('');
      const isEmail = data.identifier.includes('@');
      const loginParams = {
        password: data.password,
        [isEmail ? 'email' : 'phone']: data.identifier,
      };
      await login(loginParams);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmittingForm(false);
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
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          toast.success('Login with Google successful!');
          setTimeout(() => {
            router.push('/');
          }, 300);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full relative">
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
          <h1 className="text-3xl font-bold text-text mb-2">Welcome back</h1>
          <p className="text-text-gray">Sign in to your WillfindITT account</p>
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

          {/* Google Sign In */}

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_blue"
              shape="pill"
              size="large"
              text="continue_with"
              width="360"
            />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-custom" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-text-gray">
                or continue with email or phone
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

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Email or Phone number
              </label>
              <input
                {...register('identifier')}
                type="text"
                placeholder="Enter your email or phone (e.g. +233...)"
                className="w-full px-4 py-3 border border-border-custom rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-error">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-border-custom rounded focus:ring-primary"
                />
                <span className="ml-2 text-sm text-text-gray">Remember me</span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primaryLight font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmittingForm || socialAuthMutation.isPending}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmittingForm ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-text-gray">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primaryLight font-semibold"
              >
                Sign up
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
