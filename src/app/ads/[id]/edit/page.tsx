'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAd, useUpdateAd } from '@/hooks/useAds';
import { useAuth } from '@/contexts/AuthContext';
import { AdForm } from '@/components/AdForm';
import { toast } from 'sonner';

interface EditAdPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAdPage({ params }: EditAdPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: ad, isLoading: adLoading, error: adError } = useAd(id);
  const updateAd = useUpdateAd();

  // Auth and Ownership protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/ads/${id}/edit`);
      return;
    }

    if (ad && user && ad.user.id !== user.id) {
      toast.error('You do not have permission to edit this ad.');
      router.push(`/ads/${id}`);
    }
  }, [authLoading, isAuthenticated, ad, user, id, router]);

  const onSubmit = (adData: any) => {
    updateAd.mutate(
      { ...adData, id },
      {
        onSuccess: () => {
          toast.success('Ad updated successfully!');
          router.push(`/ads/${id}`);
        },
        onError: (error: any) => {
          console.error('Failed to update ad:', error);
          toast.error(error?.response?.data?.message || 'Failed to update ad.');
        },
      }
    );
  };

  if (authLoading || adLoading)
    return (
      <div className="p-8 text-center text-text-gray flex flex-col items-center justify-center min-vh-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p>Loading ad details...</p>
      </div>
    );

  if (adError || !ad) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">Ad Not Found</h1>
        <p className="text-text-gray mb-6">
          The ad you are trying to edit could not be found or has been removed.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-primary text-white px-6 py-2 rounded-lg font-semibold"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-background rounded-2xl shadow-sm border border-border-custom overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Edit Your Ad</h1>
            <p className="text-primaryLight mt-1">
              Update the details of your listing.
            </p>
          </div>

          <AdForm
            initialData={ad}
            onSubmit={onSubmit}
            isSubmitting={updateAd.isPending}
            submitLabel="Update Ad Now"
          />
        </div>
      </div>
    </div>
  );
}
