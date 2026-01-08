'use client';

import { useParams } from 'next/navigation';
import { useSearchAds } from '@/hooks/useAds';
import { useSeller, useSellerStats } from '@/hooks/useSeller';
import { ListingCard } from '@/components/ListingCard';
import { OptimizedImage } from '@/components/OptimizedImage';
import { format } from 'date-fns';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { useState } from 'react';

export default function SellerPage() {
  const params = useParams();
  const id = params.id as string;
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Fetch Seller Profile
  const { data: sellerProfile, isLoading: isSellerLoading } = useSeller(id);
  const { data: stats } = useSellerStats(id);

  // Fetch ads for this user/seller
  // We need the userId from the seller profile to search ads
  const userId = sellerProfile?.userId;

  const { data: adsResponse, isLoading: isAdsLoading } = useSearchAds(
    {
      search: {
        userId: userId,
        limit: LIMIT,
        page: page,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    },
    { enabled: !!userId }
  );

  const ads = adsResponse?.data || [];
  const meta = adsResponse?.meta;
  const totalPages = meta?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If we don't have a formal seller profile, we can fallback to info from the ads
  // But strictly using sellerProfile as per latest request
  const displayUser = sellerProfile?.user;
  const displayUserName = displayUser
    ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim() ||
      displayUser.username
    : undefined;
  const displayName =
    sellerProfile?.businessName || displayUserName || 'Seller';
  const displayImage = sellerProfile?.user?.avatar || displayUser?.avatar;
  const displayDescription = sellerProfile?.description;
  const memberSince = sellerProfile?.createdAt
    ? new Date(sellerProfile.createdAt)
    : null;

  if (isSellerLoading && isAdsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-48 bg-gray-200 rounded-xl mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Seller Header */}
      <div className="bg-background rounded-2xl shadow-sm border border-border-custom overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-background shadow-md overflow-hidden flex-shrink-0">
              {displayImage ? (
                <OptimizedImage
                  src={displayImage}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-text">
                {displayName}
              </h1>
              {sellerProfile?.businessType && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
                  {sellerProfile.businessType}
                </span>
              )}
              {displayDescription && (
                <p className="text-text-gray mt-2 max-w-2xl">
                  {displayDescription}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-text-gray">
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Member since {format(memberSince, 'MMM yyyy')}
                  </span>
                )}
                {sellerProfile?.verified && (
                  <span className="flex items-center gap-1 text-success">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Verified Seller
                  </span>
                )}
                {stats && (
                  <>
                    <span>• {stats.totalAds} Ads Posted</span>
                    {stats.totalReviews > 0 && (
                      <span className="flex items-center gap-1 text-yellow">
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {stats.averageRating?.toFixed(1) || '0.0'} (
                        {stats.totalReviews})
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Ads */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Listings by {displayName}{' '}
          <span className="text-text-light-gray text-sm font-normal">
            ({meta?.total || ads.length})
          </span>
        </h2>

        {ads.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {ads.map((ad) => (
                <ListingCard key={ad.id} ad={ad} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-text-gray bg-background rounded-xl border border-border-custom">
            <p>No active listings found for this seller.</p>
          </div>
        )}
      </div>
    </div>
  );
}
