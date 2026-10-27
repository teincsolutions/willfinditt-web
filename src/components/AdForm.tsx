'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { AdCondition, Ad } from '@/types/ad';
import {
  useParentCategories,
  useSubcategories,
  useCategoryFields,
} from '@/hooks/useCategories';
import { useCountries, useStates, useCities } from '@/hooks/useLocations';
import { Button } from '@/components/Button';
import { ImageUploader } from '@/components/ImageUploader';
import { DynamicCategoryFields } from '@/components/DynamicCategoryFields';
import { useAuth } from '@/contexts/AuthContext';
import { SearchableSelect } from './SearchableSelect';
import { resolveEffectiveFormConfig } from '@/lib/categoryFormConfig';
import { CategoryField } from '@/types/category';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const STORAGE_KEY = 'willfinditt_post_category_draft';

function flattenCategoryFields(fields?: CategoryField[]): CategoryField[] {
  if (!fields || !Array.isArray(fields)) return [];
  const result: CategoryField[] = [];
  const walk = (list: CategoryField[]) => {
    for (const item of list) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    }
  };
  walk(fields);
  return result;
}

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
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  const { data: parentCategories } = useParentCategories();

  const initialDynamicFields = useMemo(() => {
    return (
      (initialData?.fieldValues || []).reduce((acc: any, f: any) => {
        const fieldId = f.categoryFieldId;
        const fieldName = f.categoryField?.name || f.categoryFieldId;
        const fieldType = f.categoryField?.type;
        let parsedVal: any = f.value;
        if (fieldType === 'CHECKBOX') {
          const val = f.value;
          if (typeof val === 'string' && val.startsWith('[')) {
            try {
              parsedVal = JSON.parse(val);
            } catch {
              parsedVal = val.split(',');
            }
          } else if (typeof val === 'string' && val.includes(',')) {
            parsedVal = val.split(',');
          } else if (typeof val === 'string') {
            parsedVal = val ? [val] : [];
          }
        }
        if (fieldId) acc[fieldId] = parsedVal;
        if (fieldName) acc[fieldName] = parsedVal;
        return acc;
      }, {}) || {}
    );
  }, [initialData?.fieldValues]);

  const { data: subcategories } = useSubcategories(selectedParentId);

  const selectedParentCategory = useMemo(
    () => parentCategories?.find((p) => p.id === selectedParentId) || null,
    [parentCategories, selectedParentId]
  );

  // Build schema dynamically based on category formConfig
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialData?.category?.id || ''
  );

  const selectedSubcategory = useMemo(
    () =>
      subcategories?.find((s) => s.id === activeCategoryId) ||
      selectedParentCategory?.children?.find((c) => c.id === activeCategoryId) ||
      (initialData?.category?.id === activeCategoryId
        ? (initialData.category as any)
        : null),
    [
      subcategories,
      selectedParentCategory,
      activeCategoryId,
      initialData?.category,
    ]
  );

  const formConfig = useMemo(
    () =>
      resolveEffectiveFormConfig(selectedSubcategory, selectedParentCategory),
    [selectedSubcategory, selectedParentCategory]
  );

  const { data: categoryFieldsTree } = useCategoryFields(activeCategoryId);
  const allCategoryFields = useMemo(
    () => flattenCategoryFields(categoryFieldsTree),
    [categoryFieldsTree]
  );
  const hasImageCategoryFields = useMemo(
    () => allCategoryFields.some((f) => f.type === 'IMAGE'),
    [allCategoryFields]
  );

  const validationSchema = useMemo(
    () =>
      yup.object().shape({
        title: yup
          .string()
          .required('Title is required')
          .min(5, 'Title is too short'),
        nickname: yup.string().trim().max(60, 'Nickname is too long').optional(),
        description: formConfig.hideDescription
          ? yup.string().optional().default('')
          : yup
              .string()
              .required('Description is required')
              .min(20, 'Description is too short'),
        price: formConfig.hidePrice
          ? yup
              .number()
              .transform((val, orig) =>
                orig === '' || orig === null || orig === undefined ? 0 : val
              )
              .optional()
              .default(0)
          : yup
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
        contactPhone: formConfig.contactOptional
          ? yup.string().optional().default('')
          : yup.string().required('Contact phone is required'),
        contactPhone2: yup
          .string()
          .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, {
            message: 'Invalid phone number format',
            excludeEmptyString: true,
          })
          .optional(),
        contactEmail: formConfig.contactOptional
          ? yup
              .string()
              .transform((val) => (val === '' ? undefined : val))
              .email('Invalid email')
              .optional()
          : yup
              .string()
              .email('Invalid email')
              .required('Contact email is required'),
        isNegotiable: yup.boolean().default(false),
        dynamicFields: yup.object().optional(),
      }),
    [
      formConfig.hideDescription,
      formConfig.hidePrice,
      formConfig.contactOptional,
    ]
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(validationSchema as any),
    defaultValues: {
      title: initialData?.title || '',
      nickname: initialData?.nickname || '',
      description: initialData?.description || '',
      price: initialData?.price ?? 0,
      currency: initialData?.currency || 'GHS',
      condition: initialData?.condition || undefined,
      categoryId: initialData?.category?.id || '',
      stateId: initialData?.city?.state?.id || '',
      cityId: initialData?.city?.id || '',
      address: initialData?.address || '',
      contactPhone: initialData?.contactPhone || user?.phone || '',
      contactPhone2: initialData?.contactPhone2 || '',
      contactEmail: initialData?.contactEmail || user?.email || '',
      isNegotiable: initialData?.isNegotiable || false,
      dynamicFields: initialDynamicFields,
    },
  });

  const categoryId = watch('categoryId');
  const stateId = watch('stateId');

  useEffect(() => {
    if (categoryId !== activeCategoryId) {
      setActiveCategoryId(categoryId || '');
    }
  }, [categoryId, activeCategoryId]);

  // Categories Effect for Edit mode OR restoring draft category on New Ad page (A.4)
  useEffect(() => {
    if (!parentCategories || parentCategories.length === 0) return;

    if (initialData?.category?.id && !selectedParentId) {
      const parent = parentCategories.find(
        (p) =>
          p.id === initialData.category?.id ||
          p.children?.some((c: any) => c.id === initialData.category?.id)
      );
      if (parent) {
        setSelectedParentId(parent.id);
      } else if ((initialData.category as any)?.parent?.id) {
        setSelectedParentId((initialData.category as any).parent.id);
      }
      return;
    }

    if (!initialData && !draftRestored && typeof window !== 'undefined') {
      setDraftRestored(true);
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed?.selectedParentId &&
            parentCategories.some((p) => p.id === parsed.selectedParentId)
          ) {
            setSelectedParentId(parsed.selectedParentId);
            if (parsed.categoryId) {
              setValue('categoryId', parsed.categoryId, {
                shouldValidate: false,
              });
              setActiveCategoryId(parsed.categoryId);
            }
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [
    initialData,
    parentCategories,
    selectedParentId,
    draftRestored,
    setValue,
  ]);

  // Persist selectedParentId and categoryId in sessionStorage during new ad creation (A.4)
  useEffect(() => {
    if (initialData || !draftRestored || typeof window === 'undefined') return;
    try {
      if (selectedParentId || categoryId) {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            selectedParentId,
            categoryId: categoryId || '',
          })
        );
      }
    } catch {
      // ignore storage errors
    }
  }, [initialData, draftRestored, selectedParentId, categoryId]);

  // Locations
  const { data: countries } = useCountries();
  const ghanaId = useMemo(
    () => countries?.find((c) => c.code === 'GHA' || c.code === 'GH')?.id,
    [countries]
  );
  const { data: states } = useStates(ghanaId);
  const { data: cities } = useCities(stateId);

  const handleFormSubmit = (data: any) => {
    const dynamicFieldsData = data.dynamicFields || {};

    const validFieldIds = new Set(allCategoryFields.map((f) => f.id));
    const imageFieldIds = new Set(
      allCategoryFields.filter((f) => f.type === 'IMAGE').map((f) => f.id)
    );

    const fieldValues = Object.entries(dynamicFieldsData)
      .filter(
        ([fieldKey, value]) =>
          (validFieldIds.size === 0 || validFieldIds.has(fieldKey)) &&
          value !== undefined &&
          value !== '' &&
          value !== null
      )
      .map(([fieldName, value]) => {
        let finalValue: string;

        if (Array.isArray(value)) {
          finalValue = JSON.stringify(value);
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

    // Collect any uploaded image field URLs as fallback gallery images if main images array is empty
    const categoryImageUrls = fieldValues
      .filter((fv) => imageFieldIds.has(fv.categoryFieldId) && fv.value)
      .map((fv) => fv.value);

    const effectiveImages =
      images.length > 0 ? images : categoryImageUrls;

    const adData: Record<string, any> = {
      title: data.title,
      description: formConfig.hideDescription ? data.description || '' : data.description,
      price: formConfig.hidePrice ? undefined : Number(data.price ?? 0),
      currency: data.currency || 'GHS',
      condition: formConfig.hideCondition
        ? undefined
        : data.condition || undefined,
      categoryId: data.categoryId,
      cityId: data.cityId,
      address: data.address,
      contactPhone: data.contactPhone?.trim() || undefined,
      contactPhone2: data.contactPhone2?.trim() || null,
      contactEmail: data.contactEmail?.trim() || undefined,
      nickname: formConfig.hideSellerInfo
        ? data.nickname?.trim() || undefined
        : undefined,
      isNegotiable: formConfig.hidePrice ? false : Boolean(data.isNegotiable),
      images: effectiveImages,
      fieldValues,
      _imagesOptional: Boolean(
        formConfig.imagesOptional ||
          hasImageCategoryFields ||
          effectiveImages.length > 0
      ),
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

  const showDescriptionAndPriceSection =
    !formConfig.hideDescription || !formConfig.hidePrice;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-8">
      {/* Section 1: Item Images */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
            1
          </span>
          Photos
          {(formConfig.imagesOptional || hasImageCategoryFields) && (
            <span className="text-xs font-normal text-text-light-gray">
              (Optional)
            </span>
          )}
        </h2>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          maxImages={5}
        />
        <p className="text-text-light-gray text-xs mt-2 italic">
          {hasImageCategoryFields
            ? 'You can upload general photos here or use the dedicated image fields below (max 5 general photos).'
            : formConfig.imagesOptional
              ? 'Photos are optional for this category. Max 5 photos allowed.'
              : 'Max 5 photos allowed.'}
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
                setActiveCategoryId('');
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
                  onChange={(val) => {
                    field.onChange(val);
                    setActiveCategoryId(val);
                  }}
                  placeholder="Select Subcategory"
                  disabled={!selectedParentId}
                />
              )}
            />
            {errors.categoryId && (
              <p className="text-error text-sm mt-1">
                {errors.categoryId.message as string}
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
              placeholder="Enter a clear title for your advert"
            />
            {errors.title && (
              <p className="text-error text-sm mt-1">
                {errors.title.message as string}
              </p>
            )}
          </div>

          {formConfig.hideSellerInfo && (
            <div>
              <label className="block text-sm font-medium mb-1 text-text">
                Nickname (Displayed publicly instead of your real name)
              </label>
              <input
                type="text"
                {...register('nickname')}
                className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
                placeholder="E.g. SunnyHeart24 (leave blank to show as Anonymous)"
              />
              <p className="text-text-light-gray text-xs mt-1">
                Your real account details and seller profile will remain hidden on this advert and in chat.
              </p>
              {errors.nickname && (
                <p className="text-error text-sm mt-1">
                  {errors.nickname.message as string}
                </p>
              )}
            </div>
          )}

          {!formConfig.hideCondition && (
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
          )}
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
          initialValues={initialDynamicFields}
        />
      )}

      {showDescriptionAndPriceSection && (
        <>
          <hr className="border-border-custom" />

          {/* Section 3: Description & Price */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
                3
              </span>
              {!formConfig.hideDescription && !formConfig.hidePrice
                ? 'Description & Price'
                : !formConfig.hideDescription
                  ? 'Description'
                  : 'Price'}
            </h2>

            <div className="space-y-6">
              {!formConfig.hideDescription && (
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
                      {errors.description.message as string}
                    </p>
                  )}
                </div>
              )}

              {!formConfig.hidePrice && (
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
                      Set price to zero if you want to display &quot;Contact for Price&quot;
                    </p>
                    {errors.price && (
                      <p className="text-error text-sm mt-1">
                        {errors.price.message as string}
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
              )}
            </div>
          </div>
        </>
      )}

      <hr className="border-border-custom" />

      {/* Section 4: Contact Info */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
            {showDescriptionAndPriceSection ? '4' : '3'}
          </span>
          Contact Information
          {formConfig.contactOptional && (
            <span className="text-xs font-normal text-text-light-gray">
              (Optional)
            </span>
          )}
        </h2>
        {formConfig.contactOptional && (
          <p className="text-xs text-text-gray mb-4">
            Contact details are optional for this category. Interested users can message you directly via In-App Chat without seeing your phone number or email.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Contact Phone {formConfig.contactOptional ? '(Optional)' : '*'}
            </label>
            <input
              type="tel"
              {...register('contactPhone')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
              placeholder="+233..."
            />
            {errors.contactPhone && (
              <p className="text-error text-sm mt-1">
                {errors.contactPhone.message as string}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-text">
              Contact Email {formConfig.contactOptional ? '(Optional)' : '*'}
            </label>
            <input
              type="email"
              {...register('contactEmail')}
              className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
              placeholder="example@email.com"
            />
            {errors.contactEmail && (
              <p className="text-error text-sm mt-1">
                {errors.contactEmail.message as string}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 max-w-md">
          <label className="block text-sm font-medium mb-1 text-text">
            Second Contact Phone (optional)
          </label>
          <input
            type="tel"
            {...register('contactPhone2')}
            className="w-full border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
            placeholder="+233..."
          />
          {errors.contactPhone2 && (
            <p className="text-error text-sm mt-1">
              {errors.contactPhone2.message as string}
            </p>
          )}
        </div>
      </div>

      <hr className="border-border-custom" />

      {/* Section 5: Location */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-background-primary text-primary flex items-center justify-center text-sm font-bold">
            {showDescriptionAndPriceSection ? '5' : '4'}
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
                {errors.stateId.message as string}
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
              <p className="text-error text-sm mt-1">
                {errors.cityId.message as string}
              </p>
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
            <p className="text-error text-sm mt-1">
              {errors.address.message as string}
            </p>
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
