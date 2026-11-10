/* eslint-disable @next/next/no-img-element -- community images come from
   the upload bucket; plain img avoids next/image remote host config. */
import Link from 'next/link';
import { format } from 'date-fns';
import { formatPostedDate } from '@/lib/formatDate';
import type { EventPost, EventType, LostFoundPost } from '@/types/community';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  FUNERAL: 'Funeral',
  MEMORIAL: 'Memorial',
  OBITUARY: 'Obituary',
  OTHER: 'Notice',
};

/** Picks the image to show on a card: deceased photo, poster, then gallery. */
export function noticeCover(post: EventPost): string | null {
  const by = (role: string) => post.images.find((i) => i.role === role)?.url;
  return by('DECEASED_PHOTO') ?? by('POSTER') ?? by('GALLERY') ?? null;
}

export function NoticeCard({ post }: { post: EventPost }) {
  const cover = noticeCover(post);
  return (
    <Link
      href={`/notices/${post.id}`}
      className="flex gap-4 rounded-xl border border-border-custom bg-white p-3 hover:shadow-md transition-shadow"
    >
      <div className="w-24 h-28 shrink-0 rounded-lg bg-background-primary overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-text-gray">
            {EVENT_TYPE_LABELS[post.eventType]}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="inline-block text-xs font-semibold text-primary mb-1">
          {EVENT_TYPE_LABELS[post.eventType]}
        </span>
        <h3 className="font-bold leading-snug line-clamp-2">{post.title}</h3>
        {post.eventAt && (
          <p className="text-sm mt-1">
            {format(new Date(post.eventAt), 'EEE d MMM yyyy, h:mm a')}
          </p>
        )}
        <p className="text-sm text-text-gray truncate">
          {[post.venue, post.city?.name].filter(Boolean).join(', ')}
        </p>
        <p className="text-xs text-text-light-gray mt-1">
          {post.profile.displayName}
          {formatPostedDate(post.createdAt) &&
            ` · ${formatPostedDate(post.createdAt)}`}
        </p>
      </div>
    </Link>
  );
}

export function LostFoundCard({ post }: { post: LostFoundPost }) {
  const cover = post.images[0]?.url;
  const lost = post.kind === 'LOST';
  return (
    <Link
      href={`/lost-and-found/${post.id}`}
      className="flex gap-4 rounded-xl border border-border-custom bg-white p-3 hover:shadow-md transition-shadow"
    >
      <div className="w-24 h-24 shrink-0 rounded-lg bg-background-primary overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-text-gray">
            No photo
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block text-xs font-bold px-2 py-0.5 rounded mb-1 ${
            lost ? 'bg-errorLight text-error' : 'bg-successLight text-success'
          }`}
        >
          {lost ? 'Lost' : 'Found'}
        </span>
        <h3 className="font-bold leading-snug line-clamp-2">{post.title}</h3>
        <p className="text-sm text-text-gray truncate">
          {[post.place, post.city?.name].filter(Boolean).join(', ')}
        </p>
        <p className="text-xs text-text-light-gray mt-1">
          {post.posterName}
          {formatPostedDate(post.createdAt) &&
            ` · ${formatPostedDate(post.createdAt)}`}
        </p>
      </div>
    </Link>
  );
}
