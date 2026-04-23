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

const selectStyles = {
  control: (base: any) => ({
    ...base,
    borderColor: 'var(--color-border-custom)',
    borderRadius: '0.5rem',
    padding: '2px',
    '&:hover': {
      borderColor: 'var(--color-primary)',
    },
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  menuList: (base: any) => ({
    ...base,
    padding: '4px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'var(--color-primary)'
      : state.isFocused
        ? 'var(--color-background-primary)'
        : 'white',
    color: state.isSelected ? 'white' : 'var(--color-text)',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: state.isSelected
        ? 'var(--color-primary)'
        : 'var(--color-background-primary)',
    },
  }),
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

  useEffect(() => {
    if (fields && initialValues) {
      fields.forEach((field) => {
        const key = field.name;
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
                {...register(`dynamicFields.${field.name}`, {
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
                      {...register(`dynamicFields.${field.name}`, {
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
                    const currentValue = watch(`dynamicFields.${field.name}`);
                    return currentValue?.includes(opt.value);
                  }) || []
                }
                onChange={(selected) =>
                  handleCheckboxChange(
                    field.name,
                    selected as { value: string; label: string }[]
                  )
                }
                placeholder={`Select ${field.label.toLowerCase()}`}
                styles={selectStyles}
              />
            ) : field.type === 'TEXTAREA' ? (
              <textarea
                {...register(`dynamicFields.${field.name}`, {
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
                    {...register(`dynamicFields.${field.name}`, {
                      required: field.isRequired
                        ? `${field.label} is required`
                        : false,
                    })}
                    onChange={(e) =>
                      handleBooleanChange(field.name, e.target.checked)
                    }
                    className="w-5 h-5 text-primary rounded focus:ring-primary border-border-custom"
                  />
                  <span className="text-text">Yes</span>
                </label>
              </div>
            ) : field.type === 'DATE' ? (
              <input
                type="date"
                {...register(`dynamicFields.${field.name}`, {
                  required: field.isRequired
                    ? `${field.label} is required`
                    : false,
                })}
                className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            ) : field.type === 'NUMBER' ? (
              <input
                type="number"
                {...register(`dynamicFields.${field.name}`, {
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
                {...register(`dynamicFields.${field.name}`, {
                  required: field.isRequired
                    ? `${field.label} is required`
                    : false,
                })}
                className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}

            {(errors.dynamicFields as any)?.[field.name] && (
              <span className="text-error text-xs mt-1">
                {((errors.dynamicFields as any)?.[field.name] as any)?.message}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
