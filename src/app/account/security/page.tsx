'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { changePassword } from '@/services/auth.service';
import { deleteAccount } from '@/services/users.service';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account', error);
      toast.error('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

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
      <p className="text-text-gray mb-8">
        Manage your password and account security.
      </p>

      {/* 2FA Status (Read Only for now) */}
      <div
        className={`border rounded-xl p-4 mb-8 flex items-center justify-between ${
          user?.twoFactorEnabled
            ? 'bg-successLight border-success/20'
            : 'bg-background-primary/50 border-primary/20'
        }`}
      >
        <div>
          <h3
            className={`font-semibold ${user?.twoFactorEnabled ? 'text-success' : 'text-primary'}`}
          >
            Two-Factor Authentication
          </h3>
          <p
            className={`text-sm ${user?.twoFactorEnabled ? 'text-success/80' : 'text-primary/70'}`}
          >
            {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        {/* Toggle would go here */}
      </div>

      <h3 className="font-semibold text-text mb-4">Change Password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            Current Password
          </label>
          <input
            type="password"
            {...register('currentPassword')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.currentPassword && (
            <p className="text-error text-sm mt-1">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            New Password
          </label>
          <input
            type="password"
            {...register('newPassword')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.newPassword && (
            <p className="text-error text-sm mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            Confirm New Password
          </label>
          <input
            type="password"
            {...register('confirmNewPassword')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          {errors.confirmNewPassword && (
            <p className="text-error text-sm mt-1">
              {errors.confirmNewPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full md:w-auto"
          >
            {changePasswordMutation.isPending
              ? 'Updating...'
              : 'Update Password'}
          </Button>
        </div>
      </form>

      <hr className="my-10 border-border-custom" />

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-error">Danger Zone</h3>
        <p className="text-text-gray">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>

        <Button
          variant="outline"
          className="border-error text-error hover:bg-error/10 hover:text-error hover:border-error"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Account
        </Button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-xl border border-border-custom max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-text mb-4">
              Delete Account?
            </h3>

            <div className="space-y-3 mb-6">
              <div className="p-3 bg-error/10 rounded-lg border border-error/20">
                <p className="text-sm text-error font-medium">
                  ⚠️ Warning: This action cannot be undone immediately.
                </p>
              </div>

              <ul className="text-sm text-text-gray space-y-2 list-disc pl-5">
                <li>
                  Your account will be <strong>deactivated immediately</strong>.
                </li>
                <li>You will be logged out of all devices.</li>
                <li>
                  All active/pending ads will be{' '}
                  <strong>closed automatically</strong>.
                </li>
                <li>
                  Your data will be retained for a{' '}
                  <strong>30-day grace period</strong>.
                </li>
                <li>
                  After 30 days, your data and all ads will be{' '}
                  <strong>permanently anonymized/archived</strong>.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-error hover:bg-errorDark text-white border-error hover:border-errorDark w-full sm:w-auto"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
