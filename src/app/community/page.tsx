import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchSections, sectionState } from '@/lib/community-server';
import { CommunityHubClient } from './CommunityHubClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const flags = await fetchSections();
  const notices = sectionState(flags, 'event_notices');
  const lost = sectionState(flags, 'lost_found');
  const dating = sectionState(flags, 'dating');
  if (notices === 'OFF' && lost === 'OFF' && dating === 'OFF') {
    return { title: 'Page not found', robots: { index: false } };
  }
  return {
    title: 'Community',
    description:
      'Events & notices, lost & found and community profiles on WillfindITT.',
    alternates: { canonical: '/community' },
    openGraph: {
      title: 'Community - WillfindITT',
      description:
        'Funeral notices, lost & found and community profiles across Ghana.',
      url: '/community',
      type: 'website',
    },
  };
}

export default async function CommunityPage() {
  const flags = await fetchSections();
  const notices = sectionState(flags, 'event_notices');
  const lost = sectionState(flags, 'lost_found');
  const dating = sectionState(flags, 'dating');
  if (notices === 'OFF' && lost === 'OFF' && dating === 'OFF') notFound();

  return <CommunityHubClient initialFlags={flags ?? undefined} />;
}
