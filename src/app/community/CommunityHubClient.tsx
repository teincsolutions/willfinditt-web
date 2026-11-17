'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { LoadMore } from '@/components/community/SectionGate';
import { LostFoundCard, NoticeCard } from '@/components/community/Cards';
import { CityPicker } from '@/components/community/CityPicker';
import { CommunityProfileCard } from '@/components/community/CommunityProfileCard';
import { CommunitySearch } from '@/components/community/CommunitySearch';
import { CommunityTabs, type CommunityTab } from '@/components/community/CommunityTabs';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useLostFound,
  useLostFoundFormConfig,
  useNoticeFormConfig,
  useNotices,
  useSections,
} from '@/hooks/useCommunity';
import type { LostFoundKind, SectionFlag } from '@/types/community';

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-border-custom text-text-gray hover:bg-background-primary hover:text-text'
  }`;

export function CommunityHubClient({ initialFlags }: { initialFlags?: SectionFlag[] }) {
  const { data: sections } = useSections(initialFlags);
  const [tab, setTab] = useState<CommunityTab>('notices');
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q);
  const search = debouncedQ.trim().length >= 2 ? debouncedQ.trim() : undefined;

  // Notices filters
  const [eventType, setEventType] = useState('');
  const [noticeCity, setNoticeCity] = useState('');

  // Lost & Found filters
  const [kind, setKind] = useState<LostFoundKind | ''>('');
  const [category, setCategory] = useState('');
  const [lostCity, setLostCity] = useState('');

  const noticeConfig = useNoticeFormConfig();
  const lostConfig = useLostFoundFormConfig();

  const stateOf = (key: string) =>
    sections?.find((section) => section.key === key)?.state;
  const noticesState = stateOf('event_notices');
  const lostState = stateOf('lost_found');
  const datingState = stateOf('dating');

  const available = useMemo(() => {
    const list: CommunityTab[] = [];
    if (noticesState === 'ON' || noticesState === 'READ_ONLY') list.push('notices');
    if (lostState === 'ON' || lostState === 'READ_ONLY') list.push('lost-found');
    if (datingState === 'ON') list.push('dating');
    return list;
  }, [noticesState, lostState, datingState]);

  const activeTab = available.includes(tab) ? tab : (available[0] ?? 'notices');

  const noticesQuery = useNotices(
    {
      eventType: eventType || undefined,
      city: noticeCity || undefined,
      q: search,
    },
    undefined,
    activeTab === 'notices'
  );

  const lostQuery = useLostFound(
    {
      kind: kind || undefined,
      category: category || undefined,
      city: lostCity || undefined,
      q: search,
    },
    undefined,
    activeTab === 'lost-found'
  );

  const notices = noticesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const lostPosts = lostQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const activeQuery = activeTab === 'notices' ? noticesQuery : lostQuery;

  const banner =
    (activeTab === 'notices' ? sections?.find((s) => s.key === 'event_notices') : sections?.find((s) => s.key === 'lost_found'))?.bannerMessage ?? null;

  const noticeTypes = [
    { value: '', label: 'All' },
    ...(noticeConfig.data?.eventTypes ?? []).map((type) => ({
      value: type.value,
      label: type.label,
    })),
  ];
  const categories = [
    { value: '', label: 'All categories' },
    ...(lostConfig.data?.categories ?? []).map((item) => ({
      value: item.value,
      label: item.label,
    })),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border-custom bg-gradient-to-br from-primary/10 via-background to-background-primary/40">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                WillfindITT Community
              </p>
              <h1 className="text-3xl font-black text-text md:text-4xl">Community</h1>
              <p className="mt-2 text-text-gray">
                Browse funeral notices, help a lost item get home, and meet the
                people behind the posts.
              </p>
            </div>
            <Link
              href="/post"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90"
            >
              Sell / Post
            </Link>
          </div>

          <div className="mt-6 max-w-3xl">
            <CommunitySearch
              value={q}
              onChange={setQ}
              placeholder={
                activeTab === 'lost-found'
                  ? 'Search lost & found by title or description…'
                  : 'Search notices by title or description…'
              }
            />
          </div>
        </div>
      </section>

      {/* Sticky section switcher */}
      <div className="sticky top-[104px] z-30 border-b border-border-custom bg-background/95 backdrop-blur lg:top-[116px]">
        <div className="container mx-auto flex items-center gap-2 overflow-x-auto px-4 py-2">
          <CommunityTabs value={activeTab} onChange={setTab} initial={initialFlags} />
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {banner ? (
            <div className="mb-4 rounded-xl border border-border-custom bg-background-primary p-3 text-sm text-text-gray">
              {banner}
            </div>
          ) : null}

          {activeTab === 'notices' ? (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {noticeTypes.map((type) => (
                  <button
                    key={type.value || 'all'}
                    type="button"
                    onClick={() => setEventType(type.value)}
                    className={chip(eventType === type.value)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="mb-6 max-w-md">
                <CityPicker value={noticeCity} onChange={setNoticeCity} label="Filter by city" />
              </div>

              {noticesQuery.isLoading ? (
                <p className="py-12 text-center text-text-gray">Loading notices…</p>
              ) : noticesQuery.isError ? (
                <p className="py-12 text-center text-error">Could not load notices. Please try again.</p>
              ) : !notices.length ? (
                <div className="rounded-xl border border-dashed border-border-custom py-14 text-center">
                  <p className="font-semibold text-text">
                    {search ? 'No notices match your search.' : 'No notices yet.'}
                  </p>
                  <p className="mt-1 text-sm text-text-gray">
                    Be the first to post a funeral, memorial or obituary notice.
                  </p>
                  <Link href="/post/notice" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                    Post a notice
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {notices.map((post) => (
                    <NoticeCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {[
                  { value: '' as const, label: 'All' },
                  { value: 'LOST' as const, label: 'Lost' },
                  { value: 'FOUND' as const, label: 'Found' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setKind(item.value)}
                    className={chip(kind === item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {categories.length > 1 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <button
                      key={item.value || 'all'}
                      type="button"
                      onClick={() => setCategory(item.value)}
                      className={chip(category === item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="mb-6 max-w-md">
                <CityPicker value={lostCity} onChange={setLostCity} label="Filter by city" />
              </div>

              {lostQuery.isLoading ? (
                <p className="py-12 text-center text-text-gray">Loading lost & found…</p>
              ) : lostQuery.isError ? (
                <p className="py-12 text-center text-error">Could not load lost & found. Please try again.</p>
              ) : !lostPosts.length ? (
                <div className="rounded-xl border border-dashed border-border-custom py-14 text-center">
                  <p className="font-semibold text-text">
                    {search ? 'No posts match your search.' : 'Nothing posted yet.'}
                  </p>
                  <p className="mt-1 text-sm text-text-gray">
                    Lost something? Found something? Help it get home.
                  </p>
                  <Link href="/post/lost-found" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                    Post lost or found
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {lostPosts.map((post) => (
                    <LostFoundCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </>
          )}

          <LoadMore
            show={Boolean(activeQuery.hasNextPage)}
            loading={activeQuery.isFetchingNextPage}
            onClick={() => activeQuery.fetchNextPage()}
          />
        </div>

        {/* Sidebar */}
        <aside className="hidden space-y-4 lg:block">
          <CommunityProfileCard compact />

          <div className="rounded-2xl border border-border-custom bg-white p-5">
            <h2 className="text-sm font-bold text-text">Quick post</h2>
            <div className="mt-3 space-y-2">
              <Link href="/post/notice" className="block rounded-lg border border-border-custom px-3 py-2 text-sm font-semibold text-text hover:border-primary hover:text-primary">
                Post a notice
              </Link>
              <Link href="/post/lost-found" className="block rounded-lg border border-border-custom px-3 py-2 text-sm font-semibold text-text hover:border-primary hover:text-primary">
                Post lost or found
              </Link>
              <Link href="/post" className="block rounded-lg border border-border-custom px-3 py-2 text-sm font-semibold text-text hover:border-primary hover:text-primary">
                Sell an item or ad
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border-custom bg-white p-5">
            <h2 className="text-sm font-bold text-text">Community guidelines</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-text-gray">
              <li>Be kind and accurate.</li>
              <li>Never post someone else&apos;s private information.</li>
              <li>Use chat first; reveal a phone only when you need to.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
