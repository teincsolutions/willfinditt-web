'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SectionGate, LoadMore } from '@/components/community/SectionGate';
import { LostFoundCard } from '@/components/community/Cards';
import { CityPicker } from '@/components/community/CityPicker';
import { useLostFound, useLostFoundFormConfig } from '@/hooks/useCommunity';
import type {
  CursorPage,
  LostFoundKind,
  LostFoundPost,
  SectionFlag,
} from '@/types/community';

const KINDS: { value: LostFoundKind | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'LOST', label: 'Lost' },
  { value: 'FOUND', label: 'Found' },
];

function LostFoundList({
  readOnly,
  initialPage,
}: {
  readOnly: boolean;
  initialPage?: CursorPage<LostFoundPost>;
}) {
  const [kind, setKind] = useState<LostFoundKind | ''>('');
  const [city, setCity] = useState('');
  // Categories are admin-managed; chips show the active ones.
  const [category, setCategory] = useState('');
  const { data: config } = useLostFoundFormConfig();
  const query = useLostFound(
    {
      kind: kind || undefined,
      category: category || undefined,
      city: city || undefined,
    },
    // The server-rendered first page is for the unfiltered list only.
    !kind && !category && !city ? initialPage : undefined
  );
  const posts = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lost & Found</h1>
          <p className="text-text-gray">
            Lost something? Found something? Help it get home.
          </p>
        </div>
        {!readOnly && (
          <Link
            href="/post/lost-found"
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90"
          >
            Post lost or found
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {KINDS.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => setKind(k.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
              kind === k.value
                ? 'bg-primary text-white border-primary'
                : 'border-border-custom hover:bg-background-primary'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      {(config?.categories.length ?? 0) > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ value: '', label: 'All categories' }, ...(config?.categories ?? [])].map((c) => (
            <button
              key={c.value || 'all'}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                category === c.value
                  ? 'bg-primaryLight text-primary border-primary'
                  : 'border-border-custom hover:bg-background-primary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="max-w-md mb-6">
        <CityPicker value={city} onChange={setCity} label="Filter by city" />
      </div>

      {query.isLoading ? (
        <p className="text-text-gray">Loading…</p>
      ) : query.isError ? (
        <p className="text-error">Could not load posts. Please try again.</p>
      ) : posts.length === 0 ? (
        <p className="text-text-gray py-12 text-center">Nothing posted yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <LostFoundCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <LoadMore
        show={Boolean(query.hasNextPage)}
        loading={query.isFetchingNextPage}
        onClick={() => query.fetchNextPage()}
      />
    </div>
  );
}

export function LostFoundClient({
  initialFlags,
  initialPage,
}: {
  initialFlags?: SectionFlag[];
  initialPage?: CursorPage<LostFoundPost>;
}) {
  return (
    <SectionGate section="lost_found" initial={initialFlags}>
      {({ readOnly }) => (
        <LostFoundList readOnly={readOnly} initialPage={initialPage} />
      )}
    </SectionGate>
  );
}
