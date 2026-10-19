'use client';

import { Category } from '@/types/category';

interface SubcategoryChipsProps {
  /** Parent category (the "All …" chip target). */
  parent?: Category | null;
  /** Siblings/subcategories to show. */
  children?: Category[];
  /** Currently selected category id. */
  currentId?: string;
  onSelect: (category: Category | null) => void;
}

function getCount(category: Category): number | undefined {
  return category.totalAdsCount ?? category._count?.ads;
}

export function SubcategoryChips({
  parent,
  children,
  currentId,
  onSelect,
}: SubcategoryChipsProps) {
  if (!parent || !children || children.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => onSelect(parent)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
            currentId === parent.id
              ? 'bg-primary text-white border-primary shadow-md'
              : 'bg-background-primary text-text-gray border-border-custom hover:border-primary/40 hover:text-primary'
          }`}
        >
          All {parent.name}
        </button>

        {children.map((child) => {
          const count = getCount(child);
          const isActive = child.id === currentId;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-background-primary text-text-gray border-border-custom hover:border-primary/40 hover:text-primary'
              }`}
            >
              {child.name}
              {count !== undefined && count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
