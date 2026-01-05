'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateAd } from '@/hooks/useAds';
import { useParentCategories, useSubcategories } from '@/hooks/useCategories';
import { Button } from '@/components/Button';
import { AdCondition } from '@/types/ad';
import { ImageUploader } from '@/components/ImageUploader';
import { LocationSelector } from '@/components/LocationSelector';
import { DynamicCategoryFields } from '@/components/DynamicCategoryFields';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Form Data Type
// Form Data Type
type CreateAdFormData = yup.InferType<typeof schema>;

// Validation Schema
const schema = yup.object().shape({
  title: yup
    .string()
    .required('Title is required')
    .min(5, 'Title is too short'),
  description: yup
    .string()
    .required('Description is required')
    .min(20, 'Description is too short'),
  price: yup
    .number()
    .typeError('Price must be a number')
    .required('Price is required')
    .min(0, 'Price must be positive'),
  condition: yup
    .mixed<AdCondition>()
    .oneOf(Object.values(AdCondition))
    .required('Condition is required'),
  categoryId: yup.string().required('Category is required'),
  countryId: yup.string().required('Country is required'),
  stateId: yup.string().optional(),
  cityId: yup.string().optional(),
  address: yup.string().optional(),
  isNegotiable: yup.boolean().default(false),
  dynamicFields: yup.object().optional(),
});

export default function CreateAdPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const createAd = useCreateAd();

  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAdFormData>({
    resolver: yupResolver(schema as any),
    defaultValues: {
      isNegotiable: false,
    },
  });

  const categoryId = watch('categoryId');

  // Categories Data
  const { data: parentCategories } = useParentCategories();
  const { data: subcategories } = useSubcategories(selectedParentId);

  // Auth protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/ads/new');
    }
  }, [authLoading, isAuthenticated, router]);

  const onSubmit: SubmitHandler<CreateAdFormData> = (data) => {
    if (images.length === 0) {
      setUploadError('Please upload at least one image.');
      return;
    }
    setUploadError(null);

    // Transform dynamic fields
    const fieldValues = data.dynamicFields
      ? Object.entries(data.dynamicFields).map(([key, value]) => ({
          categoryFieldId: key,
          value: String(value), // Ensure string value as per DTO
        }))
      : [];

    const adData: any = {
      title: data.title,
      description: data.description,
      price: data.price,
      condition: data.condition,
      categoryId: data.categoryId,
      isNegotiable: data.isNegotiable,
      images: images,

      // Location logic
      // Ideally backend wants cityId. If no cityId, maybe stateId?
      // The ad DTO has `cityId`, `address`, `latitude`, `longitude`.
      cityId: data.cityId || undefined,
      address: data.address, // Optional manual address

      fieldValues: fieldValues,
    };

    createAd.mutate(adData, {
      onSuccess: (ad) => {
        router.push(`/ads/${ad.id}`);
      },
      onError: (error) => {
        console.error('Failed to create ad:', error);
        // Show error toast or alert
      },
    });
  };

  const handleLocationChange = (loc: {
    countryId: string;
    stateId: string;
    cityId: string;
  }) => {
    setValue('countryId', loc.countryId);
    setValue('stateId', loc.stateId);
    setValue('cityId', loc.cityId);
  };

  if (authLoading)
    return (
      <div className="p-8 text-center text-text-gray">Loading checks...</div>
    );

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-background rounded-2xl shadow-sm border border-border-custom overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Post a New Ad</h1>
            <p className="text-primaryLight mt-1">
              Fill in the details to list your item for sale.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
            {/* Section 1: Item Images */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
                  1
                </span>
                Photos
              </h2>
              <ImageUploader images={images} onImagesChange={setImages} />
              {uploadError && (
                <p className="text-error text-sm mt-2">{uploadError}</p>
              )}
            </div>

            <hr className="border-border-custom" />

            {/* Section 2: Category & Title */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Basic Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text">
                    Category *
                  </label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => {
                      setSelectedParentId(e.target.value);
                      setValue('categoryId', ''); // Reset child category
                    }}
                    className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="">Select Category</option>
                    {parentCategories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-text">
                    Subcategory *
                  </label>
                  <select
                    {...register('categoryId')}
                    className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all disabled:bg-background/50 disabled:text-text-light-gray"
                    disabled={!selectedParentId}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.categoryId && (
                    <p className="text-error text-sm mt-1">
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text">
                    Title *
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="E.g. Brand new iPhone 14 Pro Max 256GB"
                  />
                  {errors.title && (
                    <p className="text-error text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-text">
                    Condition *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(AdCondition).map((cond) => (
                      <label key={cond} className="cursor-pointer">
                        <input
                          type="radio"
                          value={cond}
                          {...register('condition')}
                          className="peer sr-only"
                        />
                        <div className="px-4 py-2 bg-background border border-border-custom rounded-full text-sm font-medium text-text-gray peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary hover:bg-background-primary transition-all">
                          {cond.replace('_', ' ')}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.condition && (
                    <p className="text-error text-sm mt-1">
                      {errors.condition.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Fields Section (Only if category is selected) */}
            {categoryId && (
              <DynamicCategoryFields
                categoryId={categoryId}
                register={register}
                errors={errors}
              />
            )}

            <hr className="border-border-custom" />

            {/* Section 3: Description & Price */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Description & Price
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text">
                    Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={6}
                    className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="Describe your item in detail. Include features, condition notes, and reason for selling."
                  />
                  {errors.description && (
                    <p className="text-error text-sm mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-text">
                      Price ($) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-text-gray">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        {...register('price')}
                        className="w-full border border-border-custom rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-error text-sm mt-1">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center h-full pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          {...register('isNegotiable')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-background-primary/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border-custom after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </div>
                      <span className="text-sm font-medium text-text">
                        Price is negotiable
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border-custom" />

            {/* Section 4: Location */}
            <div>
              <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
                  4
                </span>
                Location
              </h2>

              <LocationSelector onLocationChange={handleLocationChange} />

              {(errors.countryId || errors.stateId || errors.cityId) && (
                <p className="text-error text-sm mt-2">
                  Please select a valid location (Country is required)
                </p>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1 text-text">
                  Specific Address (Optional)
                </label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Street address, landmarks, etc."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border-custom flex items-center justify-end gap-4">
              <Link href="/">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                size="lg"
                disabled={createAd.isPending}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg text-white font-semibold py-3 px-8"
              >
                {createAd.isPending ? 'Publishing...' : 'Publish Ad Now'}
              </Button>
            </div>
            {createAd.isError && (
              <p className="text-error text-center mt-4">
                Something went wrong. Please check your inputs and try again.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
