'use client';

import { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { useCategoryFields } from '@/hooks/useCategories';
import { uploadAdImages } from '@/services/upload.service';
import { CategoryField } from '@/types/category';
import { toast } from 'sonner';
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

interface DynamicCategoryFieldsProps {
  categoryId: string;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  initialValues?: Record<string, any>;
}

const theme = {
  light: {
    primary: '#ef702a',
    background: '#fefaec',
    border: '#e5e5e5',
    text: '#1a1a1a',
    white: '#ffffff',
    placeholder: '#737373',
    surface: '#fafafa',
  },
  dark: {
    primary: '#ef702a',
    background: '#2a2a2a',
    border: '#404040',
    text: '#fafafa',
    white: '#1a1a1a',
    placeholder: '#a3a3a3',
    surface: '#262626',
  },
};

const getSelectStyles = (isDark: boolean) => {
  const t = isDark ? theme.dark : theme.light;

  return {
    control: (base: any) => ({
      ...base,
      borderColor: t.border,
      borderRadius: '0.5rem',
      minHeight: '42px',
      backgroundColor: t.white,
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '0.5rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      backgroundColor: t.white,
    }),
    menuList: (base: any) => ({
      ...base,
      padding: '4px',
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? t.primary
        : state.isFocused
          ? t.background
          : t.white,
      color: state.isSelected ? t.white : t.text,
      cursor: 'pointer',
      borderRadius: '0.25rem',
      margin: '2px 4px',
      padding: '8px 12px',
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '0 8px',
      backgroundColor: 'transparent',
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      padding: '0 4px',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: t.background,
      borderRadius: '0.25rem',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: t.text,
      fontSize: '0.875rem',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      borderRadius: '0 0.25rem 0.25rem 0',
      '&:hover': {
        backgroundColor: t.primary,
        color: t.white,
      },
    }),
    placeholder: (base: any) => ({
      ...base,
      color: t.placeholder,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: t.text,
    }),
    input: (base: any) => ({
      ...base,
      color: t.text,
    }),
  };
};

function matchesParentOption(parentValue: any, expectedOption?: string | null): boolean {
  if (!expectedOption) return true;
  if (parentValue === undefined || parentValue === null || parentValue === '') {
    return false;
  }
  if (Array.isArray(parentValue)) {
    return parentValue.map(String).includes(expectedOption);
  }
  if (typeof parentValue === 'string' && parentValue.includes(',')) {
    return parentValue
      .split(',')
      .map((s) => s.trim())
      .includes(expectedOption);
  }
  return String(parentValue) === expectedOption;
}

export const DynamicCategoryFields = ({
  categoryId,
  register,
  errors,
  setValue,
  watch,
  initialValues,
}: DynamicCategoryFieldsProps) => {
  const { data: fields, isLoading } = useCategoryFields(categoryId);
  const [uploadingFieldIds, setUploadingFieldIds] = useState<Record<string, boolean>>({});
  const watchedDynamicFields = watch('dynamicFields') || {};

  const isDark = useMemo(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  }, []);

  const selectStyles = useMemo(() => getSelectStyles(isDark), [isDark]);

  // Populate initial values across all tree levels (1st, 2nd, 3rd+ depth)
  useEffect(() => {
    if (!fields || !initialValues) return;
    const applyInitialRecursive = (nodes: CategoryField[]) => {
      for (const field of nodes) {
        const val =
          initialValues[field.id] !== undefined
            ? initialValues[field.id]
            : initialValues[field.name];
        if (val !== undefined) {
          setValue(`dynamicFields.${field.id}`, val, {
            shouldValidate: false,
          });
        }
        if (field.children && field.children.length > 0) {
          applyInitialRecursive(field.children);
        }
      }
    };
    applyInitialRecursive(fields);
  }, [fields, initialValues, setValue]);

  // Flatten root fields + any conditional children/grandchildren whose parent option is active
  const visibleFields = useMemo(() => {
    if (!fields) return [];
    const result: Array<{ field: CategoryField; depth: number }> = [];
    const walk = (nodes: CategoryField[], depth: number) => {
      for (const node of nodes) {
        result.push({ field: node, depth });
        if (node.children && node.children.length > 0) {
          const parentVal =
            watchedDynamicFields[node.id] ??
            initialValues?.[node.id] ??
            initialValues?.[node.name];
          const activeChildren = node.children.filter((child) =>
            matchesParentOption(parentVal, child.parentOptionValue)
          );
          if (activeChildren.length > 0) {
            walk(activeChildren, depth + 1);
          }
        }
      }
    };
    walk(fields, 0);
    return result;
  }, [fields, watchedDynamicFields, initialValues]);

  const handleCheckboxChange = (
    fieldId: string,
    options: { value: string; label: string }[]
  ) => {
    const values = options.map((opt) => opt.value);
    setValue(`dynamicFields.${fieldId}`, values, { shouldValidate: true });
  };

  const handleBooleanChange = (fieldId: string, checked: boolean) => {
    setValue(`dynamicFields.${fieldId}`, checked, { shouldValidate: true });
  };

  const handleImageFieldUpload = async (field: CategoryField, file?: File) => {
    if (!file) return;
    setUploadingFieldIds((prev) => ({ ...prev, [field.id]: true }));
    try {
      const urls = await uploadAdImages([file]);
      if (urls && urls.length > 0) {
        setValue(`dynamicFields.${field.id}`, urls[0], {
          shouldValidate: true,
        });
        toast.success(`${field.label} uploaded`);
      }
    } catch (err) {
      console.error('Failed to upload field image:', err);
      toast.error(`Failed to upload ${field.label}`);
    } finally {
      setUploadingFieldIds((prev) => ({ ...prev, [field.id]: false }));
    }
  };

  if (isLoading)
    return (
      <div className="text-text-light-gray py-4">
        Loading specific fields...
      </div>
    );
  if (!visibleFields || visibleFields.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-b border-border-custom py-6 my-6">
      <h3 className="text-lg font-semibold text-text">Detailed Attributes</h3>
      <div
        className={`grid grid-cols-1 ${visibleFields.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}
      >
        {visibleFields.map(({ field, depth }) => {
          const currentVal = watch(`dynamicFields.${field.id}`);
          const isUploading = !!uploadingFieldIds[field.id];

          return (
            <div
              key={field.id}
              className={`flex flex-col ${depth > 0 ? 'pl-3 border-l-2 border-primary/40' : ''}`}
            >
              <label className="text-sm font-medium mb-1 text-text flex items-center gap-1.5">
                <span>
                  {field.label}{' '}
                  {field.isRequired && <span className="text-error">*</span>}
                </span>
                {depth > 0 && field.parentOptionValue && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-normal">
                    {field.parentOptionValue}
                  </span>
                )}
              </label>

              {field.type === 'SELECT' ? (
                <select
                  {...register(`dynamicFields.${field.id}`, {
                    required: field.isRequired
                      ? `${field.label} is required`
                      : false,
                  })}
                  className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all bg-background"
                >
                  <option value="">Select option</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'RADIO' ? (
                <div className="flex flex-wrap gap-4 mt-1">
                  {field.options?.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register(`dynamicFields.${field.id}`, {
                          required: field.isRequired
                            ? `${field.label} is required`
                            : false,
                        })}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-text font-medium text-sm">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
              ) : field.type === 'CHECKBOX' ? (
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  hideSelectedOptions={false}
                  options={field.options}
                  value={
                    field.options?.filter((opt) => {
                      const currentValue = watch(`dynamicFields.${field.id}`);
                      if (Array.isArray(currentValue)) {
                        return currentValue.includes(opt.value);
                      }
                      if (typeof currentValue === 'string') {
                        return currentValue.split(',').includes(opt.value);
                      }
                      return false;
                    }) || []
                  }
                  onChange={(selected) =>
                    handleCheckboxChange(
                      field.id,
                      selected as { value: string; label: string }[]
                    )
                  }
                  placeholder={`Select ${field.label.toLowerCase()}`}
                  styles={selectStyles}
                />
              ) : field.type === 'IMAGE' ? (
                <div className="space-y-2">
                  <input
                    type="hidden"
                    {...register(`dynamicFields.${field.id}`, {
                      required: field.isRequired
                        ? `${field.label} is required`
                        : false,
                    })}
                  />
                  {currentVal ? (
                    <div className="relative rounded-lg border border-border-custom p-2 bg-background flex items-center gap-3">
                      <img
                        src={currentVal}
                        alt={field.label}
                        className="w-20 h-20 object-cover rounded-md border border-border-custom"
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          {isUploading ? 'Uploading...' : 'Replace Image'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploading}
                            onChange={(e) =>
                              handleImageFieldUpload(
                                field,
                                e.target.files?.[0]
                              )
                            }
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setValue(`dynamicFields.${field.id}`, '', {
                              shouldValidate: true,
                            })
                          }
                          className="text-xs text-error hover:underline text-left"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border-custom hover:border-primary/60 rounded-lg p-4 cursor-pointer transition-colors bg-background">
                      <span className="text-sm font-medium text-primary">
                        {isUploading
                          ? 'Uploading image...'
                          : `Upload ${field.label}`}
                      </span>
                      <span className="text-xs text-text-light-gray mt-1">
                        PNG, JPG or WEBP
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) =>
                          handleImageFieldUpload(field, e.target.files?.[0])
                        }
                      />
                    </label>
                  )}
                </div>
              ) : field.type === 'TEXTAREA' ? (
                <textarea
                  {...register(`dynamicFields.${field.id}`, {
                    required: field.isRequired
                      ? `${field.label} is required`
                      : false,
                  })}
                  className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                  rows={3}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : field.type === 'BOOLEAN' ? (
                <div className="flex items-center mt-2 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`dynamicFields.${field.id}`, {
                        required: field.isRequired
                          ? `${field.label} is required`
                          : false,
                      })}
                      onChange={(e) =>
                        handleBooleanChange(field.id, e.target.checked)
                      }
                      className="w-5 h-5 text-primary rounded focus:ring-primary border-border-custom"
                    />
                    <span className="text-text">Yes</span>
                  </label>
                </div>
              ) : field.type === 'DATE' ? (
                <input
                  type="date"
                  {...register(`dynamicFields.${field.id}`, {
                    required: field.isRequired
                      ? `${field.label} is required`
                      : false,
                  })}
                  className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              ) : field.type === 'NUMBER' ? (
                <input
                  type="number"
                  {...register(`dynamicFields.${field.id}`, {
                    required: field.isRequired
                      ? `${field.label} is required`
                      : false,
                  })}
                  className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              ) : (
                <input
                  type="text"
                  {...register(`dynamicFields.${field.id}`, {
                    required: field.isRequired
                      ? `${field.label} is required`
                      : false,
                  })}
                  className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              {(errors.dynamicFields as any)?.[field.id] && (
                <span className="text-error text-xs mt-1">
                  {((errors.dynamicFields as any)?.[field.id] as any)?.message}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
