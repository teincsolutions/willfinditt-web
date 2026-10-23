'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useHomeBanners } from '@/hooks/useHomeBanners';
import type { HomeBanner } from '@/types/home-banner';

const FALLBACK_BANNERS: HomeBanner[] = [
  {
    id: 'fallback',
    title: 'Find What You Need',
    subtitle:
      'Discover amazing deals on new and used items from trusted sellers',
    backgroundColor: '#ef702a',
    textColor: '#ffffff',
    imageOverlay: true,
    primaryCtaLabel: 'Post an Ad',
    primaryCtaUrl: '/ads/new',
    secondaryCtaLabel: 'Browse All',
    secondaryCtaUrl: '/search',
    isActive: true,
    sortOrder: 0,
  },
];

function CtaButton({
  label,
  href,
  primary,
  color,
}: {
  label: string;
  href: string;
  primary?: boolean;
  color: string;
}) {
  const external = /^https?:\/\//i.test(href);
  const className = primary
    ? 'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-bold transition hover:opacity-90 sm:px-6 sm:py-3 sm:text-sm'
    : 'inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-bold transition hover:bg-white/10 sm:px-6 sm:py-3 sm:text-sm';
  const style = primary
    ? { backgroundColor: color, color: '#1a1a1a' }
    : { borderColor: color, color };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      {label}
    </Link>
  );
}

export function HomeHeroCarousel() {
  const { data } = useHomeBanners();
  const banners = data?.length ? data : FALLBACK_BANNERS;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Natural aspect ratio of each banner image, so the space it takes can be
  // reserved before it loads and the artwork is never cropped to fit.
  const [imageRatios, setImageRatios] = useState<Record<string, string>>({});
  const touchStartX = useRef<number | null>(null);

  const handleImageLoad = (
    bannerId: string,
    event: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;
    const ratio = `${naturalWidth} / ${naturalHeight}`;
    setImageRatios((prev) =>
      prev[bannerId] === ratio ? prev : { ...prev, [bannerId]: ratio }
    );
  };

  useEffect(() => {
    if (index > banners.length - 1) setIndex(0);
  }, [banners.length, index]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [banners.length, paused]);

  const goTo = (next: number) => {
    const count = banners.length;
    setIndex(((next % count) + count) % count);
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    goTo(index + (delta < 0 ? 1 : -1));
  };

  return (
    <section
      className="relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner, slideIndex) => {
          const textColor = banner.textColor || '#ffffff';
          const imageUrl = banner.imageUrl?.trim();

          return (
            <div
              key={banner.id}
              className="relative w-full shrink-0 overflow-hidden text-center lg:h-[520px]"
              style={{
                backgroundColor: banner.backgroundColor || '#ef702a',
                color: textColor,
              }}
              aria-hidden={slideIndex !== index}
            >
              {/* Banner artwork is authored very wide (roughly 2.3:1). On a
                  phone the hero is far narrower than it is tall, so filling it
                  with `object-cover` cropped off most of the artwork - the
                  subject and the brand logo ended up outside the frame.
                  Below `lg` the artwork keeps its own aspect ratio, so the
                  whole banner is visible and the slide is only as tall as the
                  artwork itself - the compact slider the mobile app shows.
                  From `lg` up it keeps filling the hero the way it always
                  has. */}
              <div
                className="relative w-full lg:absolute lg:inset-0 lg:h-full"
                style={
                  {
                    aspectRatio: imageRatios[banner.id] ?? '7 / 3',
                  } as React.CSSProperties
                }
              >
                {imageUrl && (
                  // The banner artwork is served from a host that is not in
                  // the Next image loader's allow-list, and is already a
                  // compressed PNG.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={banner.altText || banner.title || ''}
                    onLoad={(event) => handleImageLoad(banner.id, event)}
                    className="h-full w-full object-contain lg:object-cover"
                  />
                )}
              </div>

              {imageUrl && banner.imageOverlay && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(0,0,0,0.56), rgba(0,0,0,0.28), rgba(0,0,0,0.56))',
                  }}
                />
              )}

              <div className="absolute inset-0 flex flex-col items-center justify-center px-5 pb-8 pt-4 lg:mx-auto lg:max-w-3xl lg:px-8 lg:py-16">
                {banner.title && (
                  <h2 className="text-xl font-extrabold leading-tight sm:text-2xl lg:text-5xl xl:text-6xl">
                    {banner.title}
                  </h2>
                )}
                {banner.subtitle && (
                  <p className="mx-auto mt-1.5 max-w-2xl text-xs leading-relaxed opacity-95 sm:mt-2 sm:text-sm lg:mt-4 lg:text-lg">
                    {banner.subtitle}
                  </p>
                )}

                {(banner.primaryCtaLabel && banner.primaryCtaUrl) ||
                (banner.secondaryCtaLabel && banner.secondaryCtaUrl) ? (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-4 sm:gap-3 lg:mt-8">
                    {banner.primaryCtaLabel && banner.primaryCtaUrl && (
                      <CtaButton
                        label={banner.primaryCtaLabel}
                        href={banner.primaryCtaUrl}
                        primary
                        color={textColor}
                      />
                    )}
                    {banner.secondaryCtaLabel && banner.secondaryCtaUrl && (
                      <CtaButton
                        label={banner.secondaryCtaLabel}
                        href={banner.secondaryCtaUrl}
                        color={textColor}
                      />
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 lg:left-6 lg:flex lg:h-12 lg:w-12"
          >
            <svg
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 lg:right-6 lg:flex lg:h-12 lg:w-12"
          >
            <svg
              className="h-5 w-5 md:h-6 md:w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center gap-2">
            {banners.map((banner, dotIndex) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(dotIndex)}
                aria-label={`Go to banner ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={`h-2.5 rounded-full transition-all ${
                  dotIndex === index
                    ? 'w-7 bg-white'
                    : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
