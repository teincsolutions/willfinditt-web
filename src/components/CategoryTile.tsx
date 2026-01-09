import Link from 'next/link';
import { Category } from '@/types/category';

interface CategoryTileProps {
  category: Category;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({ category }) => {
  return (
    <Link
      href={`/category/${category.slug}?categoryId=${category.id}`}
      className="group block bg-background rounded-xl shadow-sm border border-border-custom p-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm shadow-primary/20">
          <span className="text-2xl text-white font-bold">
            {category.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-text-gray mt-1">
          Browse {category.name.toLowerCase()}
        </p>
      </div>
    </Link>
  );
};
