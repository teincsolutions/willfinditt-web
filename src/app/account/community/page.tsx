'use client';

import Link from 'next/link';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatPostedDate } from '@/lib/formatDate';
import {
  useLostFoundFormConfig,
  useMyKey,
  useNoticeFormConfig,
  useSection,
} from '@/hooks/useCommunity';
import { LoadMore } from '@/components/community/SectionGate';
import {
  ExpiryText,
  ListingActions,
} from '@/components/community/ListingPeriod';
import {
  apiError,
  lostFoundApi,
  noticesApi,
} from '@/services/community.service';

const STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Live', className: 'bg-successLight text-success' },
  RESOLVED: { label: 'Resolved', className: 'bg-background-primary' },
  EXPIRED: { label: 'Ended', className: 'bg-background-primary' },
  SUSPENDED: { label: 'Taken down', className: 'bg-errorLight text-error' },
  REJECTED: { label: 'Rejected', className: 'bg-errorLight text-error' },
};

function StatusBadge({ status }: { status?: string }) {
  const s = STATUS[status ?? 'ACTIVE'] ?? STATUS.ACTIVE;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.className}`}>
      {s.label}
    </span>
  );
}

/** Pages of the signed-in user's own posts (keys include the user id). */
function useMine<T>(
  key: readonly unknown[],
  fetchPage: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null }>,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

function MyNotices() {
  const queryClient = useQueryClient();
  const myKey = useMyKey();
  const section = useSection('event_notices');
  const config = useNoticeFormConfig();
  const open = section.state === 'ON' || section.state === 'READ_ONLY';
  const canEdit = section.state === 'ON';
  const profile = useQuery({
    queryKey: [...myKey, 'notice-profile'],
    queryFn: noticesApi.myProfile,
    enabled: open,
  });
  const posts = useMine([...myKey, 'notices'], noticesApi.mine, open);
  const items = posts.data?.pages.flatMap((p) => p.items) ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['community'] });
  if (!open) return null;

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Events & Notices</h2>
        {canEdit && (
          <div className="flex gap-3 text-sm font-semibold">
            {profile.data && (
              <Link href="/post/notice?profile=1" className="text-primary">
                Edit profile
              </Link>
            )}
            <Link href="/post/notice" className="text-primary">
              Post a notice
            </Link>
          </div>
        )}
      </div>
      {profile.data && (
        <p className="text-sm text-text-gray mb-3">
          Posting as <strong>{profile.data.displayName}</strong>
        </p>
      )}
      {posts.isLoading ? (
        <p className="text-text-gray">Loading…</p>
      ) : posts.isError ? (
        <p className="text-error">Could not load your notices.</p>
      ) : !items.length ? (
        <p className="text-text-gray">You haven&apos;t posted any notices.</p>
      ) : (
        <ul className="divide-y divide-border-custom rounded-xl border border-border-custom bg-white">
          {items.map((p) => {
            const takenDown = p.status === 'SUSPENDED' || p.status === 'REJECTED';
            return (
              <li key={p.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/notices/${p.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-gray">
                      <StatusBadge status={p.status} />
                      {p.visibility === 'UNLISTED' && <span>Link only</span>}
                      <span>{formatPostedDate(p.createdAt)}</span>
                      <ExpiryText expiresAt={p.expiresAt} />
                    </div>
                  </div>
                  {canEdit && !takenDown && (
                    <Link
                      href={`/post/notice?edit=${p.id}`}
                      className="text-sm font-semibold text-primary shrink-0"
                    >
                      Edit
                    </Link>
                  )}
                </div>
                {canEdit && (
                  <ListingActions
                    rules={config.data?.listing}
                    canRenew={p.status === 'ACTIVE' || p.status === 'EXPIRED'}
                    onRenew={(v) => noticesApi.renew(p.id, v).then(refresh)}
                    onDelete={() => noticesApi.remove(p.id).then(refresh)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <LoadMore
        show={Boolean(posts.hasNextPage)}
        loading={posts.isFetchingNextPage}
        onClick={() => posts.fetchNextPage()}
      />
    </section>
  );
}

function MyLostFound() {
  const queryClient = useQueryClient();
  const myKey = useMyKey();
  const section = useSection('lost_found');
  const config = useLostFoundFormConfig();
  const open = section.state === 'ON' || section.state === 'READ_ONLY';
  const canEdit = section.state === 'ON';
  const posts = useMine([...myKey, 'lost-found'], lostFoundApi.mine, open);
  const items = posts.data?.pages.flatMap((p) => p.items) ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['community'] });
  if (!open) return null;

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

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Lost & Found</h2>
        {canEdit && (
          <Link href="/post/lost-found" className="text-sm font-semibold text-primary">
            Post lost or found
          </Link>
        )}
      </div>
      {posts.isLoading ? (
        <p className="text-text-gray">Loading…</p>
      ) : posts.isError ? (
        <p className="text-error">Could not load your posts.</p>
      ) : !items.length ? (
        <p className="text-text-gray">You haven&apos;t posted anything.</p>
      ) : (
        <ul className="divide-y divide-border-custom rounded-xl border border-border-custom bg-white">
          {items.map((p) => (
            <li key={p.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/lost-and-found/${p.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {p.kind === 'LOST' ? 'Lost: ' : 'Found: '}
                    {p.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-gray">
                    <StatusBadge status={p.status} />
                    <span>{formatPostedDate(p.createdAt)}</span>
                    <ExpiryText expiresAt={p.expiresAt} />
                  </div>
                </div>
                {canEdit && p.status === 'ACTIVE' && (
                  <div className="flex gap-4 shrink-0 text-sm font-semibold">
                    <Link href={`/post/lost-found?edit=${p.id}`} className="text-primary">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => resolve(p.id)}
                      className="text-success"
                    >
                      Resolved
                    </button>
                  </div>
                )}
              </div>
              {canEdit && (
                <ListingActions
                  rules={config.data?.listing}
                  canRenew={p.status === 'ACTIVE' || p.status === 'EXPIRED'}
                  onRenew={(v) => lostFoundApi.renew(p.id, v).then(refresh)}
                  onDelete={() => lostFoundApi.remove(p.id).then(refresh)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <LoadMore
        show={Boolean(posts.hasNextPage)}
        loading={posts.isFetchingNextPage}
        onClick={() => posts.fetchNextPage()}
      />
    </section>
  );
}

export default function MyCommunityPostsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Community posts</h2>
      <MyNotices />
      <MyLostFound />
    </div>
  );
}
