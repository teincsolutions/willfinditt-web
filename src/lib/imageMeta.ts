import type { AdImageMeta } from '@/types/ad';

/**
 * Image layout helpers.
 *
 * The API returns per-image metadata (thumbnail URL + original pixel size)
 * alongside every ad's image list. Using it lets a card reserve the exact
 * space the image will need, so the grid never reflows once pictures
 * arrive, and lets the small thumbnail paint straight away.
 */

/** Metadata for one image of an ad, if the API supplied any. */
export function getImageMeta(
  ad: { imageMeta?: AdImageMeta[] } | undefined,
  index = 0
): AdImageMeta | undefined {
  return ad?.imageMeta?.[index];
}

/**
 * CSS `aspect-ratio` value for an image, following the original dimensions.
 *
 * The ratio is clamped so a very tall panorama or a very wide banner cannot
 * produce a card that is unusably tall or thin. Returns `undefined` when the
 * API sent no dimensions, letting the caller fall back to a default ratio.
 */
export function imageAspectRatio(
  meta: AdImageMeta | undefined,
  { min = 0.6, max = 1.8 }: { min?: number; max?: number } = {}
): string | undefined {
  if (!meta?.width || !meta?.height) return undefined;
  const ratio = meta.height / meta.width;
  if (!Number.isFinite(ratio) || ratio <= 0) return undefined;
  const clamped = Math.min(max, Math.max(min, ratio));
  return `${1 / clamped} / 1`;
}
