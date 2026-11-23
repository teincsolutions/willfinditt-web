'use client';

/* eslint-disable @next/next/no-img-element -- upload bucket images */
import Link from 'next/link';
import { format } from 'date-fns';
import { SectionGate } from '@/components/community/SectionGate';
import { noticeTypeLabel } from '@/components/community/Cards';
import { ShareButton } from '@/components/community/ShareButton';
import { ChatButton } from '@/components/community/ContactButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useNotice } from '@/hooks/useCommunity';
import { noticesApi } from '@/services/community.service';
import type { EventPost, SectionFlag } from '@/types/community';

function NoticeDetail({
  post,
  readOnly,
}: {
  post: EventPost;
  readOnly: boolean;
}) {
  const deceased = post.images.find(
    (i) => i.role === 'DECEASED_PHOTO' && i.url,
  );
  const poster = post.images.find((i) => i.role === 'POSTER' && i.url);
  const gallery = post.images.filter((i) => i.role === 'GALLERY' && i.url);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <article className="lg:col-span-2 space-y-6">
        <div>
          <span className="text-sm font-semibold text-primary">
            {noticeTypeLabel(post)}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">{post.title}</h1>
        </div>

        {(deceased || poster) && (
          <div
            className={`grid gap-4 ${deceased && poster ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md'}`}
          >
            {deceased && (
              <figure>
                <img
                  src={deceased.url ?? undefined}
                  referrerPolicy="no-referrer"
                  alt="Photo of the deceased"
                  className="w-full rounded-xl object-cover aspect-[4/5] bg-background-primary"
                />
                <figcaption className="text-xs text-text-gray mt-1">
                  In loving memory
                </figcaption>
              </figure>
            )}
            {poster && (
              <figure>
                <img
                  src={poster.url ?? undefined}
                  referrerPolicy="no-referrer"
                  alt="Funeral poster or obituary"
                  className="w-full h-auto max-h-[36rem] rounded-xl object-contain"
                />
                <figcaption className="text-xs text-text-gray mt-1">
                  Poster / obituary
                </figcaption>
              </figure>
            )}
          </div>
        )}

        {(post.eventAt || post.venue || post.city) && (
          <div className="rounded-xl border border-border-custom p-4 space-y-1 text-sm">
            {post.eventAt && (
              <p>
                <span className="font-semibold">When: </span>
                {format(new Date(post.eventAt), 'EEEE d MMMM yyyy, h:mm a')}
              </p>
            )}
            {(post.venue || post.city) && (
              <p>
                <span className="font-semibold">Where: </span>
                {[post.venue, post.city?.name].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>

        {gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery.map((img) => (
              <a
                key={img.sortOrder}
                href={img.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                title="Open full size"
              >
                <img
                  src={img.url ?? undefined}
                  referrerPolicy="no-referrer"
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg bg-background-primary hover:opacity-90 transition-opacity"
                />
              </a>
            ))}
          </div>
        )}
      </article>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border-custom p-4">
          <p className="text-xs text-text-gray mb-1">Posted by</p>
          <Link
            href={`/notices/profiles/${post.profile.id}`}
            className="flex items-center gap-3"
          >
            {post.profile.photoUrl ? (
              <img
                src={post.profile.photoUrl}
                referrerPolicy="no-referrer"
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primaryLight flex items-center justify-center font-bold text-primary">
                {post.profile.displayName.charAt(0)}
              </div>
            )}
            <span className="font-bold">{post.profile.displayName}</span>
          </Link>
        </div>
        <ChatButton
          startChat={() => noticesApi.chat(post.id)}
          disabled={readOnly}
          label={readOnly ? 'Messaging paused' : 'Message the family'}
        />
        <ShareButton title={post.title} path={`/notices/${post.id}`} />
        <p className="text-xs text-text-light-gray">
          Posted {format(new Date(post.createdAt), 'd MMM yyyy')}
          {post.visibility === 'UNLISTED' && ' · Only people with the link'}
        </p>
      </aside>
    </div>
  );
}

function NoticeLoader({
  id,
  readOnly,
  initialPost,
}: {
  id: string;
  readOnly: boolean;
  initialPost?: EventPost | null;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // A public notice comes from the server; an unlisted one is fetched here
  // once we know the reader is signed in.
  const query = useNotice(id, isAuthenticated, initialPost);

  if (!query.data && (authLoading || query.isLoading)) {
    return (
      <p className="max-w-5xl mx-auto px-4 py-16 text-text-gray">Loading…</p>
    );
  }
  if (!query.data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Notice not found</h1>
        <p className="text-text-gray mb-6">
          It may have ended, been removed, or need you to{' '}
          <Link
            href={`/auth/login?redirect=/notices/${id}`}
            className="text-primary font-semibold"
          >
            sign in
          </Link>
          .
        </p>
        <Link href="/notices" className="text-primary font-semibold">
          See all notices
        </Link>
      </div>
    );
  }
  return <NoticeDetail post={query.data} readOnly={readOnly} />;
}

export function NoticeClient({
  id,
  initialFlags,
  initialPost,
}: {
  id: string;
  initialFlags?: SectionFlag[];
  initialPost?: EventPost | null;
}) {
  return (
    <SectionGate section="event_notices" initial={initialFlags}>
      {({ readOnly }) => (
        <NoticeLoader id={id} readOnly={readOnly} initialPost={initialPost} />
      )}
    </SectionGate>
  );
}
