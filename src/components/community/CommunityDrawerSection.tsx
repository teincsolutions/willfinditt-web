'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSections } from '@/hooks/useCommunity';

const canBrowse = (state?: string) => state === 'ON' || state === 'READ_ONLY';

/**
 * Mobile-web Community block: one expandable menu item instead of several
 * separate drawer links.
 */
export function CommunityDrawerSection({ onNavigate }: { onNavigate?: () => void }) {
  const { data: sections } = useSections();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  const stateOf = (key: string) =>
    sections?.find((section) => section.key === key)?.state;
  const notices = stateOf('event_notices');
  const lostFound = stateOf('lost_found');
  const dating = stateOf('dating');
  const anythingOpen = canBrowse(notices) || canBrowse(lostFound) || dating === 'ON';

  if (!anythingOpen) return null;

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="drawer-community-links"
        className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all hover:bg-background-primary"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primaryLight text-primary">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 0a3 3 0 1 0 0-6"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span className="block font-bold text-text">Community</span>
          <span className="text-[11px] font-medium text-text-light-gray">
            Notices, lost &amp; found, my profile
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-text-light-gray transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div id="drawer-community-links" className="ml-6 space-y-1 border-l border-border-custom pl-3 pb-1">
          {canBrowse(notices) ? (
            <Link
              href="/notices"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-background-primary hover:text-primary"
            >
              Events &amp; Notices
            </Link>
          ) : null}
          {canBrowse(lostFound) ? (
            <Link
              href="/lost-and-found"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-background-primary hover:text-primary"
            >
              Lost &amp; Found
            </Link>
          ) : null}
          {dating === 'ON' ? (
            <Link
              href="/dating"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-background-primary hover:text-primary"
            >
              Dating
            </Link>
          ) : null}
          {isAuthenticated ? (
            <Link
              href="/account/community"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-background-primary hover:text-primary"
            >
              My community
            </Link>
          ) : (
            <Link
              href="/auth/login?redirect=/account/community"
              onClick={close}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-background-primary"
            >
              Sign in to post
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
