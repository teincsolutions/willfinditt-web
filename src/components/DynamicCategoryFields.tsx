'use client';

import { useCategoryFields } from '@/hooks/useCategories';
import { UseFormRegister, FieldErrors } from 'react-hook-form';

interface DynamicCategoryFieldsProps {
  categoryId: string;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
}

export const DynamicCategoryFields = ({
  categoryId,
  register,
  errors,
}: DynamicCategoryFieldsProps) => {
  const { data: fields, isLoading } = useCategoryFields(categoryId);

  if (isLoading) return <div className="text-text-light-gray py-4">Loading specific fields...</div>;
  if (!fields || fields.length === 0) return null;

  return (
    <div className="space-y-4 border-t border-b border-border-custom py-6 my-6">
      <h3 className="text-lg font-semibold text-text">Detailed Attributes</h3>
      <div className={`grid grid-cols-1 ${fields.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}>
        {fields.map((field) => (
          <div key={field.id} className="flex flex-col">
            <label className="text-sm font-medium mb-1 text-text">
              {field.label} {field.isRequired && <span className="text-error">*</span>}
            </label>

            {/* Render input based on type */}
            {field.type === 'SELECT' ? (
              <select
                {...register(`dynamicFields.${field.id}`, { required: field.isRequired ? `${field.label} is required` : false })}
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
               <div className="flex flex-col gap-2 mt-1">
                 {field.options?.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={opt.value}
                        {...register(`dynamicFields.${field.id}`, { required: field.isRequired ? `${field.label} is required` : false })}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-text font-medium text-sm">{opt.label}</span>
                    </label>
                 ))}
               </div>
            ) : field.type === 'TEXTAREA' ? (
              <textarea
                {...register(`dynamicFields.${field.id}`, { required: field.isRequired ? `${field.label} is required` : false })}
                className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                rows={3}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : field.type === 'BOOLEAN' || field.type === 'CHECKBOX' ? (
               <div className="flex items-center mt-2 h-[42px]">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`dynamicFields.${field.id}`, { required: field.isRequired ? `${field.label} is required` : false })}
                      className="w-5 h-5 text-primary rounded focus:ring-primary border-border-custom"
                    />
                    <span className="text-text">Yes</span>
                 </label>
               </div>
            ) : (
              <input
                type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                {...register(`dynamicFields.${field.id}`, { required: field.isRequired ? `${field.label} is required` : false })}
                className="border border-border-custom rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder={field.type === 'DATE' ? '' : `Enter ${field.label.toLowerCase()}`}
              />
            )}

            {(errors.dynamicFields as any)?.[field.id] && (
               <span className="text-error text-xs mt-1">{((errors.dynamicFields as any)?.[field.id] as any)?.message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
