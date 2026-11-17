import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchLostFound,
  fetchSections,
  sectionState,
} from '@/lib/community-server';
import { LostFoundClient } from './LostFoundClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const state = sectionState(await fetchSections(), 'lost_found');
  if (state === 'OFF') return { title: 'Page not found', robots: { index: false } };
  return {
    title: 'Lost & Found',
    description:
      'Lost something or found something in Ghana? Post it on WillfindITT and help it get home.',
    alternates: { canonical: '/lost-and-found' },
    openGraph: {
      title: 'Lost & Found - WillfindITT',
      description: 'Lost something? Found something? Help it get home.',
      url: '/lost-and-found',
      type: 'website',
    },
  };
}

/** Server-rendered list; the client takes over for filters and paging. */
export default async function LostAndFoundPage() {
  const flags = await fetchSections();
  const state = sectionState(flags, 'lost_found');
  if (state === 'OFF') notFound();
  const page =
    state === 'ON' || state === 'READ_ONLY' ? await fetchLostFound() : null;
  return (
    <LostFoundClient
      initialFlags={flags ?? undefined}
      initialPage={page ?? undefined}
    />
  );
}
