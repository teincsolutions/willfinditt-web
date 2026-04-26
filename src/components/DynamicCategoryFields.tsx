'use client';

import { useEffect, useMemo } from 'react';
import Select from 'react-select';
import { useCategoryFields } from '@/hooks/useCategories';
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

export const DynamicCategoryFields = ({
  categoryId,
  register,
  errors,
  setValue,
  watch,
  initialValues,
}: DynamicCategoryFieldsProps) => {
  const { data: fields, isLoading } = useCategoryFields(categoryId);

  const isDark = useMemo(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  }, []);

  const selectStyles = useMemo(() => getSelectStyles(isDark), [isDark]);

  useEffect(() => {
    if (fields && initialValues) {
      fields.forEach((field) => {
        const key = field.id;
        if (initialValues[key] !== undefined) {
          setValue(`dynamicFields.${key}`, initialValues[key], {
            shouldValidate: false,
          });
        }
      });
    }
  }, [fields, initialValues, setValue]);

  const handleCheckboxChange = (
    fieldName: string,
    options: { value: string; label: string }[]
  ) => {
    const values = options.map((opt) => opt.value);
    setValue(`dynamicFields.${fieldName}`, values, { shouldValidate: true });
  };

  const handleBooleanChange = (fieldName: string, checked: boolean) => {
    setValue(`dynamicFields.${fieldName}`, checked, { shouldValidate: true });
  };

  if (isLoading)
    return (
      <div className="text-text-light-gray py-4">
        Loading specific fields...
      </div>
    );
  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-b border-border-custom py-6 my-6">
      <h3 className="text-lg font-semibold text-text">Detailed Attributes</h3>
      <div
        className={`grid grid-cols-1 ${fields.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}
      >
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-text">
              {field.label}{' '}
              {field.isRequired && <span className="text-error">*</span>}
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
                    return currentValue?.includes(opt.value);
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
        ))}
      </div>
    </div>
  );
};
