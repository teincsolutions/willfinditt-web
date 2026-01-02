import Link from 'next/link';
import { OptimizedImage } from './OptimizedImage';
import { Ad } from '@/types/ad';
import { formatCurrency } from '@/lib/utils';

interface ListingCardProps {
  ad: Ad;
}

export const ListingCard: React.FC<ListingCardProps> = ({ ad }) => {
  const priceDisplay =
    ad.price && ad.price > 0
      ? formatCurrency(ad.price, 'en-GH', ad.currency || 'GHS')
      : 'Contact for price';

  return (
    <Link
      href={`/ad/${ad.id}`}
      className="group block h-auto sm:h-[450px] bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="relative overflow-hidden bg-background-primary/5 max-h-[279px] flex items-center justify-center">
        <OptimizedImage
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-background/90 text-text text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            {ad.condition}
          </span>
        </div>
        {ad.isNegotiable && (
          <div className="absolute top-3 left-3 z-20">
            <span className="bg-success text-white text-[10px] sm:text-xs px-2 py-1 rounded-full font-medium shadow-sm">
              Negotiable
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-lg font-semibold text-text mb-1 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {ad.title}
          </h3>
          <div className="flex items-center gap-1 text-text-gray text-[9px] sm:text-xs mb-3">
            <svg
              className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">
              {ad.address || ad.city?.name || 'Location not specified'}
            </span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mt-2 pt-2 border-t border-border-custom/50 sm:border-t-0">
          <p
            className={`font-bold text-primary ${priceDisplay === 'Contact for price' ? 'text-xs sm:text-lg' : 'text-sm sm:text-2xl'}`}
          >
            {priceDisplay}
          </p>
          <div className="text-left sm:text-right">
            <p className="text-text-light-gray text-[10px] sm:text-xs">
              {new Date(ad.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
