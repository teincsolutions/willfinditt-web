import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchNotice,
  fetchSections,
  sectionState,
  summary,
} from '@/lib/community-server';
import { NoticeClient } from './NoticeClient';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * Public notices are indexable. An unlisted notice is never returned to the
 * server (it needs a signed-in reader), so it gets noindex, as do missing
 * or ended ones.
 */
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const state = sectionState(await fetchSections(), 'event_notices');
  if (state === 'OFF') return { title: 'Page not found', robots: { index: false } };
  const post = state === 'SHUTDOWN' ? null : await fetchNotice(id);
  if (!post) {
    return {
      title: 'Notice',
      robots: { index: false, follow: false },
    };
  }
  const description = summary(post.body);
  return {
    title: post.title,
    description,
    robots: { index: post.visibility === 'PUBLIC', follow: true },
    alternates: { canonical: `/notices/${id}` },
    openGraph: {
      title: post.title,
      description,
      url: `/notices/${id}`,
      type: 'article',
      siteName: 'WillfindITT',
    },
  };
}

export default async function NoticePage({ params }: Params) {
  const { id } = await params;
  const flags = await fetchSections();
  const state = sectionState(flags, 'event_notices');
  if (state === 'OFF') notFound();
  const post =
    state === 'ON' || state === 'READ_ONLY' ? await fetchNotice(id) : null;
  return (
    <NoticeClient
      id={id}
      initialFlags={flags ?? undefined}
      initialPost={post}
    />
  );
}
