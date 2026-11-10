'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSections } from '@/hooks/useCommunity';

/**
 * "Add post" asks for the post type first (plan v3 decision 3). When no
 * community section is open for posting, it goes straight to the normal ad
 * form, so nothing changes for users while the sections are off.
 */
export default function PostChooserPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useSections();
  const open = (key: string) => data?.find((f) => f.key === key)?.state === 'ON';
  const notices = open('event_notices');
  const lostFound = open('lost_found');
  const anyOpen = notices || lostFound;

  useEffect(() => {
    if (isError || (!isLoading && !anyOpen)) router.replace('/ads/new');
  }, [isLoading, isError, anyOpen, router]);

  if (isLoading || !anyOpen) {
    return <p className="max-w-3xl mx-auto px-4 py-16 text-text-gray">Loading…</p>;
  }

  const options = [
    {
      href: '/ads/new',
      title: 'Sell or advertise',
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
      <h1 className="text-2xl md:text-3xl font-bold mb-2">What are you posting?</h1>
      <p className="text-text-gray mb-8">Choose the type of post.</p>
      <div className="grid gap-4">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="block rounded-xl border border-border-custom bg-white p-5 hover:border-primary hover:shadow-md transition"
          >
            <h2 className="text-lg font-bold">{o.title}</h2>
            <p className="text-text-gray">{o.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
