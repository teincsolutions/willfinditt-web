'use client';

import React, { useMemo } from 'react';
import { usePage } from '@/hooks/usePage';
import { normalizeCmsContent } from '@/lib/cms-content';

import '@/styles/cms-content.css';

interface StaticPageProps {
  slug: string;
}

export const StaticPage: React.FC<StaticPageProps> = ({ slug }) => {
  const { data: page, isLoading, error } = usePage(slug);

  const content = useMemo(
    () =>
      page
        ? normalizeCmsContent(page.content, page.title)
        : { title: '', html: '' },
    [page]
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-text mb-2">Page Not Found</h2>
        <p className="text-text-gray">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-16 md:py-20">
      <header className="mb-10 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-text tracking-tight mb-4 text-center">
          {content.title || page.title}
        </h1>
        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
      </header>

      <div
        className="cms-content text-lg"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    </article>
  );
};
