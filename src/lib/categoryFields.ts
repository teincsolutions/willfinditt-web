import { CategoryField } from '@/types/category';

/**
 * Helpers for the v2 category field tree, where a conditional sub-field is
 * nested under its parent field and shown only while the parent has the
 * sub-field's `parentOptionValue` selected.
 */

// Whether `option` is selected in a field value. CHECKBOX values may be an
// array or a comma-separated string.
export const isOptionSelected = (value: unknown, option: string): boolean => {
  if (Array.isArray(value)) return value.map(String).includes(option);
  if (value === undefined || value === null || value === '') return false;
  const str = String(value);
  return str === option || str.split(',').includes(option);
};

// Sub-fields of `field` that are visible for its current value.
export const getActiveChildren = (
  field: CategoryField,
  value: unknown
): CategoryField[] =>
  (field.children || []).filter(
    (child) =>
      child.parentOptionValue != null &&
      isOptionSelected(value, child.parentOptionValue)
  );

// Every field in the tree, each parent followed by its sub-fields.
export const flattenFieldTree = (fields: CategoryField[]): CategoryField[] =>
  fields.flatMap((field) => [field, ...flattenFieldTree(field.children || [])]);

// IDs of the fields that are visible for the given values (keyed by field ID).
export const getVisibleFieldIds = (
  fields: CategoryField[],
  values: Record<string, unknown>
): Set<string> => {
  const visible = new Set<string>();
  const walk = (nodes: CategoryField[]) => {
    nodes.forEach((field) => {
      visible.add(field.id);
      walk(getActiveChildren(field, values[field.id]));
    });
  };
  walk(fields);
  return visible;
};
