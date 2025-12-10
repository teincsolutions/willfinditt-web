import Link from 'next/link';
import { Category } from '@/types/category';

interface CategoryTileProps {
  category: Category;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ category }) => {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="text-2xl text-white font-bold">
            {category.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Browse {category.name.toLowerCase()}
        </p>
      </div>
    </Link>
  );
};
