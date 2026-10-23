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
      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-xl font-bold text-text sm:mb-6 sm:text-2xl">
            Browse Categories
          </h2>
          <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse flex-col items-center gap-2"
              >
                <div className="h-12 w-12 rounded-2xl bg-background-primary/30 sm:h-14 sm:w-14 md:h-16 md:w-16" />
                <div className="h-3 w-3/4 rounded bg-background-primary/30" />
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
    <section className="bg-background py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-xl font-bold text-text sm:text-2xl">
            Browse Categories
          </h2>
          {/* Every main category is listed below, so there is nothing left to
              "view all" (and /categories never existed). */}
          <span className="text-xs font-medium text-text-light-gray sm:text-sm">
            {categories.length} categories
          </span>
        </div>

        {/* Compact icon tiles, the same shape the mobile app uses: the
            artwork sits in a small rounded tile with the name underneath.
            The old cards carried a rounded box, 16px of padding and an
            "N ads" line, which left a lot of dead space on a phone. */}
        <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}?categoryId=${category.id}`}
              className="group flex flex-col items-center gap-2"
              title={category.name}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14 md:h-16 md:w-16">
                <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-background">
                  {category.icon ? (
                    <OptimizedImage
                      src={category.icon}
                      alt={category.name}
                      fill
                      containerClassName="bg-background"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl">📦</span>
                  )}
                </div>
              </div>

              <h3 className="line-clamp-2 text-center text-xs font-medium leading-tight text-text transition-colors group-hover:text-primary sm:text-sm">
                {category.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
