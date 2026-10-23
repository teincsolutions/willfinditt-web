'use client';

import Link from 'next/link';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/Button';

export default function FavoritesPage() {
  const { data: favorites, isLoading } = useFavorites();
  const removeFavorite = useRemoveFavorite();

  const handleRemoveFavorite = (adId: string) => {
    removeFavorite.mutate(adId);
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const favoriteAds = favorites?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Favorites</h1>

      {favoriteAds.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-semibold text-text mb-2">
            No favorites yet
          </h2>
          <p className="text-text-gray mb-6">
            Start browsing and add some ads to your favorites!
          </p>
          <Link href="/">
            <Button>Browse Ads</Button>
          </Link>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 gap-3 md:gap-6">
          {favoriteAds.map((ad) => (
            <div
              key={ad.id}
              className="relative break-inside-avoid mb-3 md:mb-6"
            >
              <ListingCard ad={ad} />
              <Button
                onClick={() => handleRemoveFavorite(ad.id)}
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 bg-background"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
