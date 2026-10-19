import { format } from 'date-fns';

/**
 * Posting-time display.
 *
 * Shows a relative time ("3h ago", "2d ago") for recent ads and falls back to
 * an absolute date once the ad is older than the configurable cut-off.
 *
 * The cut-off is read from `NEXT_PUBLIC_SHOW_TIME_AGO_DAYS` (default 30). As
 * with every `NEXT_PUBLIC_*` value it is baked in at build time.
 */
const parsedCutoff = Number(process.env.NEXT_PUBLIC_SHOW_TIME_AGO_DAYS);
export const SHOW_TIME_AGO_DAYS =
  Number.isFinite(parsedCutoff) && parsedCutoff > 0 ? parsedCutoff : 30;

export function formatPostedDate(input?: string | Date | null): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  // Guard against clock skew / future timestamps.
  if (diffMs < 0) return format(date, 'MMM d, yyyy');

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < SHOW_TIME_AGO_DAYS) return `${days}d ago`;

  return format(date, 'MMM d, yyyy');
}

/** Absolute month/year, e.g. "Mar 2024" — for "member since" style labels. */
export function formatMonthYear(input?: string | Date | null): string {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'MMM yyyy');
}
