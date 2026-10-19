'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';
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
    ? 'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition hover:opacity-90'
    : 'inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-bold transition hover:bg-white/10';
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
  const touchStartX = useRef<number | null>(null);

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
              className="relative flex h-[380px] w-full shrink-0 items-center justify-center overflow-hidden px-5 py-10 text-center sm:h-[440px] md:h-[520px] md:px-8 md:py-16"
              style={{
                backgroundColor: banner.backgroundColor || '#ef702a',
                color: textColor,
              }}
              aria-hidden={slideIndex !== index}
            >
              {imageUrl && (
                <OptimizedImage
                  src={imageUrl}
                  alt={banner.altText || banner.title}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority={slideIndex === 0}
                />
              )}

              {imageUrl && banner.imageOverlay && (
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(0,0,0,0.56), rgba(0,0,0,0.28), rgba(0,0,0,0.56))',
                  }}
                />
              )}

              <div className="relative z-10 max-w-3xl">
                <h2 className="text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed opacity-95 md:text-lg">
                    {banner.subtitle}
                  </p>
                )}

                {(banner.primaryCtaLabel && banner.primaryCtaUrl) ||
                (banner.secondaryCtaLabel && banner.secondaryCtaUrl) ? (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
            className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 md:left-6 md:h-12 md:w-12"
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
            className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 md:right-6 md:h-12 md:w-12"
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
