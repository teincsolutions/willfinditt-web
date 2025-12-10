'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCreateAd } from '@/hooks/useAds';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/Button';
import { AdCondition } from '@/types/ad';

type CreateAdFormData = {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  condition: AdCondition;
  location: string;
  negotiable: boolean;
  features?: string;
};

const schema = yup.object({
  title: yup
    .string()
    .required('Title is required')
    .min(5, 'Title must be at least 5 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(20, 'Description must be at least 20 characters'),
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be positive'),
  categoryId: yup.string().required('Category is required'),
  condition: yup
    .mixed<AdCondition>()
    .oneOf(Object.values(AdCondition))
    .required('Condition is required'),
  location: yup.string().required('Location is required'),
  negotiable: yup.boolean().default(false),
  features: yup.string().optional(),
});

export default function CreateAdPage() {
  const router = useRouter();
  const createAd = useCreateAd();
  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data || [];

  const [images, setImages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: CreateAdFormData) => {
    const adData = {
      ...data,
      images,
      features: data.features
        ? data.features.split(',').map((f: string) => f.trim())
        : [],
    };

    createAd.mutate(adData, {
      onSuccess: (ad) => {
        router.push(`/ad/${ad.id}`);
      },
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // For demo, just add placeholder URLs
    const newImages = Array.from(e.target.files || []).map(
      (_, index) => `/placeholder-${images.length + index + 1}.jpg`
    );
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Ad</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            {...register('categoryId')}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select a category</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            {...register('title')}
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Enter ad title"
          />
          {errors.title && (
            <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Describe your item"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              {...register('price')}
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>
          <div className="flex items-center">
            <input
              {...register('negotiable')}
              type="checkbox"
              className="mr-2"
            />
            <label className="text-sm">Negotiable</label>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium mb-1">Condition *</label>
          <select
            {...register('condition')}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select condition</option>
            <option value={AdCondition.NEW}>New</option>
            <option value={AdCondition.LIKE_NEW}>Like New</option>
            <option value={AdCondition.GOOD}>Good</option>
            <option value={AdCondition.FAIR}>Fair</option>
            <option value={AdCondition.POOR}>Poor</option>
          </select>
          {errors.condition && (
            <p className="text-red-500 text-sm mt-1">
              {errors.condition.message}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location *</label>
          <input
            {...register('location')}
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="City, State"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">
              {errors.location.message}
            </p>
          )}
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Features (optional)
          </label>
          <input
            {...register('features')}
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            placeholder="Comma separated features"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Images (max 5)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative w-20 h-20">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createAd.isPending}>
            {createAd.isPending ? 'Creating...' : 'Create Ad'}
          </Button>
        </div>
      </form>
    </div>
  );
}
