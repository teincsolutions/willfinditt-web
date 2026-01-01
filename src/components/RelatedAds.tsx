'use client';

import { useAds } from '@/hooks/useAds';
import { ListingCard } from './ListingCard';

interface RelatedAdsProps {
  categoryId: string;
  currentAdId: string;
}

export const RelatedAds = ({ categoryId, currentAdId }: RelatedAdsProps) => {
  const { data: adsResponse, isLoading } = useAds({
    categoryId,
    limit: 5, // Fetch 5 to ensure we have 4 after filtering out current
    status: 'ACTIVE' as any,
  });

  const relatedAds = adsResponse?.data
    ?.filter((ad) => ad.id !== currentAdId)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-background rounded-xl shadow-sm h-[320px] animate-pulse">
            <div className="h-48 bg-background-primary/30 rounded-t-xl" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-background-primary/30 rounded w-3/4" />
              <div className="h-4 bg-background-primary/30 rounded w-full" />
              <div className="h-6 bg-background-primary/30 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!relatedAds || relatedAds.length === 0) {
    return (
      <div className="text-center py-8 text-text-gray bg-background rounded-xl border border-dashed border-border-custom">
        No related ads found in this category.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedAds.map((ad) => (
        <ListingCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
};
