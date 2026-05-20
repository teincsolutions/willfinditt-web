'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'sonner';
import {
  useCreateSellerProfile,
  useMySeller,
  useUpdateSellerProfile,
} from '@/hooks/useSeller';
import { Button } from '@/components/Button';

const schema = yup.object({
  businessName: yup
    .string()
    .trim()
    .min(2, 'Business name must be at least 2 characters')
    .required('Business name is required'),
  businessType: yup
    .string()
    .trim()
    .min(2, 'Business type must be at least 2 characters')
    .required('Business type is required'),
  description: yup.string().trim().optional(),
  website: yup
    .string()
    .trim()
    .url('Enter a valid URL')
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .optional(),
  facebook: yup
    .string()
    .trim()
    .url('Enter a valid URL')
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .optional(),
  instagram: yup
    .string()
    .trim()
    .url('Enter a valid URL')
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .optional(),
  twitter: yup
    .string()
    .trim()
    .url('Enter a valid URL')
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .optional(),
  linkedin: yup
    .string()
    .trim()
    .url('Enter a valid URL')
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .optional(),
  agreeToTerms: yup.boolean().default(false),
});

type BusinessProfileFormData = yup.Asserts<typeof schema>;

export default function EditBusinessProfilePage() {
  const router = useRouter();
  const { data: mySeller, isLoading } = useMySeller();
  const createSellerMutation = useCreateSellerProfile();
  const updateSellerMutation = useUpdateSellerProfile();

  const isEditMode = !!mySeller?.id;
  const isSubmitting = createSellerMutation.isPending || updateSellerMutation.isPending;

  const defaults = useMemo(
    () => ({
      businessName: mySeller?.businessName || '',
      businessType: mySeller?.businessType || '',
      description: mySeller?.description || '',
      website: mySeller?.website || '',
      facebook: mySeller?.socialMedia?.facebook || '',
      instagram: mySeller?.socialMedia?.instagram || '',
      twitter: mySeller?.socialMedia?.twitter || '',
      linkedin: mySeller?.socialMedia?.linkedin || '',
      agreeToTerms: isEditMode,
    }),
    [isEditMode, mySeller]
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BusinessProfileFormData>({
    resolver: yupResolver(schema) as any,
    values: defaults as any,
  });

  const onSubmit = async (values: BusinessProfileFormData) => {
    if (!isEditMode && !values.agreeToTerms) {
      setError('agreeToTerms', {
        type: 'required',
        message: 'You must agree to the terms and conditions',
      });
      return;
    }

    const payload = {
      businessName: values.businessName,
      businessType: values.businessType,
      description: values.description || undefined,
      website: values.website || undefined,
      socialMedia: {
        facebook: values.facebook || undefined,
        instagram: values.instagram || undefined,
        twitter: values.twitter || undefined,
        linkedin: values.linkedin || undefined,
      },
    };

    try {
      if (isEditMode && mySeller?.id) {
        await updateSellerMutation.mutateAsync({
          sellerId: mySeller.id,
          data: payload,
        });
        toast.success('Business profile updated successfully');
      } else {
        await createSellerMutation.mutateAsync(payload);
        toast.success('Business profile created successfully');
      }

      router.push('/account/business');
      router.refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEditMode ? 'update' : 'create'} business profile`
      );
    }
  };

  if (isLoading) {
    return <div className="py-10 text-center text-text-gray">Loading profile...</div>;
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-text mb-2">
        {isEditMode ? 'Edit Business Profile' : 'Create Business Profile'}
      </h2>
      <p className="text-text-gray mb-6">
        {isEditMode
          ? 'Update your business details and social links.'
          : 'Set up your business profile to become a seller.'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text">Business Information</h3>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Business Name</label>
            <input
              {...register('businessName')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your business name"
            />
            {errors.businessName && (
              <p className="text-error text-sm mt-1">{errors.businessName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Business Type</label>
            <input
              {...register('businessType')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Electronics, Fashion"
            />
            {errors.businessType && (
              <p className="text-error text-sm mt-1">{errors.businessType.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tell buyers about your business"
            />
            {errors.description && (
              <p className="text-error text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text">Social Media and Website</h3>

          {[
            { key: 'website', label: 'Website', placeholder: 'https://yourbusiness.com' },
            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbusiness' },
            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbusiness' },
            { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/yourbusiness' },
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourbusiness' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium mb-1 text-text">{field.label}</label>
              <input
                {...register(field.key as keyof BusinessProfileFormData)}
                className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                placeholder={field.placeholder}
              />
              {errors[field.key as keyof BusinessProfileFormData] && (
                <p className="text-error text-sm mt-1">
                  {errors[field.key as keyof BusinessProfileFormData]?.message as string}
                </p>
              )}
            </div>
          ))}
        </section>

        {!isEditMode && (
          <section className="rounded-lg border border-border-custom p-4 bg-background-primary/40">
            <label className="flex items-start gap-3">
              <input type="checkbox" {...register('agreeToTerms')} className="mt-1" />
              <span className="text-sm text-text-gray">
                I agree to the terms and conditions and privacy policy.
              </span>
            </label>
            {errors.agreeToTerms && (
              <p className="text-error text-sm mt-2">{errors.agreeToTerms.message}</p>
            )}
          </section>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/account/business')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Business Profile'
                : 'Create Business Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
