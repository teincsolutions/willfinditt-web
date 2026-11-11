import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchLostFoundPost,
  fetchSections,
  sectionState,
  summary,
} from '@/lib/community-server';
import { LostFoundPostClient } from './LostFoundPostClient';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const state = sectionState(await fetchSections(), 'lost_found');
  if (state === 'OFF') return { title: 'Page not found', robots: { index: false } };
  const post = state === 'SHUTDOWN' ? null : await fetchLostFoundPost(id);
  if (!post) return { title: 'Lost & Found', robots: { index: false } };
  const title = `${post.kind === 'LOST' ? 'Lost' : 'Found'}: ${post.title}`;
  const description = summary(post.body);
  return {
    title,
    description,
    // Resolved posts stay reachable by link but leave search results.
    robots: { index: !post.resolved, follow: true },
    alternates: { canonical: `/lost-and-found/${id}` },
    openGraph: {
      title,
      description,
      url: `/lost-and-found/${id}`,
      type: 'article',
      siteName: 'WillfindITT',
    },
  };
}

export default async function LostFoundPostPage({ params }: Params) {
  const { id } = await params;
  const flags = await fetchSections();
  const state = sectionState(flags, 'lost_found');
  if (state === 'OFF') notFound();
  const post =
    state === 'ON' || state === 'READ_ONLY'
      ? await fetchLostFoundPost(id)
      : null;
  return (
    <LostFoundPostClient
      id={id}
      initialFlags={flags ?? undefined}
      initialPost={post}
    />
  );
}
