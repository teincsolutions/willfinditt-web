import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchNotices,
  fetchSections,
  sectionState,
} from '@/lib/community-server';
import { NoticesClient } from './NoticesClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const state = sectionState(await fetchSections(), 'event_notices');
  if (state === 'OFF') return { title: 'Page not found', robots: { index: false } };
  return {
    title: 'Events & Notices',
    description:
      'Funerals, memorials, obituaries and other notices in Ghana on WillfindITT.',
    alternates: { canonical: '/notices' },
    openGraph: {
      title: 'Events & Notices - WillfindITT',
      description: 'Funerals, memorials, obituaries and other notices.',
      url: '/notices',
      type: 'website',
    },
  };
}

/** Server-rendered list; the client takes over for filters and paging. */
export default async function NoticesPage() {
  const flags = await fetchSections();
  const state = sectionState(flags, 'event_notices');
  if (state === 'OFF') notFound();
  const page =
    state === 'ON' || state === 'READ_ONLY' ? await fetchNotices() : null;
  return (
    <NoticesClient
      initialFlags={flags ?? undefined}
      initialPage={page ?? undefined}
    />
  );
}
