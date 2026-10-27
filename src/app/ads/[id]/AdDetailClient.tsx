'use client';

import { OptimizedImage } from '@/components/OptimizedImage';
import { useCategoryFields } from '@/hooks/useCategories';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { useCreateChat } from '@/hooks/useChat';
import { Button } from '@/components/Button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { RelatedAds } from '@/components/RelatedAds';
import { formatCurrency } from '@/lib/utils';
import { formatPostedDate, formatMonthYear } from '@/lib/formatDate';
import { resolveEffectiveFormConfig } from '@/lib/categoryFormConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog } from '@/components/Dialog';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ad } from '@/types/ad';
import { CategoryField } from '@/types/category';
import { toast } from 'sonner';

interface AdDetailClientProps {
  ad: Ad;
}

function flattenCategoryFields(fields?: CategoryField[]): CategoryField[] {
  if (!fields || !Array.isArray(fields)) return [];
  const result: CategoryField[] = [];
  const walk = (list: CategoryField[]) => {
    for (const item of list) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        walk(item.children);
      }
    }
  };
  walk(fields);
  return result;
}

export function AdDetailClient({ ad }: AdDetailClientProps) {
  const { data: categoryFieldsTree } = useCategoryFields(ad?.category?.id || '');
  const categoryFields = useMemo(
    () => flattenCategoryFields(categoryFieldsTree),
    [categoryFieldsTree]
  );

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const createChat = useCreateChat();

  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [loginAction, setLoginAction] = useState<
    'contact' | 'chat' | 'favorite' | 'profile' | null
  >(null);
  const [isSaved, setIsSaved] = useState(ad.isSaved ?? false);
  const [isContactRevealed, setIsContactRevealed] = useState(false);
  const trackedViewRef = useRef(false);

  const formConfig = useMemo(
    () => resolveEffectiveFormConfig(ad.category),
    [ad.category]
  );

  const isSellerHidden = Boolean(
    ad.hideSellerInfo || formConfig.hideSellerInfo
  );

  const imageFieldValues = useMemo(() => {
    return (ad.fieldValues || []).filter((fv) => {
      const def = categoryFields.find((f) => f.id === fv.categoryFieldId);
      const t = fv.categoryField?.type || def?.type;
      return t === 'IMAGE' && Boolean(fv.value);
    });
  }, [ad.fieldValues, categoryFields]);

  const nonImageFieldValues = useMemo(() => {
    return (ad.fieldValues || []).filter((fv) => {
      const def = categoryFields.find((f) => f.id === fv.categoryFieldId);
      const t = fv.categoryField?.type || def?.type;
      return t !== 'IMAGE';
    });
  }, [ad.fieldValues, categoryFields]);

  const galleryImages = useMemo(() => {
    if (ad.images && ad.images.length > 0) return ad.images;
    return imageFieldValues.map((fv) => fv.value).filter(Boolean);
  }, [ad.images, imageFieldValues]);

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

  const handleStartChat = () => {
    if (!isAuthenticated) {
      setLoginAction('chat');
      setIsLoginDialogOpen(true);
      return;
    }

    if (user?.id && ad.user?.id && user.id === ad.user.id) {
      toast.info('This is your own advert.');
      return;
    }

    createChat.mutate(
      {
        receiverId: ad.user.id,
        adId: ad.id,
      },
      {
        onSuccess: (chat) => {
          trackEvent('lead', {
            itemId: ad.id,
            itemName: ad.title,
            category: ad.category?.name,
          });
          router.push(`/messages/${chat.id}`);
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              'Unable to start chat right now. Please try again.'
          );
        },
      }
    );
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
      handleStartChat();
    }
  };

  const hasPhoneContact = Boolean(ad.contactPhone || ad.contactPhone2);

  const showPrice =
    !formConfig.hidePrice || Boolean(ad.price && ad.price > 0);

  const priceDisplay =
    ad.price && ad.price > 0
      ? formatCurrency(ad.price, 'en-GH', ad.currency || 'GHS')
      : 'Contact for price';

  const strippedDescription = (ad.description || '')
    .replace(/<[^>]*>/g, '')
    .trim();
  const showDescription =
    Boolean(strippedDescription) && !formConfig.hideDescription;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Carousel */}
        <div className="space-y-4">
          {galleryImages.length > 0 ? (
            <>
              <div
                className="relative h-96 bg-background/50 rounded-lg overflow-hidden cursor-zoom-in group"
                onClick={() => setIsFullScreenOpen(true)}
              >
                <OptimizedImage
                  src={galleryImages[currentImageIndex] || galleryImages[0]}
                  thumbnailSrc={
                    ad.imageMeta?.[currentImageIndex]?.thumbnailUrl
                  }
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
              </div>
              {galleryImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {galleryImages.map((image, index) => (
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
            </>
          ) : (
            <div className="relative h-80 bg-background-primary/20 border border-border-custom rounded-lg flex flex-col items-center justify-center text-text-gray p-6 text-center">
              <svg
                className="w-16 h-16 mb-3 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium">No photos attached to this advert</p>
            </div>
          )}

          {/* Dedicated Category Image Fields (e.g. Photo of the Deceased, Funeral Poster / Obituary Image) */}
          {imageFieldValues.length > 0 && (
            <div className="bg-background-primary/15 p-4 rounded-lg border border-border-custom">
              <h3 className="font-semibold text-sm text-text mb-3">
                Event / Notice Images
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {imageFieldValues.map((fv) => {
                  const idxInGallery = galleryImages.indexOf(fv.value);
                  return (
                    <div
                      key={fv.id}
                      className="bg-background rounded-lg border border-border-custom overflow-hidden shadow-sm"
                    >
                      <div
                        className="relative h-48 cursor-zoom-in"
                        onClick={() => {
                          if (idxInGallery >= 0) {
                            setCurrentImageIndex(idxInGallery);
                          }
                          setIsFullScreenOpen(true);
                        }}
                      >
                        <OptimizedImage
                          src={fv.value}
                          alt={fv.categoryField?.label || ad.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="px-3 py-2 text-xs font-semibold text-text bg-background border-t border-border-custom">
                        {fv.categoryField?.label || 'Image'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Ad Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text">{ad.title}</h1>
            {showPrice && (
              <p className="text-2xl font-bold text-primary mt-2">
                {priceDisplay}
              </p>
            )}
            <p className="text-text-gray mt-1">
              {ad.address || ad.city?.name || 'Location not specified'}
            </p>
            <p className="text-text-gray mt-1 text-sm">
              Posted {formatPostedDate(ad.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
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

            {/* In-App Chat button (prominent for Love & Dating and available on all ads) */}
            {user?.id !== ad.user?.id && (
              <Button
                onClick={handleStartChat}
                disabled={createChat.isPending}
                variant={hasPhoneContact && !isSellerHidden ? 'outline' : 'primary'}
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
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {createChat.isPending ? 'Opening Chat...' : 'Chat In-App'}
              </Button>
            )}

            {hasPhoneContact && (
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
                  : 'Call / Contact'}
              </Button>
            )}
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
              {ad.condition && !formConfig.hideCondition && (
                <div>
                  <span className="font-medium">Condition:</span>{' '}
                  {ad.condition.replace(/_/g, ' ')}
                </div>
              )}
              <div>
                <span className="font-medium">Category:</span>{' '}
                {ad.category.name}
              </div>
              {ad.isNegotiable && !formConfig.hidePrice && (
                <div>
                  <span className="font-medium">Negotiable:</span> Yes
                </div>
              )}

              {/* Dynamic Category Fields */}
              {nonImageFieldValues.map((field) => {
                const fieldDef = categoryFields.find(
                  (f) => f.id === field.categoryFieldId
                );
                let displayValue: React.ReactNode = field.value;

                if (
                  fieldDef?.type === 'CHECKBOX' ||
                  field.categoryField?.type === 'CHECKBOX'
                ) {
                  try {
                    const values = field.value.startsWith('[')
                      ? JSON.parse(field.value)
                      : field.value.split(',');
                    if (Array.isArray(values)) {
                      const labels = values.map(
                        (v: string) =>
                          fieldDef?.options?.find((opt) => opt.value === v)
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
                  } catch {
                    displayValue = field.value;
                  }
                } else if (fieldDef?.options) {
                  const option = fieldDef.options.find(
                    (opt) => opt.value === field.value
                  );
                  if (option) displayValue = option.label;
                }

                return (
                  <div key={field.id}>
                    <span className="font-medium">
                      {field.categoryField?.label || fieldDef?.label}:
                    </span>{' '}
                    {displayValue}
                  </div>
                );
              })}
            </div>
          </div>

          {showDescription && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <div
                className="text-text-gray ad-description-content"
                dangerouslySetInnerHTML={{ __html: ad.description }}
              />
            </div>
          )}

          {/* Seller Info: Hidden when hideSellerInfo is active (e.g., Love & Dating), replaced with nickname notice */}
          {isSellerHidden ? (
            <div className="bg-background-primary/20 p-4 rounded-lg border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/15 text-primary rounded-full flex items-center justify-center font-bold">
                  {(ad.nickname || ad.user?.firstName || 'A')
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-text">
                    Posted by {ad.nickname || ad.user?.firstName || 'Anonymous'}
                  </p>
                  <p className="text-xs text-text-gray">
                    Personal profile details are hidden for privacy. Use In-App Chat above to connect safely without sharing contact details.
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Related Ads */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Ads</h2>
        <RelatedAds categoryId={ad.category.id} currentAdId={ad.id} />
      </div>

      {/* Full Screen Image Viewer */}
      {isFullScreenOpen && galleryImages.length > 0 && (
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
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? galleryImages.length - 1 : prev - 1
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
                      prev === galleryImages.length - 1 ? 0 : prev + 1
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
                src={galleryImages[currentImageIndex] || galleryImages[0]}
                alt={ad.title}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="absolute bottom-6 flex justify-center space-x-2">
            {galleryImages.map((_, index) => (
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
            {loginAction === 'chat'
              ? 'Log in to chat in-app'
              : loginAction === 'contact'
                ? 'Log in to contact the seller'
                : loginAction === 'profile'
                  ? 'Log in to view seller profile'
                  : 'Log in to save this ad'}
          </p>
          <p className="text-sm text-text-gray">
            Join our community to connect safely and keep track of your favorite
            adverts.
          </p>
        </div>
      </Dialog>
    </div>
  );
}
