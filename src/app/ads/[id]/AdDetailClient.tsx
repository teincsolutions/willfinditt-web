'use client';

import { OptimizedImage } from '@/components/OptimizedImage';
import { useCategoryFieldTree } from '@/hooks/useCategories';
import { flattenFieldTree } from '@/lib/categoryFields';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { Button } from '@/components/Button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { RelatedAds } from '@/components/RelatedAds';
import { formatCurrency } from '@/lib/utils';
import { formatPostedDate, formatMonthYear } from '@/lib/formatDate';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog } from '@/components/Dialog';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ad } from '@/types/ad';

interface AdDetailClientProps {
  ad: Ad;
}

export function AdDetailClient({ ad }: AdDetailClientProps) {
  const { data: categoryFieldTree } = useCategoryFieldTree(
    ad?.category?.id || ''
  );
  // Every field, each parent followed by its sub-fields (the form's order).
  const categoryFields = useMemo(
    () => flattenFieldTree(categoryFieldTree || []),
    [categoryFieldTree]
  );
  const fieldOrder = (categoryFieldId: string) => {
    const index = categoryFields.findIndex((f) => f.id === categoryFieldId);
    return index === -1 ? categoryFields.length : index;
  };
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loginAction, setLoginAction] = useState<
    'contact' | 'favorite' | 'profile' | null
  >(null);
  const [isSaved, setIsSaved] = useState(ad.isSaved ?? false);
  const [isContactRevealed, setIsContactRevealed] = useState(false);
  const trackedViewRef = useRef(false);

  // Analytics: ad viewed (fires once per mount).
  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;
    trackEvent('view_item', {
      itemId: ad.id,
      itemName: ad.title,
      category: ad.category?.name,
      price: ad.price ?? undefined,
      currency: ad.currency || 'GHS',
    });
  }, [ad]);

  const isFavoriteLoading = addFavorite.isPending || removeFavorite.isPending;

  const handleLoginRedirect = () => {
    const redirectPath = `/ads/${ad.id}`;
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      setLoginAction('favorite');
      setIsLoginDialogOpen(true);
      return;
    }

    if (isSaved) {
      removeFavorite.mutate(ad.id, {
        onSuccess: () => setIsSaved(false),
      });
    } else {
      addFavorite.mutate(ad.id, {
        onSuccess: () => setIsSaved(true),
      });
    }
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      setLoginAction('contact');
      setIsLoginDialogOpen(true);
      return;
    }

    const primaryPhone = ad.contactPhone || ad.contactPhone2;

    if (isContactRevealed && primaryPhone) {
      window.location.href = `tel:${primaryPhone}`;
    } else if (primaryPhone) {
      setIsContactRevealed(true);
      trackEvent('lead', {
        itemId: ad.id,
        itemName: ad.title,
        category: ad.category?.name,
      });
    } else {
      alert("This seller hasn't provided a phone number.");
    }
  };

  const priceDisplay =
    ad.price && ad.price > 0
      ? formatCurrency(ad.price, 'en-GH', ad.currency || 'GHS')
      : 'Contact for price';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Carousel */}
        <div className="space-y-4">
          <div
            className="relative h-96 bg-background/50 rounded-lg overflow-hidden cursor-zoom-in group"
            onClick={() => setIsFullScreenOpen(true)}
          >
            <OptimizedImage
              src={ad.images[currentImageIndex]}
              thumbnailSrc={ad.imageMeta?.[currentImageIndex]?.thumbnailUrl}
              alt={ad.title}
              fill
              className="object-cover"
            />
          </div>
          {ad.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {ad.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-20 h-20 rounded border-2 transition-all ${
                    index === currentImageIndex
                      ? 'border-primary shadow-sm shadow-primary/20'
                      : 'border-border-custom hover:border-primary/30'
                  }`}
                >
                  <OptimizedImage
                    src={image}
                    thumbnailSrc={ad.imageMeta?.[index]?.thumbnailUrl}
                    alt={`${ad.title} ${index + 1}`}
                    fill
                    className="object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ad Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text">{ad.title}</h1>
            <p className="text-2xl font-bold text-primary mt-2">
              {priceDisplay}
            </p>
            <p className="text-text-gray mt-1">
              {ad.address || ad.city?.name || 'Location not specified'}
            </p>
            {formatPostedDate(ad.createdAt) && (
              <p className="text-text-gray mt-1 text-sm">
                Posted {formatPostedDate(ad.createdAt)}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleFavorite}
              variant="outline"
              disabled={isFavoriteLoading}
              className={`flex items-center gap-2 ${isSaved ? 'text-primary border-primary' : ''}`}
            >
              {isFavoriteLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className={`w-5 h-5 ${isSaved ? 'fill-current' : 'fill-none'}`}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
              {isFavoriteLoading
                ? 'Loading...'
                : isSaved
                  ? 'Saved'
                  : 'Add to Favorites'}
            </Button>
            <Button
              onClick={handleContactSeller}
              className="flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {isContactRevealed
                ? ad.contactPhone || ad.contactPhone2
                : 'Contact Seller'}
            </Button>
          </div>

          {isContactRevealed && ad.contactPhone2 && (
            <a
              href={`tel:${ad.contactPhone2}`}
              className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Call second number: {ad.contactPhone2}
            </a>
          )}

          <div className="bg-background-primary/20 p-4 rounded-lg border border-primary/5">
            <h3 className="font-semibold mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Condition:</span>{' '}
                {ad.condition?.replace(/_/g, ' ')}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                {ad.category.name}
              </div>
              {ad.isNegotiable && (
                <div>
                  <span className="font-medium">Negotiable:</span> Yes
                </div>
              )}

              {/* Dynamic Category Fields */}
              {[...(ad.fieldValues || [])]
                .sort(
                  (a, b) =>
                    fieldOrder(a.categoryFieldId) -
                    fieldOrder(b.categoryFieldId)
                )
                .map((field) => {
                  const fieldDef = categoryFields.find(
                    (f) => f.id === field.categoryFieldId
                  );
                  let displayValue: React.ReactNode = field.value;

                  if (fieldDef?.type === 'CHECKBOX') {
                    // Value is stored as stringified JSON array, e.g. "[\"pool\",\"gym\"]",
                    // or comma-separated ("pool,gym") when posted from the web.
                    let values: unknown;
                    try {
                      values = JSON.parse(field.value);
                    } catch {
                      values = field.value.split(',');
                    }
                    if (Array.isArray(values)) {
                      const labels = values.map(
                        (v: string) =>
                          fieldDef.options?.find((opt) => opt.value === v)
                            ?.label || v
                      );
                      displayValue = (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {labels.map((label: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      );
                    }
                  } else if (fieldDef?.options) {
                    // Handle single select/radio
                    const option = fieldDef.options.find(
                      (opt) => opt.value === field.value
                    );
                    if (option) displayValue = option.label;
                  }

                  return (
                    // Sub-fields are indented under their parent field.
                    <div
                      key={field.id}
                      className={fieldDef?.parentFieldId ? 'pl-4' : undefined}
                    >
                      <span className="font-medium">
                        {field.categoryField.label}:
                      </span>{' '}
                      {displayValue}
                    </div>
                  );
                })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <div
              className="text-text-gray ad-description-content"
              dangerouslySetInnerHTML={{ __html: ad.description }}
            />
          </div>

          {/* Seller Info */}
          <div className="bg-background-primary/20 p-4 rounded-lg border border-primary/5">
            <h3 className="font-semibold mb-2">Seller Information</h3>
            {(() => {
              // Public seller identity: business name, else the account
              // holder's name. Never username, phone or email.
              const accountName =
                `${ad.user.firstName || ''} ${ad.user.lastName || ''}`.trim();
              const displayName =
                ad.user.sellerProfile?.businessName ||
                accountName ||
                'Private seller';
              const sellerHref = ad.user.sellerProfile?.id
                ? `/ads/seller/${ad.user.sellerProfile.id}`
                : null;
              return (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-background-primary rounded-full flex items-center justify-center">
                    {ad.user.avatar ? (
                      <OptimizedImage
                        src={ad.user.avatar}
                        alt={displayName}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="text-text-gray font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium hover:underline">
                      {sellerHref ? (
                        <Link href={sellerHref}>{displayName}</Link>
                      ) : (
                        <span className="cursor-default">{displayName}</span>
                      )}
                    </p>
                    {ad.user.createdAt && (
                      <p className="text-sm text-text-gray">
                        Member since {formatMonthYear(ad.user.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Related Ads */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Ads</h2>
        <RelatedAds categoryId={ad.category.id} currentAdId={ad.id} />
      </div>

      {/* Full Screen Image Viewer */}
      {isFullScreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-center items-center p-4">
          <button
            onClick={() => setIsFullScreenOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="relative w-full h-full flex items-center justify-center max-h-[85vh]">
            {ad.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? ad.images.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-2 md:left-8 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-3 rounded-full transition-all"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === ad.images.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-2 md:right-8 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 p-3 rounded-full transition-all"
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            <div className="relative w-full h-full max-w-5xl">
              <OptimizedImage
                src={ad.images[currentImageIndex]}
                alt={ad.title}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="absolute bottom-6 flex justify-center space-x-2">
            {ad.images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-white p-1.5'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <Dialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        title="Sign in Required"
        footer={
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsLoginDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleLoginRedirect}>
              Log In
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-text mb-2">
            {loginAction === 'contact'
              ? 'Log in to contact the seller'
              : loginAction === 'profile'
                ? 'Log in to view seller profile'
                : 'Log in to save this ad'}
          </p>
          <p className="text-sm text-text-gray">
            Join our community to connect with sellers and keep track of your
            favorite items.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
