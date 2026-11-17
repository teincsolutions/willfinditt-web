'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SectionGate, LoadMore } from '@/components/community/SectionGate';
import { NoticeCard } from '@/components/community/Cards';
import { CityPicker } from '@/components/community/CityPicker';
import { CommunitySearch } from '@/components/community/CommunitySearch';
import { useNoticeFormConfig, useNotices } from '@/hooks/useCommunity';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type {
  CursorPage,
  EventPost,
  EventType,
  SectionFlag,
} from '@/types/community';

function NoticesList({
  readOnly,
  initialPage,
}: {
  readOnly: boolean;
  initialPage?: CursorPage<EventPost>;
}) {
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const search = debouncedQ.trim().length >= 2 ? debouncedQ.trim() : undefined;
  // Types are admin-managed; chips show the active ones.
  const { data: config } = useNoticeFormConfig();
  const TYPES: { value: EventType | ''; label: string }[] = [
    { value: '', label: 'All' },
    ...(config?.eventTypes ?? []).map((t) => ({ value: t.value, label: t.label })),
  ];
  const [city, setCity] = useState('');
  const query = useNotices(
    { eventType: eventType || undefined, city: city || undefined, q: search },
    // The server-rendered first page is for the unfiltered list only.
    !eventType && !city && !search ? initialPage : undefined
  );
  const posts = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Events & Notices</h1>
          <p className="text-text-gray">
            Funerals, memorials, obituaries and other notices.
          </p>
        </div>
        {!readOnly && (
          <Link
            href="/post/notice"
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90"
          >
            Post a notice
          </Link>
        )}
      </div>

      <CommunitySearch
        value={q}
        onChange={setQ}
        placeholder="Search notices by title or description…"
        className="mb-4 max-w-xl"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES.map((t) => (
          <button
            key={t.value || 'all'}
            type="button"
            onClick={() => setEventType(t.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
              eventType === t.value
                ? 'bg-primary text-white border-primary'
                : 'border-border-custom hover:bg-background-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="max-w-md mb-6">
        <CityPicker value={city} onChange={setCity} label="Filter by city" />
      </div>

      {query.isLoading ? (
        <p className="text-text-gray">Loading…</p>
      ) : query.isError ? (
        <p className="text-error">Could not load notices. Please try again.</p>
      ) : posts.length === 0 ? (
        <p className="text-text-gray py-12 text-center">{search ? 'No notices match your search.' : 'No notices yet.'}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <NoticeCard key={post.id} post={post} />
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

export function NoticesClient({
  initialFlags,
  initialPage,
}: {
  initialFlags?: SectionFlag[];
  initialPage?: CursorPage<EventPost>;
}) {
  return (
    <SectionGate section="event_notices" initial={initialFlags}>
      {({ readOnly }) => (
        <NoticesList readOnly={readOnly} initialPage={initialPage} />
      )}
    </SectionGate>
  );
}
