'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserAd } from '@/services/ads.service';
import { AdDetailClient } from '@/app/ads/[id]/AdDetailClient';

interface MyAdDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MyAdDetailPage({ params }: MyAdDetailPageProps) {
  const [adId, setAdId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setAdId(p.id);
    });
  }, [params]);

  const { data: ad, isLoading, error } = useQuery({
    queryKey: ['my-ad', adId],
    queryFn: async () => {
      if (!adId) throw new Error('No ad ID');
      return getUserAd(adId);
    },
    enabled: !!adId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-2">Ad Not Found</h2>
          <p className="text-text-gray">
            This ad does not exist or you don&apos;t have permission to view it.
          </p>
        </div>
        <a
          href="/account/my-ads"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to My Ads
        </a>
      </div>
    );
  }

  return <AdDetailClient ad={ad} />;
}
