import { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-lg border border-border-custom bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1">{label}</span>
      {children}
      {hint && !error && (
        <span className="block text-xs text-text-gray mt-1">{hint}</span>
      )}
      {error && <span className="block text-xs text-error mt-1">{error}</span>}
    </label>
  );
}

/** "2026-12-05T09:00" for datetime-local inputs, in local time. */
export function toLocalInput(iso: string | null | undefined, dateOnly = false) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dateOnly ? date : `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}
