'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useAd } from '@/hooks/useAds';
import { useAddFavorite, useRemoveFavorite } from '@/hooks/useFavorites';
import { Button } from '@/components/Button';
import { useState } from 'react';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Carousel */}
        <div className="space-y-4">
          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={ad.images[currentImageIndex] || '/placeholder.jpg'}
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
                  className={`relative w-20 h-20 rounded border-2 ${
                    index === currentImageIndex
                      ? 'border-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  <Image
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
            <h1 className="text-3xl font-bold text-gray-900">{ad.title}</h1>
            <p className="text-2xl font-semibold text-blue-600 mt-2">
              {ad.price ? `$${ad.price}` : 'Price not specified'}
            </p>
            <p className="text-gray-600 mt-1">
              {ad.address || ad.city?.name || 'Location not specified'}
            </p>
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleFavorite} variant="outline">
              Add to Favorites
            </Button>
            <Button>Contact Seller</Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
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
            <p className="text-gray-700 whitespace-pre-line">
              {ad.description}
            </p>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Seller Information</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {ad.user.avatar ? (
                  <Image
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
                  <span className="text-gray-600 font-semibold">
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
                <p className="text-sm text-gray-600">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Related ads would go here */}
          <div className="text-center text-gray-500">
            Related ads loading...
          </div>
        </div>
      </div>
    </div>
  );
}
