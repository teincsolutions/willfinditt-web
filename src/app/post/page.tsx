import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchSections, sectionState } from '@/lib/community-server';

export const dynamic = 'force-dynamic';

/**
 * "Add post" asks for the post type first (plan v3 decision 3). Decided on
 * the server: when no community section is open for posting (or the flags
 * cannot be read) it goes straight to the normal ad form, with no flash.
 */
export default async function PostChooserPage() {
  const flags = await fetchSections();
  const notices = sectionState(flags, 'event_notices') === 'ON';
  const lostFound = sectionState(flags, 'lost_found') === 'ON';
  if (!notices && !lostFound) redirect('/ads/new');

  const options = [
    {
      href: '/ads/new',
      title: 'Sell an item or ad',
      text: 'Products, services, property, jobs and everything else.',
      show: true,
    },
    {
      href: '/post/notice',
      title: 'Events & Notices',
      text: 'Funerals, memorials, obituaries and other notices.',
      show: notices,
    },
    {
      href: '/post/lost-found',
      title: 'Lost & Found',
      text: 'Report something you lost or something you found.',
      show: lostFound,
    },
  ].filter((o) => o.show);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-gray hover:text-primary"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
        </svg>
        Back
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Sell or post</h1>
      <p className="text-text-gray mb-8">Choose the type of post.</p>
      <div className="grid gap-4">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="block rounded-xl border border-border-custom bg-surface p-5 hover:border-primary hover:shadow-md transition"
          >
            <h2 className="text-lg font-bold">{o.title}</h2>
            <p className="text-text-gray">{o.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
