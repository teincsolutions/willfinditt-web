'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserAds, useDeleteAd } from '@/hooks/useAds';
import { Button } from '@/components/Button';
import { OptimizedImage } from '@/components/OptimizedImage';
import { formatCurrency } from '@/lib/utils';
import { formatPostedDate } from '@/lib/formatDate';
import { Pagination } from '@/components/Pagination';

import { Suspense } from 'react';

function MyAdsContent() {
  const [page, setPage] = useState(1);
  const { data: adsResponse, isLoading } = useUserAds({ page, limit: 10 });
  const deleteAdMutation = useDeleteAd();

  const ads = adsResponse?.data || [];

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Are you sure you want to delete this ad? This action cannot be undone.'
      )
    ) {
      deleteAdMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading ads...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">My Ads</h2>
        <Link href="/ads/new">
          <Button size="sm">Post New Ad</Button>
        </Link>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12 text-text-gray">
          <p className="mb-4">You haven't posted any ads yet.</p>
          <Link href="/ads/new">
            <Button variant="outline">Create your first ad</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex gap-4 p-4 border rounded-lg hover:bg-background transition-colors bg-background"
            >
              <div className="w-24 h-24 bg-background-primary/30 rounded-md overflow-hidden flex-shrink-0">
                {ad.images?.[0] ? (
                  <OptimizedImage
                    src={ad.images[0]}
                    alt={ad.title}
                    fill
                    containerClassName="w-full h-full"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-light-gray">
                    No Img
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-text truncate">
                      <Link href={`/account/my-ads/${ad.id}`} className="hover:underline">
                        {ad.title}
                      </Link>
                    </h3>
                    <p className="text-primary font-bold mt-1">
                      {ad.price && ad.price > 0
                        ? formatCurrency(
                            ad.price,
                            'en-GH',
                            ad.currency || 'GHS'
                          )
                        : 'Contact for price'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/ads/${ad.id}/edit`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-error border-error/20 hover:bg-errorLight"
                      onClick={() => handleDelete(ad.id)}
                      disabled={deleteAdMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-text-gray flex items-center gap-4">
                  <span
                    className={`px-2 py-0.5 rounded text-xs border ${
                      ad.status === 'ACTIVE'
                        ? 'bg-successLight text-success border-success/20'
                        : ad.status === 'PENDING'
                          ? 'bg-yellow/10 text-brown border-yellow/20'
                          : 'bg-background-primary text-text-gray border-border-custom'
                    }`}
                  >
                    {ad.status}
                  </span>
                  {formatPostedDate(ad.createdAt) && (
                    <span>
                      Posted {formatPostedDate(ad.createdAt)}
                    </span>
                  )}
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {ad.views}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {adsResponse?.meta && (
            <Pagination
              currentPage={page}
              totalPages={adsResponse.meta.totalPages}
              onPageChange={(newPage: number) => {
                setPage(newPage);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function MyAdsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyAdsContent />
    </Suspense>
  );
}
