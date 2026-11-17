import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchNoticeProfile,
  fetchProfileNotices,
  fetchSections,
  sectionState,
  summary,
} from '@/lib/community-server';
import { ProfileClient } from './ProfileClient';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const state = sectionState(await fetchSections(), 'event_notices');
  if (state === 'OFF') return { title: 'Page not found', robots: { index: false } };
  const profile = state === 'SHUTDOWN' ? null : await fetchNoticeProfile(id);
  if (!profile) return { title: 'Notices', robots: { index: false } };
  const description = profile.about
    ? summary(profile.about)
    : `Notices from ${profile.displayName} on WillfindITT.`;
  return {
    title: profile.displayName,
    description,
    alternates: { canonical: `/notices/profiles/${id}` },
    openGraph: {
      title: profile.displayName,
      description,
      url: `/notices/profiles/${id}`,
      type: 'profile',
    },
  };
}

export default async function NoticeProfilePage({ params }: Params) {
  const { id } = await params;
  const flags = await fetchSections();
  const state = sectionState(flags, 'event_notices');
  if (state === 'OFF') notFound();
  const live = state === 'ON' || state === 'READ_ONLY';
  const [profile, posts] = live
    ? await Promise.all([fetchNoticeProfile(id), fetchProfileNotices(id)])
    : [null, null];
  return (
    <ProfileClient
      id={id}
      initialFlags={flags ?? undefined}
      initialProfile={profile}
      initialPosts={posts ?? undefined}
    />
  );
}
