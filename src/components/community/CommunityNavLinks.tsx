'use client';

import Link from 'next/link';
import { useSections } from '@/hooks/useCommunity';

const LINKS = [
  { key: 'event_notices', href: '/notices', label: 'Events & Notices', sub: 'Funerals, memorials, obituaries' },
  { key: 'lost_found', href: '/lost-and-found', label: 'Lost & Found', sub: 'Lost something? Found something?' },
] as const;

/**
 * Menu links to community sections. Renders nothing unless a section is
 * open (ON / READ_ONLY), so the menu is unchanged while they are off.
 */
export function CommunityNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { data } = useSections();
  const visible = LINKS.filter((l) => {
    const state = data?.find((f) => f.key === l.key)?.state;
    return state === 'ON' || state === 'READ_ONLY';
  });
  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-background-primary transition-all"
        >
          <div className="w-11 h-11 bg-primaryLight flex items-center justify-center rounded-xl text-primary font-bold">
            {l.label.charAt(0)}
          </div>
          <div className="flex-1">
            <span className="font-bold text-text block">{l.label}</span>
            <span className="text-[11px] text-text-light-gray font-medium">{l.sub}</span>
          </div>
        </Link>
      ))}
    </>
  );
}
