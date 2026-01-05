'use client';

import Link from 'next/link';
import { Category } from '@/types/category';
import { OptimizedImage } from './OptimizedImage';

interface CategoryTilesProps {
  categories: Category[];
  isLoading?: boolean;
}

export const CategoryTiles = ({
  categories,
  isLoading,
}: CategoryTilesProps) => {
  if (isLoading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-text mb-6">
            Browse Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-background-primary/30 rounded-2xl aspect-square mb-3" />
                <div className="h-4 bg-background-primary/30 rounded w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text">Browse Categories</h2>
          <Link
            href="/categories"
            className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
          >
            View all
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.slice(0, 12).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug || category.id}`}
              className="group"
            >
              <div className="relative bg-background rounded-2xl p-4 shadow-sm border border-border-custom hover:shadow-lg hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                {/* Icon/Image */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-xl bg-background-primary group-hover:bg-primary/10 transition-colors overflow-hidden">
                  {category.icon ? (
                    <OptimizedImage
                      src={category.icon}
                      alt={category.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-center font-medium text-text group-hover:text-primary transition-colors text-sm line-clamp-2">
                  {category.name}
                </h3>

                {/* Count badge */}
                {category._count?.ads !== undefined &&
                  category._count.ads > 0 && (
                    <p className="text-center text-xs text-text-light-gray mt-1">
                      {category._count.ads.toLocaleString()} ads
                    </p>
                  )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
