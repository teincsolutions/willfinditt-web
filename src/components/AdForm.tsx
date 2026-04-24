'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AdCondition, Ad } from '@/types/ad';
import { useParentCategories, useSubcategories } from '@/hooks/useCategories';
import { useCountries, useStates, useCities } from '@/hooks/useLocations';
import { Button } from '@/components/Button';
import { ImageUploader } from '@/components/ImageUploader';
import { DynamicCategoryFields } from '@/components/DynamicCategoryFields';
import { useAuth } from '@/contexts/AuthContext';
import { SearchableSelect } from './SearchableSelect';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

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
    .min(0, 'Price must be positive or zero'),
  currency: yup.string().default('GHS'),
  condition: yup
    .mixed<AdCondition>()
    .oneOf([...Object.values(AdCondition), ''] as any)
    .optional(),
  categoryId: yup.string().required('Category is required'),
  stateId: yup.string().required('Region/State is required'),
  cityId: yup.string().required('City is required'),
  address: yup.string().required('Specific address is required'),
  contactPhone: yup.string().required('Contact phone is required'),
  contactEmail: yup
    .string()
    .email('Invalid email')
    .required('Contact email is required'),
  isNegotiable: yup.boolean().default(false),
  dynamicFields: yup.object().optional(),
});

type AdFormData = yup.InferType<typeof schema>;

interface AdFormProps {
  initialData?: Partial<Ad>;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  submitLabel: string;
}

export const AdForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitLabel,
}: AdFormProps) => {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  const { data: parentCategories } = useParentCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<AdFormData>({
    resolver: yupResolver(schema as any),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      currency: initialData?.currency || 'GHS',
      condition: initialData?.condition || undefined,
      categoryId: initialData?.category?.id || '',
      stateId: initialData?.city?.state?.id || '',
      cityId: initialData?.city?.id || '',
      address: initialData?.address || '',
      contactPhone: initialData?.contactPhone || user?.phone || '',
      contactEmail: initialData?.contactEmail || user?.email || '',
      isNegotiable: initialData?.isNegotiable || false,
      dynamicFields:
        (initialData?.fieldValues || []).reduce((acc: any, f: any) => {
          const fieldName = f.categoryField?.name || f.categoryFieldId;
          const fieldType = f.categoryField?.type;
          if (fieldType === 'CHECKBOX') {
            const val = f.value;
            if (typeof val === 'string' && val.includes(',')) {
              acc[fieldName] = val.split(',');
            } else if (typeof val === 'string') {
              try {
                acc[fieldName] = JSON.parse(val);
              } catch {
                acc[fieldName] = [];
              }
            } else {
              acc[fieldName] = val;
            }
          } else {
            acc[fieldName] = f.value;
          }
          return acc;
        }, {}) || {},
    },
  });

  const categoryId = watch('categoryId');
  const stateId = watch('stateId');
  const { data: subcategories } = useSubcategories(selectedParentId);

  // Categories Effect
  useEffect(() => {
    if (initialData?.category?.id && parentCategories && !selectedParentId) {
      const parent = parentCategories.find(
        (p) =>
          p.id === initialData.category?.id ||
          p.children?.some((c: any) => c.id === initialData.category?.id)
      );
      if (parent) {
        setSelectedParentId(parent.id);
      }
    }
  }, [initialData, parentCategories, selectedParentId]);

  // Locations
  const { data: countries } = useCountries();
  const ghanaId = useMemo(
    () => countries?.find((c) => c.code === 'GHA' || c.code === 'GH')?.id,
    [countries]
  );
  const { data: states } = useStates(ghanaId);
  const { data: cities } = useCities(stateId);

  const handleFormSubmit = (data: AdFormData) => {
    const dynamicFieldsData = data.dynamicFields || {};
    const categoryId = data.categoryId;

    const fieldValues = Object.entries(dynamicFieldsData)
      .filter(
        ([, value]) => value !== undefined && value !== '' && value !== null
      )
      .map(([fieldName, value]) => {
        let finalValue: string;

        if (Array.isArray(value)) {
          finalValue = value.join(',');
        } else if (typeof value === 'boolean') {
          finalValue = String(value);
        } else if (typeof value === 'number') {
          finalValue = String(value);
        } else {
          finalValue = String(value);
        }

        return {
          categoryFieldId: fieldName,
          value: finalValue,
        };
      });

    const adData = {
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      condition: data.condition || undefined,
      categoryId: data.categoryId,
      cityId: data.cityId,
      address: data.address,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      isNegotiable: data.isNegotiable,
      images,
      fieldValues,
    };

    onSubmit(adData);
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-8">
      {/* Section 1: Item Images */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
            1
          </span>
          Photos
        </h2>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          maxImages={5}
        />
        <p className="text-text-light-gray text-xs mt-2 italic">
          Max 5 photos allowed.
        </p>
      </div>

      <hr className="border-border-custom" />

      {/* Section 2: Basic Details */}
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
            <SearchableSelect
              options={parentCategories || []}
              value={selectedParentId}
              onChange={(val) => {
                setSelectedParentId(val);
                setValue('categoryId', '');
              }}
              placeholder="Select Category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Subcategory *
            </label>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={subcategories || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select Subcategory"
                  disabled={!selectedParentId}
                />
              )}
            />
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
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
              placeholder="E.g. Brand new iPhone 14 Pro Max 256GB"
            />
            {errors.title && (
              <p className="text-error text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Condition (Optional)
            </label>
            <select
              {...register('condition')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
            >
              <option value="">Select Condition</option>
              {Object.values(AdCondition).map((cond) => (
                <option key={cond} value={cond}>
                  {cond.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Fields Section */}
      {categoryId && (
        <DynamicCategoryFields
          categoryId={categoryId}
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          initialValues={
            initialData?.fieldValues
              ? initialData.fieldValues.reduce((acc: any, f: any) => {
                  const fieldName = f.categoryField?.name || f.categoryFieldId;
                  if (
                    f.value &&
                    typeof f.value === 'string' &&
                    f.value.includes(',')
                  ) {
                    acc[fieldName] = f.value.split(',');
                  } else {
                    acc[fieldName] = f.value;
                  }
                  return acc;
                }, {})
              : {}
          }
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
            <div className="bg-background rounded-lg overflow-hidden border border-border-custom">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    {...field}
                    modules={quillModules}
                    placeholder="Describe your item in detail. Include features, condition notes, and reason for selling."
                    className="min-h-[200px]"
                  />
                )}
              />
            </div>
            {errors.description && (
              <p className="text-error text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-text">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
              >
                <option value="GHS">Ghana Cedi (₵)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price')}
                className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
                placeholder="0.00"
              />
              <p className="text-text-light-gray text-[10px] mt-1 italic">
                Set price to zero if you want to display "Contact for Price"
              </p>
              {errors.price && (
                <p className="text-error text-sm mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div className="flex items-center h-full pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isNegotiable')}
                  className="w-5 h-5 text-primary rounded focus:ring-primary border-border-custom"
                />
                <span className="text-sm font-medium text-text">
                  Price is negotiable
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border-custom" />

      {/* Section 4: Contact Info */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
            4
          </span>
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Contact Phone *
            </label>
            <input
              type="tel"
              {...register('contactPhone')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
              placeholder="+233..."
            />
            {errors.contactPhone && (
              <p className="text-error text-sm mt-1">
                {errors.contactPhone.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Contact Email *
            </label>
            <input
              type="email"
              {...register('contactEmail')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
              placeholder="example@email.com"
            />
            {errors.contactEmail && (
              <p className="text-error text-sm mt-1">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-border-custom" />

      {/* Section 5: Location */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
            5
          </span>
          Location
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Region/State *
            </label>
            <Controller
              name="stateId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={states || []}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue('cityId', '');
                  }}
                  placeholder="Select Region"
                  disabled={!ghanaId}
                />
              )}
            />
            {errors.stateId && (
              <p className="text-error text-sm mt-1">
                {errors.stateId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              City *
            </label>
            <Controller
              name="cityId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={cities || []}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select City"
                  disabled={!stateId}
                />
              )}
            />
            {errors.cityId && (
              <p className="text-error text-sm mt-1">{errors.cityId.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-text">
            Specific Address *
          </label>
          <input
            type="text"
            {...register('address')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
            placeholder="Street address, landmarks, etc."
          />
          {errors.address && (
            <p className="text-error text-sm mt-1">{errors.address.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-6 border-t border-border-custom flex items-center justify-end gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg text-white font-semibold py-3 px-8"
        >
          {isSubmitting ? 'Processing...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};
