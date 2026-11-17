'use client';

/* eslint-disable @next/next/no-img-element -- upload bucket images */
import Link from 'next/link';
import { format } from 'date-fns';
import { SectionGate } from '@/components/community/SectionGate';
import {
  ChatButton,
  RevealPhoneButton,
} from '@/components/community/ContactButtons';
import { useLostFoundPost } from '@/hooks/useCommunity';
import { ShareButton } from '@/components/community/ShareButton';
import { lostFoundApi } from '@/services/community.service';
import type { LostFoundPost, SectionFlag } from '@/types/community';

function Detail({
  post,
  readOnly,
}: {
  post: LostFoundPost;
  readOnly: boolean;
}) {
  const lost = post.kind === 'LOST';
  const resolved = post.resolved;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <article className="lg:col-span-2 space-y-6">
        <div>
          <span
            className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
              lost ? 'bg-errorLight text-error' : 'bg-successLight text-success'
            }`}
          >
            {lost ? 'Lost' : 'Found'}
          </span>
          {post.categoryLabel && (
            <span className="inline-block ml-2 text-xs font-semibold text-text-gray">
              {post.categoryLabel}
            </span>
          )}
          {resolved && (
            <span className="inline-block ml-2 text-xs font-bold px-2 py-0.5 rounded bg-background-primary">
              Resolved
            </span>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mt-2">{post.title}</h1>
        </div>

        {post.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {post.images.map((img) => (
              <img
                key={img.sortOrder}
                src={img.url ?? undefined}
                referrerPolicy="no-referrer"
                alt=""
                className="w-full aspect-square object-cover rounded-lg bg-background-primary"
              />
            ))}
          </div>
        )}

        {(post.place || post.city || post.happenedAt) && (
          <div className="rounded-xl border border-border-custom p-4 space-y-1 text-sm">
            {(post.place || post.city) && (
              <p>
                <span className="font-semibold">Where: </span>
                {[post.place, post.city?.name].filter(Boolean).join(', ')}
              </p>
            )}
            {post.happenedAt && (
              <p>
                <span className="font-semibold">When: </span>
                {format(new Date(post.happenedAt), 'd MMMM yyyy')}
              </p>
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>
      </article>

      <aside className="space-y-4">
        <div className="rounded-xl border border-border-custom p-4">
          <p className="text-xs text-text-gray mb-1">Posted by</p>
          <p className="font-bold">{post.posterName}</p>
          <p className="text-xs text-text-light-gray mt-1">
            {format(new Date(post.createdAt), 'd MMM yyyy')}
          </p>
        </div>
        {resolved ? (
          <p className="rounded-xl bg-background-primary p-4 text-sm">
            The poster marked this as resolved.
          </p>
        ) : (
          <>
            <ChatButton
              startChat={() => lostFoundApi.chat(post.id)}
              disabled={readOnly}
              label={readOnly ? 'Messaging paused' : 'Message'}
            />
            {post.hasPhone && (
              <RevealPhoneButton
                reveal={() => lostFoundApi.revealPhone(post.id)}
              />
            )}
          </>
        )}
        <ShareButton title={post.title} path={`/lost-and-found/${post.id}`} />
        <p className="text-xs text-text-light-gray">
          Meet in a public place. Never pay a &quot;reward&quot; before you see
          the item.
        </p>
      </aside>
    </div>
  );
}

function Loader({
  id,
  readOnly,
  initialPost,
}: {
  id: string;
  readOnly: boolean;
  initialPost?: LostFoundPost | null;
}) {
  const query = useLostFoundPost(id, initialPost);
  if (!query.data && query.isLoading) {
    return (
      <p className="max-w-5xl mx-auto px-4 py-16 text-text-gray">Loading…</p>
    );
  }
  if (!query.data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Post not found</h1>
        <p className="text-text-gray mb-6">
          It may have ended or been removed.
        </p>
        <Link href="/lost-and-found" className="text-primary font-semibold">
          See all lost & found posts
        </Link>
      </div>
    );
  }
  return <Detail post={query.data} readOnly={readOnly} />;
}

export function LostFoundPostClient({
  id,
  initialFlags,
  initialPost,
}: {
  id: string;
  initialFlags?: SectionFlag[];
  initialPost?: LostFoundPost | null;
}) {
  return (
    <SectionGate section="lost_found" initial={initialFlags}>
      {({ readOnly }) => (
        <Loader id={id} readOnly={readOnly} initialPost={initialPost} />
      )}
    </SectionGate>
  );
}
