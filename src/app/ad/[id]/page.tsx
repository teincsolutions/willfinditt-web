'use client';

import { useParams } from 'next/navigation';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useAd } from '@/hooks/useAds';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { Button } from '@/components/Button';
import { useState } from 'react';
import { RelatedAds } from '@/components/RelatedAds';
import { formatCurrency } from '@/lib/utils';

export default function AdDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: ad, isLoading } = useAd(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!ad) {
    return <div className="container mx-auto px-4 py-8">Ad not found</div>;
  }

  const handleFavorite = () => {
    // For now, assume toggle
    addFavorite.mutate(id);
  };

  const priceDisplay = ad.price && ad.price > 0 
    ? formatCurrency(ad.price, 'en-GH', ad.currency || 'GHS')
    : 'Contact for price';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Carousel */}
        <div className="space-y-4">
          <div className="relative h-96 bg-background/50 rounded-lg overflow-hidden">
            <OptimizedImage
              src={ad.images[currentImageIndex]}
              alt={ad.title}
              fill
              className="object-cover"
            />
          </div>
          {ad.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {ad.images.map((image, index) => (
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
                    alt={`${ad.title} ${index + 1}`}
                    fill
                    className="object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ad Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text">{ad.title}</h1>
            <p className="text-2xl font-bold text-primary mt-2">
              {priceDisplay}
            </p>
            <p className="text-text-gray mt-1">
              {ad.address || ad.city?.name || 'Location not specified'}
            </p>
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleFavorite} variant="outline">
              Add to Favorites
            </Button>
            <Button>Contact Seller</Button>
          </div>

          <div className="bg-background-primary/20 p-4 rounded-lg border border-primary/5">
            <h3 className="font-semibold mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Condition:</span> {ad.condition}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                {ad.category.name}
              </div>
              {ad.isNegotiable && (
                <div className="col-span-2">
                  <span className="font-medium">Negotiable:</span> Yes
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <div 
              className="text-text-gray ad-description-content"
              dangerouslySetInnerHTML={{ __html: ad.description }}
            />
          </div>

          {/* Seller Info */}
          <div className="bg-background-primary/20 p-4 rounded-lg border border-primary/5">
            <h3 className="font-semibold mb-2">Seller Information</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-background-primary rounded-full flex items-center justify-center">
                {ad.user.avatar ? (
                  <OptimizedImage
                    src={ad.user.avatar}
                    alt={
                      `${ad.user.firstName || ''} ${ad.user.lastName || ''}`.trim() ||
                      ad.user.username
                    }
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-text-gray font-semibold">
                    {(
                      ad.user.firstName ||
                      ad.user.lastName ||
                      ad.user.username ||
                      'U'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">
                  {ad.user.firstName && ad.user.lastName
                    ? `${ad.user.firstName} ${ad.user.lastName}`
                    : ad.user.username}
                </p>
                <p className="text-sm text-text-gray">
                  Member since {new Date(ad.createdAt).getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Ads */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Ads</h2>
        <RelatedAds categoryId={ad.category.id} currentAdId={ad.id} />
      </div>
    </div>
  );
}
