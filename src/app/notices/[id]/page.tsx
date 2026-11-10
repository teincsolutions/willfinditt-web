'use client';

/* eslint-disable @next/next/no-img-element -- upload bucket images */
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { SectionGate } from '@/components/community/SectionGate';
import { noticeTypeLabel } from '@/components/community/Cards';
import { ShareButton } from '@/components/community/ShareButton';
import { ChatButton } from '@/components/community/ContactButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useNotice } from '@/hooks/useCommunity';
import { noticesApi } from '@/services/community.service';
import type { EventPost } from '@/types/community';

function NoticeDetail({ post, readOnly }: { post: EventPost; readOnly: boolean }) {
  const deceased = post.images.find((i) => i.role === 'DECEASED_PHOTO');
  const poster = post.images.find((i) => i.role === 'POSTER');
  const gallery = post.images.filter((i) => i.role === 'GALLERY');

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {deceased && (
              <figure>
                <img
                  src={deceased.url}
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
                <a href={poster.url} target="_blank" rel="noreferrer">
                  <img
                    src={poster.url}
                    alt="Funeral poster or obituary"
                    className="w-full rounded-xl object-contain aspect-[4/5] bg-background-primary"
                  />
                </a>
                <figcaption className="text-xs text-text-gray mt-1">
                  Poster / obituary (tap to open)
                </figcaption>
              </figure>
            )}
          </div>
        )}

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

        <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>

        {gallery.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gallery.map((img) => (
              <a key={img.url} href={img.url} target="_blank" rel="noreferrer">
                <img
                  src={img.url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg"
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

function NoticeLoader({ readOnly }: { readOnly: boolean }) {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const query = useNotice(id, isAuthenticated);

  if (authLoading || query.isLoading) {
    return <p className="max-w-5xl mx-auto px-4 py-16 text-text-gray">Loading…</p>;
  }
  if (!query.data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Notice not found</h1>
        <p className="text-text-gray mb-6">
          It may have ended, been removed, or need you to{' '}
          <Link href={`/auth/login?redirect=/notices/${id}`} className="text-primary font-semibold">
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

export default function NoticePage() {
  return (
    <SectionGate section="event_notices">
      {({ readOnly }) => <NoticeLoader readOnly={readOnly} />}
    </SectionGate>
  );
}
