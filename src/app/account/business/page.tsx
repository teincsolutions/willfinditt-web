'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useUserAds } from '@/hooks/useAds';
import { useMySeller, useMySellerStats, useMyVerification } from '@/hooks/useSeller';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/lib/utils';
import { Ad } from '@/types/ad';

type SellerAdStatus =
  | 'ACTIVE'
  | 'SOLD'
  | 'PENDING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CLOSED'
  | 'DRAFT'
  | 'SUSPENDED';

const STATUS_TABS: Array<{ key: SellerAdStatus; label: string }> = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUSPENDED', label: 'Suspended' },
];

function formatApprovalTime(hours?: number | null) {
  if (hours === undefined || hours === null || hours <= 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-successLight text-success border-success/20';
    case 'SOLD':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'PENDING':
      return 'bg-yellow/10 text-brown border-yellow/20';
    case 'REJECTED':
    case 'SUSPENDED':
      return 'bg-errorLight text-error border-error/20';
    case 'DRAFT':
      return 'bg-background-primary text-text-gray border-border-custom';
    default:
      return 'bg-background-primary text-text-gray border-border-custom';
  }
}

export default function BusinessPage() {
  const [activeStatus, setActiveStatus] = useState<SellerAdStatus>('ACTIVE');
  const [page, setPage] = useState(1);

  const { data: mySeller, isLoading: isSellerLoading, isError } = useMySeller();
  const { data: stats } = useMySellerStats();
  const { data: verification } = useMyVerification();

  const { data: adsResponse, isLoading: isAdsLoading } = useUserAds({
    page,
    limit: 10,
    status: activeStatus,
  });

  const ads = adsResponse?.data || [];
  const meta = adsResponse?.meta;

  const tabCounts = useMemo(
    () => ({
      ACTIVE: stats?.activeAds || 0,
      SOLD: stats?.soldAds || 0,
      PENDING: stats?.pendingAds || 0,
      REJECTED: stats?.rejectedAds || 0,
      EXPIRED: stats?.expiredAds || 0,
      CLOSED: stats?.closedAds || 0,
      DRAFT: stats?.draftAds || 0,
      SUSPENDED: stats?.suspendedAds || 0,
    }),
    [stats]
  );

  const displayName =
    mySeller?.businessName ||
    `${mySeller?.user?.firstName || ''} ${mySeller?.user?.lastName || ''}`.trim() ||
    mySeller?.user?.username ||
    'Business Profile';

  if (isSellerLoading) {
    return <div className="py-10 text-center text-text-gray">Loading business profile...</div>;
  }

  if (isError || !mySeller) {
    return (
      <div className="max-w-2xl mx-auto text-center py-14">
        <h2 className="text-2xl font-bold text-text mb-3">Become a Seller</h2>
        <p className="text-text-gray mb-6">
          Create your business profile to unlock seller tools and manage your listings by status.
        </p>
        <Link href="/account/business/edit">
          <Button>Set Up Business</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-custom bg-background overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-yellow/30 via-primary/10 to-yellow/20" />
        <div className="px-5 pb-5 -mt-10 flex flex-col md:flex-row md:items-end gap-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-white bg-background-primary">
            {mySeller.user?.avatar ? (
              <OptimizedImage
                src={mySeller.user.avatar}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-text">{displayName}</h2>
            {mySeller.description && (
              <p className="text-sm text-text-gray mt-1">{mySeller.description}</p>
            )}
            <p className="text-xs text-text-light-gray mt-2">
              Seller since {format(new Date(mySeller.createdAt), 'MMM yyyy')}
            </p>
          </div>

          <div className="flex gap-2 md:self-center">
            <Link href="/account/business/edit">
              <Button size="sm" variant="outline">Edit Profile</Button>
            </Link>
            <Link href="/account/verification">
              <Button size="sm" variant="outline">
                {verification?.status === 'APPROVED' ? 'Verified' : 'Verify Business'}
              </Button>
            </Link>
            <Link href="/ads/new">
              <Button size="sm">Create Ad</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-border-custom bg-background p-4">
          <p className="text-xs text-text-light-gray">Total Ads</p>
          <p className="text-2xl font-bold text-text mt-1">{stats?.totalAds || 0}</p>
        </div>
        <div className="rounded-xl border border-border-custom bg-background p-4">
          <p className="text-xs text-text-light-gray">Active</p>
          <p className="text-2xl font-bold text-success mt-1">{stats?.activeAds || 0}</p>
        </div>
        <div className="rounded-xl border border-border-custom bg-background p-4">
          <p className="text-xs text-text-light-gray">Pending</p>
          <p className="text-2xl font-bold text-brown mt-1">{stats?.pendingAds || 0}</p>
        </div>
        <div className="rounded-xl border border-border-custom bg-background p-4">
          <p className="text-xs text-text-light-gray">Rejected</p>
          <p className="text-2xl font-bold text-error mt-1">{stats?.rejectedAds || 0}</p>
        </div>
        <div className="rounded-xl border border-border-custom bg-background p-4">
          <p className="text-xs text-text-light-gray">Approval Rate</p>
          <p className="text-2xl font-bold text-primary mt-1">
            {Math.round(stats?.approvalRate || 0)}%
          </p>
        </div>
        <div className="rounded-xl border border-border-custom bg-background p-4">
          <p className="text-xs text-text-light-gray">Avg. Approval</p>
          <p className="text-2xl font-bold text-text mt-1">
            {formatApprovalTime(stats?.averageApprovalTime)}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border-custom bg-background p-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveStatus(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-text-gray border-border-custom hover:bg-background-primary'
                }`}
              >
                {tab.label} ({tabCounts[tab.key]})
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-3">
          {isAdsLoading ? (
            <div className="py-10 text-center text-text-gray">Loading listings...</div>
          ) : ads.length === 0 ? (
            <div className="py-10 text-center text-text-gray">
              No {activeStatus.toLowerCase()} ads yet.
            </div>
          ) : (
            ads.map((ad: Ad) => (
              <article
                key={ad.id}
                className="rounded-xl border border-border-custom bg-background-primary/30 p-3 flex gap-3"
              >
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-background flex-shrink-0">
                  {ad.images?.[0] ? (
                    <OptimizedImage
                      src={ad.images[0]}
                      alt={ad.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-light-gray text-xs">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/account/my-ads/${ad.id}`} className="font-semibold text-text hover:underline line-clamp-1">
                    {ad.title}
                  </Link>
                  <p className="text-primary font-bold mt-1 text-sm">
                    {ad.price && ad.price > 0
                      ? formatCurrency(ad.price, 'en-GH', ad.currency || 'GHS')
                      : 'Contact for price'}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-gray">
                    <span className={`px-2 py-0.5 rounded border ${getStatusBadge(ad.status)}`}>
                      {ad.status}
                    </span>
                    <span>Posted {format(new Date(ad.createdAt), 'MMM d, yyyy')}</span>
                    <span>{ad.views} views</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="mt-4">
            <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </section>
    </div>
  );
}
