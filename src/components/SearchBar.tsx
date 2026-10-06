'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from './Button';

const SearchBarInner = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);

  // Keep the input in sync with the URL (back/forward nav, filter changes,
  // clear actions from elsewhere).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const pushSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = q.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    params.delete('page'); // Reset to page 1 on a new search
    const target = pathname === '/search' ? pathname : '/search';
    router.push(`${target}?${params.toString()}`);
  };

  const handleSearch = () => {
    pushSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    // If a keyword is (or was) active, navigate it away so stale keywords
    // don't keep filtering the results. Otherwise just clear the input.
    if (urlQuery) {
      pushSearch('');
    }
  };

  return (
    <div className="flex flex-1 max-w-md">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for..."
          className="w-full pl-4 pr-10 py-2 border border-border-custom rounded-l-lg focus:border-primary focus:outline-none text-text placeholder-placeholder text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-text-light-gray hover:text-text hover:bg-background-primary transition-colors cursor-pointer"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light-gray pointer-events-none">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
      </div>
      <Button
        onClick={handleSearch}
        className="rounded-l-none px-4 py-2 bg-primary hover:opacity-90 text-white text-sm"
      >
        Search
      </Button>
    </div>
  );
};

export const SearchBar = () => {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              disabled
              placeholder="What are you looking for..."
              className="w-full pl-4 pr-10 py-2 border border-border-custom rounded-l-lg text-sm"
            />
          </div>
        </div>
      }
    >
      <SearchBarInner />
    </Suspense>
  );
};
