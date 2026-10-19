'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParentCategories } from '@/hooks/useCategories';
import { Category } from '@/types/category';

interface CategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: Category | null) => void;
  selectedId?: string;
}

function getCount(category: Category): number | undefined {
  return category.totalAdsCount ?? category._count?.ads;
}

export function CategoryPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: CategoryPickerModalProps) {
  const { data: parents = [], isLoading } = useParentCategories(true);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const selectedParentId = useMemo(() => {
    if (!selectedId) return null;
    const parent = parents.find((p) => p.id === selectedId);
    if (parent) return parent.id;
    const containing = parents.find((p) =>
      p.children?.some((child) => child.id === selectedId)
    );
    return containing?.id ?? null;
  }, [parents, selectedId]);

  useEffect(() => {
    if (!isOpen) return;
    setActiveParentId(selectedParentId);
  }, [isOpen, selectedParentId]);

  // Portal to <body> so the modal is not trapped in the sticky, scrollable
  // filter sidebar's stacking context (it rendered behind the results).
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const activeParent =
    parents.find((parent) => parent.id === activeParentId) ?? null;

  const select = (category: Category | null) => {
    onSelect(category);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a category"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-background w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-border-custom flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border-custom">
          <div>
            <h2 className="text-xl font-black text-text">Choose a category</h2>
            <p className="text-sm text-text-gray font-medium">
              Pick a main category, then a subcategory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl hover:bg-background-primary transition-colors text-text-gray"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid md:grid-cols-2 flex-1 min-h-0">
          {/* Main categories */}
          <div className="overflow-y-auto custom-scrollbar border-b md:border-b-0 md:border-r border-border-custom p-3">
            <button
              type="button"
              onClick={() => select(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                !selectedId
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-gray hover:bg-background-primary hover:text-primary'
              }`}
            >
              <span className="w-8 h-8 rounded-lg bg-background-primary flex items-center justify-center">
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </span>
              All categories
            </button>

            {isLoading && (
              <div className="space-y-2 mt-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-11 rounded-xl bg-background-primary/40 animate-pulse"
                  />
                ))}
              </div>
            )}

            {parents.map((parent) => {
              const hasChildren = !!parent.children?.length;
              const isActive = parent.id === activeParentId;
              const count = getCount(parent);

              return (
                <button
                  key={parent.id}
                  type="button"
                  onClick={() => {
                    if (hasChildren) {
                      setActiveParentId(parent.id);
                    } else {
                      select(parent);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-gray hover:bg-background-primary hover:text-primary'
                  }`}
                >
                  <span className="flex-1 text-left truncate">
                    {parent.name}
                  </span>
                  {count !== undefined && count > 0 && (
                    <span className="text-xs text-text-light-gray">
                      {count.toLocaleString()}
                    </span>
                  )}
                  {hasChildren && (
                    <svg
                      className="w-4 h-4 opacity-50"
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
                  )}
                </button>
              );
            })}
          </div>

          {/* Subcategories */}
          <div className="overflow-y-auto custom-scrollbar p-3">
            {activeParent ? (
              <>
                <button
                  type="button"
                  onClick={() => select(activeParent)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    selectedId === activeParent.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-gray hover:bg-background-primary hover:text-primary'
                  }`}
                >
                  <span className="flex-1 text-left">
                    All {activeParent.name}
                  </span>
                </button>

                {activeParent.children?.map((child) => {
                  const isActive = child.id === selectedId;
                  const count = getCount(child);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => select(child)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-gray hover:bg-background-primary hover:text-primary'
                      }`}
                    >
                      <span className="flex-1 text-left truncate">
                        {child.name}
                      </span>
                      {count !== undefined && count > 0 && (
                        <span className="text-xs text-text-light-gray">
                          {count.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center px-6">
                <p className="text-sm font-medium text-text-gray">
                  Select a main category to see its subcategories.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
