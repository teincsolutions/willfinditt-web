'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OptimizedImage } from './OptimizedImage';
import { Ad } from '@/types/ad';
import { formatCurrency } from '@/lib/utils';
import { formatPostedDate } from '@/lib/formatDate';
import { useAuth } from '@/contexts/AuthContext';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useRouter } from 'next/navigation';

interface ListingCardProps {
  ad: Ad;
}

export const ListingCard: React.FC<ListingCardProps> = ({ ad }) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isSavedLocal, setIsSavedLocal] = useState(ad.isSaved ?? false);

  const priceDisplay =
    ad.price && ad.price > 0
      ? formatCurrency(ad.price, 'en-GH', ad.currency || 'GHS')
      : 'Contact for price';

  const postedLabel = formatPostedDate(ad.createdAt);

  const isSaved = isSavedLocal;
  const isFavoriteLoading = addFavorite.isPending || removeFavorite.isPending;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowLoginDialog(true);
      return;
    }

    if (isSaved) {
      removeFavorite.mutate(ad.id, {
        onSuccess: () => setIsSavedLocal(false),
      });
    } else {
      addFavorite.mutate(ad.id, {
        onSuccess: () => setIsSavedLocal(true),
      });
    }
  };

  const handleLoginRedirect = () => {
    const redirectPath = `/ads/${ad.id}`;
    router.push(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <>
      <Link
        href={`/ads/${ad.id}`}
        className="group block h-auto sm:h-[450px] bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-2"
      >
        <div className="relative overflow-hidden bg-background-primary/5 max-h-[279px] flex items-center justify-center">
          <OptimizedImage
            src={ad.images[0]}
            alt={ad.title}
            className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {ad.condition && (
            <div className="absolute top-3 right-3 z-20">
              <span className="bg-background/90 text-text text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                {ad.condition.replace(/_/g, ' ')}
              </span>
            </div>
          )}
          {ad.isNegotiable && (
            <div className="absolute top-3 left-3 z-20">
              <span className="bg-success text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                Negotiable
              </span>
            </div>
          )}
          {ad.isPromoted && (
            <div className="absolute bottom-3 left-3 z-20">
              <span className="bg-primary text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                Sponsored
              </span>
            </div>
          )}
          {isAuthenticated && (
            <button
              onClick={handleFavoriteClick}
              disabled={isFavoriteLoading}
              className={`absolute bottom-3 right-3 z-20 p-2 rounded-full transition-all ${
                isSaved
                  ? 'bg-primary text-white hover:bg-primary/80'
                  : 'bg-background/90 text-text hover:bg-background hover:text-primary'
              } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? 'Remove from favorites' : 'Add to favorites'}
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
            </button>
          )}
        </div>
        <div className="p-3 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-lg font-semibold text-text mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {ad.title}
            </h3>
            <div className="flex items-center gap-1 text-text-gray text-[9px] sm:text-xs mb-3">
              <svg
                className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-1">
                {ad.address || ad.city?.name || 'Location not specified'}
              </span>
              {postedLabel && (
                <>
                  <span className="mx-1 flex-shrink-0">•</span>
                  <span className="flex-shrink-0">{postedLabel}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
            <p
              className={`font-bold text-primary ${priceDisplay === 'Contact for price' ? 'text-xs sm:text-lg' : 'text-sm sm:text-2xl'}`}
            >
              {priceDisplay}
            </p>
          </div>
        </div>
      </Link>

      <Dialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        title="Sign in Required"
        footer={
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLoginDialog(false)}
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
            Log in to save this ad
          </p>
          <p className="text-sm text-text-gray">
            Join our community to keep track of your favorite items.
          </p>
        </div>
      </Dialog>
    </>
  );
};
