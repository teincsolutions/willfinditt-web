'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmail } from '@/services/auth.service';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { OptimizedImage } from '@/components/OptimizedImage';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully!');
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.message ||
            'Verification failed. The token may be expired or invalid.'
        );
        toast.error('Verification failed');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="bg-background rounded-2xl shadow-xl border border-border-custom p-8 text-center">
      <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6 overflow-hidden rounded-2xl mx-auto">
        <OptimizedImage
          src="/images/logo-favicon.png"
          alt="WillfindITT Logo"
          fill
          className="object-contain p-2"
        />
      </div>

      {status === 'loading' && (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h1 className="text-2xl font-bold text-text">
            Verifying your email...
          </h1>
          <p className="text-text-gray">
            Please wait while we confirm your account.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Email Verified!
            </h1>
            <p className="text-text-gray">
              Your account has been successfully activated. You can now sign in
              to your account.
            </p>
          </div>
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all"
          >
            Go to Login
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Verification Failed
            </h1>
            <p className="text-text-gray">{message}</p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              className="w-full py-3 rounded-xl border-border-custom hover:bg-background transition-colors"
            >
              Back to Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Suspense
          fallback={
            <div className="bg-background rounded-2xl shadow-xl border border-border-custom p-8 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-text-gray">Loading...</p>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>

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
