'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SectionGate, LoadMore } from '@/components/community/SectionGate';
import { NoticeCard, EVENT_TYPE_LABELS } from '@/components/community/Cards';
import { CityPicker } from '@/components/community/CityPicker';
import { useNotices } from '@/hooks/useCommunity';
import type { EventType } from '@/types/community';

const TYPES: (EventType | '')[] = [
  '',
  'FUNERAL',
  'MEMORIAL',
  'OBITUARY',
  'OTHER',
];

function NoticesList({ readOnly }: { readOnly: boolean }) {
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [city, setCity] = useState('');
  const query = useNotices({
    eventType: eventType || undefined,
    city: city || undefined,
  });
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

      <div className="flex flex-wrap gap-2 mb-4">
        {TYPES.map((t) => (
          <button
            key={t || 'all'}
            type="button"
            onClick={() => setEventType(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
              eventType === t
                ? 'bg-primary text-white border-primary'
                : 'border-border-custom hover:bg-background-primary'
            }`}
          >
            {t ? EVENT_TYPE_LABELS[t] : 'All'}
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
        <p className="text-text-gray py-12 text-center">No notices yet.</p>
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

export default function NoticesPage() {
  return (
    <SectionGate section="event_notices">
      {({ readOnly }) => <NoticesList readOnly={readOnly} />}
    </SectionGate>
  );
}
