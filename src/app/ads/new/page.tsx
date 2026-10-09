'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateAd } from '@/hooks/useAds';
import { useAuth } from '@/contexts/AuthContext';
import { AdForm } from '@/components/AdForm';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

export default function CreateAdPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const createAd = useCreateAd();

  // Auth protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/ads/new');
    }
  }, [authLoading, isAuthenticated, router]);

  const onSubmit = (adData: any) => {
    if (!adData.images || adData.images.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }

    createAd.mutate(adData, {
      onSuccess: (created: { id?: string; title?: string; category?: { name?: string } }) => {
        toast.success('Ad published successfully!');
        trackEvent('post_ad', {
          itemId: created?.id,
          itemName: created?.title,
          category: created?.category?.name,
        });
        router.push('/account/my-ads');
      },
      onError: (error: any) => {
        console.error('Failed to create ad:', error);
        toast.error(
          error?.response?.data?.message ||
            'Failed to create ad. Please try again.'
        );
      },
    });
  };

  if (authLoading)
    return (
      <div className="p-8 text-center text-text-gray flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p>Checking authentication...</p>
      </div>
    );

  if (!isAuthenticated) return null;

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-background rounded-2xl shadow-sm border border-border-custom overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Post a New Ad</h1>
            <p className="text-primaryLight mt-1">
              Fill in the details to list your item for sale.
            </p>
          </div>

          <AdForm
            onSubmit={onSubmit}
            isSubmitting={createAd.isPending}
            submitLabel="Publish Ad Now"
          />
        </div>
      </div>
    </div>
  );
}
