import Link from 'next/link';
import Image from 'next/image';
import { Ad } from '@/types/ad';

interface ListingCardProps {
  ad: Ad;
}

export const ListingCard: React.FC<ListingCardProps> = ({ ad }) => {
  return (
    <Link
      href={`/ad/${ad.id}`}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={ad.images[0] || '/placeholder.jpg'}
          alt={ad.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
            {ad.condition}
          </span>
        </div>
        {ad.negotiable && (
          <div className="absolute top-3 left-3">
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Negotiable
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {ad.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {ad.description.slice(0, 80)}...
        </p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-blue-600">${ad.price}</p>
          <div className="text-right">
            <p className="text-gray-500 text-sm">{ad.location}</p>
            <p className="text-gray-400 text-xs">
              {new Date(ad.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
