'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types/category';
import { OptimizedImage } from './OptimizedImage';

interface MegaMenuProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu = ({ categories, isOpen, onClose }: MegaMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );

  if (!isOpen) return null;

  const activeCategoryData = categories.find((cat) => cat.id === activeCategory);

  return (
    <div
      className="absolute left-0 right-0 top-full pt-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Invisible bridge to catch mouse movement */}
      <div className="absolute top-0 left-0 right-0 h-4 -translate-y-full bg-transparent" />
      
      <div className="bg-background shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-border-custom rounded-b-3xl overflow-hidden">
        <div className="container mx-auto">
          <div className="flex w-full bg-background min-h-[550px] overflow-hidden">
            {/* Category list */}
            <div className="w-80 flex-shrink-0 bg-background-primary/40 border-r border-border-custom p-6">
              <h3 className="text-[11px] font-bold text-text-light-gray uppercase tracking-[0.2em] mb-6 px-2">
                Categories
              </h3>
              <ul className="space-y-1.5 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                {categories.map((category) => (
                  <li key={category.id}>
                    <button
                      onMouseEnter={() => setActiveCategory(category.id)}
                      onClick={() => {
                        onClose();
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 relative group ${
                        activeCategory === category.id
                          ? 'bg-background text-primary shadow-lg ring-1 ring-border-custom translate-x-1'
                          : 'text-text-gray hover:bg-background/60 hover:text-text'
                      }`}
                    >
                      {category.icon ? (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border-custom bg-background flex-shrink-0 shadow-sm">
                          <OptimizedImage
                            src={category.icon}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-background-primary rounded-xl flex items-center justify-center flex-shrink-0 border border-border-custom">
                          <span className="text-xl">📦</span>
                        </div>
                      )}
                      <span className="font-bold text-base flex-1">{category.name}</span>
                      <svg
                        className={`w-4 h-4 transition-all duration-300 ${activeCategory === category.id ? 'opacity-100 translate-x-1 text-primary' : 'opacity-0 text-text-light-gray'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Subcategories panel */}
            <div className="flex-1 min-w-0 bg-background p-10 relative overflow-y-auto max-h-[600px]">
              {activeCategoryData ? (
                <>
                  <div className="flex items-center justify-between mb-10 pb-8 border-b border-border-custom sticky top-0 bg-background z-10 -mx-10 px-10">
                    <div>
                        <h3 className="text-3xl font-black text-text mb-2 tracking-tight">
                            {activeCategoryData.name}
                        </h3>
                        <p className="text-text-gray text-base font-medium">Explore the best of {activeCategoryData.name}</p>
                    </div>
                    <Link
                      href={`/category/${activeCategoryData.slug || activeCategoryData.id}`}
                      className="group flex items-center gap-3 px-8 py-3 bg-primary text-white hover:opacity-90 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/25"
                      onClick={onClose}
                    >
                      View All Listings
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                  
                  {activeCategoryData.children && activeCategoryData.children.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                      {activeCategoryData.children.map((subcat) => (
                        <Link
                          key={subcat.id}
                          href={`/category/${subcat.slug || subcat.id}`}
                          className="group flex items-center gap-5 p-5 rounded-2xl hover:bg-background-primary transition-all duration-300 border border-border-custom/50 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 bg-background-primary/5"
                          onClick={onClose}
                        >
                          <div className="w-16 h-16 rounded-2xl bg-background-primary flex-shrink-0 overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-border-custom/50 group-hover:border-primary/20">
                              {subcat.icon ? (
                                <OptimizedImage
                                    src={subcat.icon}
                                    alt=""
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                              ) : (
                                  <span className="text-3xl">📄</span>
                              )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-text group-hover:text-primary transition-colors block text-base truncate mb-1">
                              {subcat.name}
                            </span>
                            {subcat._count?.ads !== undefined && (
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                <p className="text-[12px] text-text-light-gray font-semibold">
                                  {subcat._count.ads.toLocaleString()} listings
                                </p>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-background-primary/10 rounded-[3rem] border border-dashed border-border-custom mt-10">
                       <div className="w-24 h-24 bg-background-primary rounded-full flex items-center justify-center mb-8 shadow-md border border-border-custom">
                            <svg className="w-12 h-12 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                       </div>
                       <p className="text-2xl font-bold text-text">Find amazing deals</p>
                       <p className="text-text-gray mt-2 font-medium">No subcategories currently on display</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
