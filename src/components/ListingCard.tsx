import Link from 'next/link';
import { OptimizedImage } from './OptimizedImage';
import { Ad } from '@/types/ad';

interface ListingCardProps {
  ad: Ad;
}

export const ListingCard: React.FC<ListingCardProps> = ({ ad }) => {
  return (
    <Link
      href={`/ad/${ad.id}`}
      className="group block bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="relative max-h-72 overflow-hidden bg-background-primary/5 flex items-center justify-center">
        <OptimizedImage
          src={ad.images[0]}
          alt={ad.title}
          className="w-full h-auto group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className="bg-background/90 text-text text-xs px-2 py-1 rounded-full font-medium">
            {ad.condition}
          </span>
        </div>
        {ad.isNegotiable && (
          <div className="absolute top-3 left-3">
            <span className="bg-success text-white text-xs px-2 py-1 rounded-full font-medium">
              Negotiable
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-text mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {ad.title}
        </h3>
        <div className="flex items-center gap-1.5 text-text-gray text-sm mb-4">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-2">
            {ad.address || ad.city?.name || 'Location not specified'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-primary">${ad.price}</p>
          <div className="text-right">
            <p className="text-text-light-gray text-xs">
              {new Date(ad.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
