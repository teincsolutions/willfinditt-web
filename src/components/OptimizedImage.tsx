'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { getAccessToken } from '@/lib/auth';
import { needsSignedUrl } from '@/lib/s3Utils';
import { getSignedUrl } from '@/services/upload.service';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Extra attempts on top of the first one. */
const MAX_RETRIES = 3;
/** Backoff before each retry, in milliseconds. */
const RETRY_DELAYS = [600, 1800, 4500];

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  containerClassName?: string;
  /** Full-quality image URL. */
  src: string;
  /** Small rendition, painted first while `src` loads. */
  thumbnailSrc?: string | null;
  /** Called once the full-quality image has been painted. */
  onFullLoaded?: () => void;
}

/**
 * Progressive image loading.
 *
 * Paints the small thumbnail straight away, then fades the full-quality
 * image in over it once it arrives. If the full image fails it is retried
 * with exponential backoff and the thumbnail stays on screen, so a slow or
 * broken original never leaves an empty card.
 *
 * The thumbnail is roughly 7x smaller than the processed original, so a card
 * is readable long before the full image arrives.
 */
export const OptimizedImage = ({
  src,
  thumbnailSrc,
  alt,
  className,
  containerClassName,
  onFullLoaded,
  ...props
}: OptimizedImageProps) => {
  const [retryCount, setRetryCount] = useState(0);
  const [displaySrc, setDisplaySrc] = useState('');
  const [thumbSrc, setThumbSrc] = useState('');
  const [showFull, setShowFull] = useState(false);
  const [hasPainted, setHasPainted] = useState(false);
  // The thumbnail is unmounted once the cross-fade is done, so it does not
  // sit in the DOM holding on to a decoded bitmap for the rest of the page's
  // life.
  const [keepThumb, setKeepThumb] = useState(true);

  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullLoaded = useRef(false);

  // Resolve s3:// keys to signed URLs for both the full image and the
  // thumbnail.
  useEffect(() => {
    let cancelled = false;

    const resolve = async (value?: string | null) => {
      if (!value) return '';
      if (needsSignedUrl(value)) {
        if (!getAccessToken()) return '';
        try {
          return await getSignedUrl(value);
        } catch (error) {
          console.error('Failed to get signed URL:', error);
          return value;
        }
      }
      return value;
    };

    const run = async () => {
      const [full, thumb] = await Promise.all([
        resolve(src),
        resolve(thumbnailSrc),
      ]);
      if (cancelled) return;
      setDisplaySrc(full);
      setThumbSrc(thumb);
      // Nothing to load (private image, logged out): stop the loading pulse.
      if (!full && !thumb) setHasPainted(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [src, thumbnailSrc]);

  // Reset whenever the image changes.
  useEffect(() => {
    setShowFull(false);
    setHasPainted(false);
    setRetryCount(0);
    setKeepThumb(true);
    fullLoaded.current = false;
    setDisplaySrc('');
    setThumbSrc('');
  }, [src, thumbnailSrc]);

  useEffect(
    () => () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    },
    []
  );

  const isSmall =
    (props.width && Number(props.width) < 150) ||
    (props.height && Number(props.height) < 150);

  const handleFullError = () => {
    if (retryCount < MAX_RETRIES) {
      // The key on the image changes with retryCount, so remounting it is
      // what actually re-requests the picture.
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => {
        setRetryCount((c) => c + 1);
      }, RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]);
    }
    // Otherwise the thumbnail simply stays on screen; the card is still
    // usable and the ad is still readable.
  };

  // Dimensions for both image layers. In `fill` mode the image is sized by
  // its positioned parent instead, so no width/height is passed.
  const sizeProps = {
    width: props.width || (!props.fill ? 1200 : undefined),
    height: props.height || (!props.fill ? 800 : undefined),
  };

  // The thumbnail is drawn over the full image, so it needs the same
  // object-fit. Callers that want a different fit say so in className.
  const thumbObjectFit = className?.includes('object-contain')
    ? 'object-contain'
    : 'object-cover';

  return (
    <div
      className={cn(
        'overflow-hidden bg-background-primary/30',
        props.fill
          ? 'absolute inset-0 w-full h-full'
          : 'relative inline-block max-w-full',
        !hasPainted && !props.fill && !isSmall ? 'min-h-[200px]' : '',
        containerClassName
      )}
    >
      {!hasPainted && (
        <div className="absolute inset-0 animate-pulse bg-background-primary z-10 transition-opacity duration-300" />
      )}

      {/* Full-quality image. Sits underneath the thumbnail, then fades in. */}
      {displaySrc && (
        <Image
          key={`${displaySrc}-${retryCount}`}
          fill={props.fill}
          src={displaySrc}
          alt={alt}
          {...sizeProps}
          {...props}
          className={cn(
            'transition-all duration-700 ease-in-out',
            !props.fill && !props.width && !props.height
              ? 'w-full h-auto'
              : '',
            showFull ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
            className
          )}
          onLoad={() => {
            setHasPainted(true);
            if (!fullLoaded.current) {
              fullLoaded.current = true;
              setShowFull(true);
              onFullLoaded?.();
              // Drop the thumbnail once the cross-fade has finished.
              if (fadeTimer.current) clearTimeout(fadeTimer.current);
              fadeTimer.current = setTimeout(() => setKeepThumb(false), 800);
            }
          }}
          onError={handleFullError}
          unoptimized
        />
      )}

      {/* Thumbnail, painted immediately and cross-faded out once the full
          image has arrived. It is an overlay, so the card never changes
          size. */}
      {thumbSrc && keepThumb && (
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            showFull ? 'opacity-0' : 'opacity-100'
          )}
        >
          <Image
            fill
            src={thumbSrc}
            alt={alt}
            className={cn(thumbObjectFit, className)}
            onLoad={() => setHasPainted(true)}
            unoptimized
            aria-hidden
          />
        </div>
      )}
    </div>
  );
};
