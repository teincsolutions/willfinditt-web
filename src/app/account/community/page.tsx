'use client';

/* eslint-disable @next/next/no-img-element -- community photos are private
   assets served as short-lived signed links. */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatPostedDate } from '@/lib/formatDate';
import { LoadMore } from '@/components/community/SectionGate';
import { noticeCover } from '@/components/community/Cards';
import { ExpiryText, ListingActions } from '@/components/community/ListingPeriod';
import { useAuth } from '@/contexts/AuthContext';
import {
  useLostFoundFormConfig,
  useMyKey,
  useNoticeFormConfig,
  useSections,
} from '@/hooks/useCommunity';
import { apiError, lostFoundApi, noticesApi } from '@/services/community.service';
import type {
  CursorPage,
  EventPost,
  ListingPeriodInput,
  ListingRules,
  LostFoundPost,
} from '@/types/community';

const STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Live', className: 'bg-successLight text-success' },
  RESOLVED: { label: 'Resolved', className: 'bg-background-primary text-text-gray' },
  EXPIRED: { label: 'Ended', className: 'bg-background-primary text-text-gray' },
  SUSPENDED: { label: 'Taken down', className: 'bg-errorLight text-error' },
  REJECTED: { label: 'Rejected', className: 'bg-errorLight text-error' },
};

function StatusBadge({ status }: { status?: string }) {
  const value = STATUS[status ?? 'ACTIVE'] ?? STATUS.ACTIVE;
  return (
    <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${value.className}`}>
      {value.label}
    </span>
  );
}

function useMine<T>(
  key: readonly unknown[],
  fetchPage: (cursor?: string) => Promise<CursorPage<T>>,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchPage(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-border-custom bg-white px-4 py-3 text-center">
      <p className="text-2xl font-black text-text">{value}</p>
      <p className="text-xs font-medium text-text-gray">{label}</p>
    </div>
  );
}

function OwnerNoticeCard({
  post,
  canEdit,
  rules,
  onRenew,
  onDelete,
}: {
  post: EventPost;
  canEdit: boolean;
  rules?: ListingRules;
  onRenew: (value: ListingPeriodInput) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  const cover = noticeCover(post);
  const takenDown = post.status === 'SUSPENDED' || post.status === 'REJECTED';
  return (
    <li className="rounded-xl border border-border-custom bg-white p-3">
      <div className="flex gap-3">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-background-primary">
          {cover ? (
            <img src={cover} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-text-gray">
              {post.eventTypeLabel ?? post.eventType}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/notices/${post.id}`} className="font-semibold hover:text-primary">
                {post.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-gray">
                <StatusBadge status={post.status} />
                {post.visibility === 'UNLISTED' ? <span>Link only</span> : null}
                <span>{formatPostedDate(post.createdAt)}</span>
                <ExpiryText expiresAt={post.expiresAt} />
              </div>
            </div>
            {canEdit && !takenDown ? (
              <Link
                href={`/post/notice?edit=${post.id}`}
                className="shrink-0 text-sm font-semibold text-primary"
              >
                Edit
              </Link>
            ) : null}
          </div>
          {canEdit ? (
            <div className="mt-3">
              <ListingActions
                rules={rules}
                canRenew={post.status === 'ACTIVE' || post.status === 'EXPIRED'}
                onRenew={onRenew}
                onDelete={onDelete}
              />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function OwnerLostFoundCard({
  post,
  canEdit,
  rules,
  onRenew,
  onDelete,
  onResolve,
}: {
  post: LostFoundPost;
  canEdit: boolean;
  rules?: ListingRules;
  onRenew: (value: ListingPeriodInput) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onResolve: () => void;
}) {
  const cover = post.images[0]?.url ?? null;
  return (
    <li className="rounded-xl border border-border-custom bg-white p-3">
      <div className="flex gap-3">
        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-background-primary">
          {cover ? (
            <img src={cover} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-text-gray">No photo</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/lost-and-found/${post.id}`} className="font-semibold hover:text-primary">
                {post.kind === 'LOST' ? 'Lost: ' : 'Found: '}
                {post.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-gray">
                <StatusBadge status={post.status} />
                <span>{formatPostedDate(post.createdAt)}</span>
                <ExpiryText expiresAt={post.expiresAt} />
              </div>
            </div>
            {canEdit && post.status === 'ACTIVE' ? (
              <div className="flex shrink-0 gap-3 text-sm font-semibold">
                <Link href={`/post/lost-found?edit=${post.id}`} className="text-primary">
                  Edit
                </Link>
                <button type="button" onClick={onResolve} className="text-success">
                  Resolved
                </button>
              </div>
            ) : null}
          </div>
          {canEdit ? (
            <div className="mt-3">
              <ListingActions
                rules={rules}
                canRenew={post.status === 'ACTIVE' || post.status === 'EXPIRED'}
                onRenew={onRenew}
                onDelete={onDelete}
              />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function CommunityProfilePage() {
  const { user } = useAuth();
  const { data: sections } = useSections();
  const queryClient = useQueryClient();
  const myKey = useMyKey();

  const stateOf = (key: string) => sections?.find((section) => section.key === key)?.state;
  const noticesState = stateOf('event_notices');
  const lostState = stateOf('lost_found');
  const noticesOpen = noticesState === 'ON' || noticesState === 'READ_ONLY';
  const lostOpen = lostState === 'ON' || lostState === 'READ_ONLY';
  const canEditNotices = noticesState === 'ON';
  const canEditLost = lostState === 'ON';

  const profile = useQuery({
    queryKey: [...myKey, 'notice-profile'],
    queryFn: noticesApi.myProfile,
    enabled: noticesOpen,
    retry: false,
  });

  const noticeConfig = useNoticeFormConfig();
  const lostConfig = useLostFoundFormConfig();

  const noticesQuery = useMine<EventPost>(
    [...myKey, 'notices'],
    noticesApi.mine,
    noticesOpen
  );
  const lostQuery = useMine<LostFoundPost>(
    [...myKey, 'lost-found'],
    lostFoundApi.mine,
    lostOpen
  );

  const noticeItems = noticesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const lostItems = lostQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const [tab, setTab] = useState<'notices' | 'lost-found'>('notices');
  const activeTab =
    tab === 'lost-found' && lostOpen
      ? 'lost-found'
      : noticesOpen
        ? 'notices'
        : 'lost-found';

  const displayName =
    profile.data?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Your community profile';
  const avatar = profile.data?.photoUrl || user?.avatar || null;
  const city = profile.data?.city?.name;
  const memberSince = profile.data?.createdAt
    ? new Date(profile.data.createdAt).toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      })
    : null;

  const activeNotices = noticeItems.filter((post) => post.status === 'ACTIVE' || !post.status).length;
  const activeLost = lostItems.filter((post) => post.status === 'ACTIVE' || !post.status).length;
  const totalPosts = noticeItems.length + lostItems.length;
  const hasMore = noticesQuery.hasNextPage || lostQuery.hasNextPage;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['community'] });

  const resolve = async (id: string) => {
    if (!window.confirm('Mark as resolved? It will leave the listings.')) return;
    try {
      await lostFoundApi.resolve(id);
      await refresh();
      toast.success('Marked as resolved');
    } catch (error) {
      toast.error(apiError(error, 'Could not update the post'));
    }
  };

  const tabs = useMemo(
    () =>
      [
        noticesOpen ? { value: 'notices' as const, label: 'Events & Notices' } : null,
        lostOpen ? { value: 'lost-found' as const, label: 'Lost & Found' } : null,
      ].filter(Boolean) as { value: 'notices' | 'lost-found'; label: string }[],
    [noticesOpen, lostOpen]
  );

  if (!noticesOpen && !lostOpen) {
    return (
      <p className="text-text-gray">
        Community posting is not available at the moment.
      </p>
    );
  }

  return (
    <div>
      {/* Profile card */}
      <div className="overflow-hidden rounded-2xl border border-border-custom bg-white">
        <div className="h-24 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-primary shadow">
              {avatar ? (
                <img src={avatar} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
                  {initials(displayName)}
                </span>
              )}
            </div>
            {noticesOpen ? (
              <Link
                href="/post/notice?profile=1"
                className="rounded-lg border border-border-custom px-3 py-2 text-sm font-semibold text-text hover:border-primary hover:text-primary"
              >
                {profile.data ? 'Edit profile' : 'Set up profile'}
              </Link>
            ) : null}
          </div>

          <h2 className="mt-3 text-2xl font-black text-text">{displayName}</h2>
          <p className="text-sm text-text-gray">
            {[city, memberSince ? `Member since ${memberSince}` : null].filter(Boolean).join(' · ') ||
              'Add a city and photo to complete your community profile.'}
          </p>
          {profile.data?.about ? (
            <p className="mt-2 max-w-2xl text-sm text-text-gray">{profile.data.about}</p>
          ) : null}

          {!profile.data && noticesOpen ? (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-dashed border-border-custom bg-background-primary/40 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-text">Set up your community profile</p>
                <p className="text-sm text-text-gray">
                  Your name and photo appear on every notice and lost &amp; found post.
                </p>
              </div>
              <Link
                href="/post/notice?profile=1"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Set up profile
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat value={activeNotices} label="Active notices" />
        <Stat value={activeLost} label="Active lost & found" />
        <Stat value={`${totalPosts}${hasMore ? '+' : ''}`} label="Total posts" />
      </div>

      {/* Section tabs */}
      <div className="mt-6 flex items-center justify-between gap-3 border-b border-border-custom">
        <div className="flex gap-1">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === item.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-gray hover:text-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {activeTab === 'notices' && canEditNotices ? (
          <Link href="/post/notice" className="text-sm font-semibold text-primary">
            Post a notice
          </Link>
        ) : null}
        {activeTab === 'lost-found' && canEditLost ? (
          <Link href="/post/lost-found" className="text-sm font-semibold text-primary">
            Post lost or found
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        {activeTab === 'notices' ? (
          noticesQuery.isLoading ? (
            <p className="py-10 text-center text-text-gray">Loading your notices…</p>
          ) : noticesQuery.isError ? (
            <p className="py-10 text-center text-error">Could not load your notices.</p>
          ) : !noticeItems.length ? (
            <div className="rounded-xl border border-dashed border-border-custom py-12 text-center">
              <p className="font-semibold text-text">You haven&apos;t posted any notices yet.</p>
              <p className="mt-1 text-sm text-text-gray">
                Post a funeral, memorial, obituary or other notice.
              </p>
              {canEditNotices ? (
                <Link href="/post/notice" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                  Post a notice
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-3">
              {noticeItems.map((post) => (
                <OwnerNoticeCard
                  key={post.id}
                  post={post}
                  canEdit={canEditNotices}
                  rules={noticeConfig.data?.listing}
                  onRenew={(value) => noticesApi.renew(post.id, value).then(refresh)}
                  onDelete={() => noticesApi.remove(post.id).then(refresh)}
                />
              ))}
            </ul>
          )
        ) : lostQuery.isLoading ? (
          <p className="py-10 text-center text-text-gray">Loading your posts…</p>
        ) : lostQuery.isError ? (
          <p className="py-10 text-center text-error">Could not load your posts.</p>
        ) : !lostItems.length ? (
          <div className="rounded-xl border border-dashed border-border-custom py-12 text-center">
            <p className="font-semibold text-text">You haven&apos;t posted anything yet.</p>
            <p className="mt-1 text-sm text-text-gray">
              Lost something? Found something? Help it get home.
            </p>
            {canEditLost ? (
              <Link href="/post/lost-found" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                Post lost or found
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-3">
            {lostItems.map((post) => (
              <OwnerLostFoundCard
                key={post.id}
                post={post}
                canEdit={canEditLost}
                rules={lostConfig.data?.listing}
                onRenew={(value) => lostFoundApi.renew(post.id, value).then(refresh)}
                onDelete={() => lostFoundApi.remove(post.id).then(refresh)}
                onResolve={() => resolve(post.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <LoadMore
        show={Boolean(activeTab === 'notices' ? noticesQuery.hasNextPage : lostQuery.hasNextPage)}
        loading={activeTab === 'notices' ? noticesQuery.isFetchingNextPage : lostQuery.isFetchingNextPage}
        onClick={() => (activeTab === 'notices' ? noticesQuery.fetchNextPage() : lostQuery.fetchNextPage())}
      />
    </div>
  );
}
