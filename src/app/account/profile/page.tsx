'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/useUser';
import { uploadAvatar } from '@/services/upload.service';
import { Button } from '@/components/Button';
import { OptimizedImage } from '@/components/OptimizedImage';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
}

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phoneNumber: yup
    .string()
    .matches(
      /^\+\d+$/,
      'Phone must be in international format starting with + (e.g., +233...)'
    )
    .min(10, 'Phone number is too short')
    .nullable()
    .transform((value) => (value === '' ? null : value)),
  avatar: yup.string().optional(),
});

export default function ProfilePage() {
  const { user, refreshUser } = useAuth(); // Assuming refreshUser exists? If not, we just update local state or re-login logic
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phone || '',
      avatar: user?.avatar || '',
    },
  });

  const avatarUrl = watch('avatar');

  const updateMutation = useUpdateProfile();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      setValue('avatar', url, { shouldDirty: true });
    } catch (error) {
      console.error('Avatar upload failed', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    // Backend UpdateUserDto allows `phone` only — strip the form-local
    // `phoneNumber` key or whitelist validation rejects the request with
    // "property phoneNumber should not exist".
    const { phoneNumber, ...rest } = data;
    updateMutation.mutate(
      {
        ...rest,
        phone: phoneNumber || null,
      } as any,
      {
        onSuccess: () => {
          toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || 'Failed to update profile'
          );
        },
      }
    );
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Profile Information</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div
            className="relative w-24 h-24 rounded-full bg-background-primary overflow-hidden ring-4 ring-white shadow-sm group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {avatarUrl ? (
                  <OptimizedImage
                    src={avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-light-gray">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-text">Profile Photo</h3>
            <p className="text-sm text-text-gray mb-3">
              Accepted formats: JPG, PNG, WEBP. Max size: 5MB.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Upload New Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              First Name
            </label>
            <input
              {...register('firstName', { required: 'First name is required' })}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {errors.firstName && (
              <p className="text-error text-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Last Name
            </label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            {errors.lastName && (
              <p className="text-error text-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Email Address
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full border border-border-custom rounded-lg px-3 py-2 bg-background text-text-gray cursor-not-allowed"
            />
            <p className="text-xs text-text-light-gray mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Phone Number
            </label>
            <input
              type="tel"
              {...register('phoneNumber')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="e.g. +233 24 123 4567"
            />
            {errors.phoneNumber && (
              <p className="text-error text-sm mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="w-full md:w-auto"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
