'use client';

import { useSearchAds } from '@/hooks/useAds';
import { AdStatus } from '@/types/ad';
import { ListingCard } from './ListingCard';

interface RelatedAdsProps {
  categoryId: string;
  currentAdId: string;
}

export const RelatedAds = ({ categoryId, currentAdId }: RelatedAdsProps) => {
  const { data: adsResponse, isLoading } = useSearchAds({
    search: {
      categoryIds: [categoryId],
      limit: 5,
      statuses: [AdStatus.ACTIVE],
    },
  });

  const relatedAds = adsResponse?.data
    ?.filter((ad) => ad.id !== currentAdId)
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="break-inside-avoid mb-3 md:mb-6 bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden animate-pulse flex flex-col h-full"
          >
            <div className="aspect-[4/3] bg-background-primary/30" />
            <div className="p-3 sm:p-5 flex-1 flex flex-col space-y-3">
              <div className="h-4 bg-background-primary/30 rounded w-3/4" />
              <div className="h-3 bg-background-primary/30 rounded w-1/2" />
              <div className="mt-auto flex justify-between items-center">
                <div className="h-6 bg-background-primary/30 rounded w-1/3" />
                <div className="h-3 bg-background-primary/30 rounded w-1/4" />
              </div>
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
    <div className="columns-2 md:columns-3 xl:columns-4 gap-3 md:gap-6">
      {relatedAds.map((ad) => (
        <div key={ad.id} className="break-inside-avoid mb-3 md:mb-6">
          <ListingCard ad={ad} />
        </div>
      ))}
    </div>
  );
};
