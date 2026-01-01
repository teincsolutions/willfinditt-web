'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '@/services/auth.service';
import { Button } from '@/components/Button';
import { toast } from 'sonner';
import Link from 'next/link';

interface FormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email');
    },
    onError: (error: any) => {
      // API says always success for security, but IF it returns error:
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    },
  });

  const onSubmit = (data: FormData) => {
    forgotPasswordMutation.mutate(data.email);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-text-gray">
            Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-background py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                      }
                  })}
                  className="appearance-none block w-full px-3 py-2 border border-border-custom rounded-md shadow-sm placeholder-placeholder focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                 {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {forgotPasswordMutation.isPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-custom" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-text-gray">
                    Or
                  </span>
                </div>
             </div>
             <div className="mt-6 text-center">
                <Link href="/auth/login" className="font-medium text-primary hover:text-primaryLight">
                  Return to sign in
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
