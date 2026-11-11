'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSections, useSellHref } from '@/hooks/useCommunity';

const canBrowse = (state?: string) => state === 'ON' || state === 'READ_ONLY';
const canPost = (state?: string) => state === 'ON';

function NoticesIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function LostFoundIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
    </svg>
  );
}

function PeopleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 0a3 3 0 1 0 0-6" />
    </svg>
  );
}

function SectionCard({
  href,
  title,
  description,
  icon,
  onNavigate,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group rounded-xl border border-transparent p-3 transition-colors hover:border-border-custom hover:bg-background-primary"
    >
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primaryLight text-primary">
        {icon}
      </div>
      <p className="font-bold text-text group-hover:text-primary">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-text-gray">{description}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Browse
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

/**
 * Desktop Community entry: a primary nav button with a mega menu. Hidden
 * entirely until at least one community section is open.
 */
export function CommunityMenu() {
  const { data: sections } = useSections();
  const { isAuthenticated } = useAuth();
  const sellHref = useSellHref();
  const [open, setOpen] = useState(false);

  const stateOf = (key: string) =>
    sections?.find((section) => section.key === key)?.state;
  const notices = stateOf('event_notices');
  const lostFound = stateOf('lost_found');
  const dating = stateOf('dating');
  const anythingOpen = canBrowse(notices) || canBrowse(lostFound) || dating === 'ON';

  if (!anythingOpen) return null;

  const close = () => setOpen(false);

  return (
    <div
      className="relative py-2"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-border-custom bg-background-primary/50 px-4 py-2 font-medium text-text shadow-sm transition-all hover:border-primary hover:shadow-md"
      >
        <PeopleIcon className="h-5 w-5 text-primary" />
        <span>Community</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-1 w-[760px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border-custom bg-background shadow-2xl">
          <div className="flex">
            <div className="flex-1 p-3">
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light-gray">
                Browse community
              </p>
              <div className="grid grid-cols-2 gap-1">
                {canBrowse(notices) ? (
                  <SectionCard
                    href="/notices"
                    title="Events & Notices"
                    description="Funerals, memorials, obituaries and other notices."
                    icon={<NoticesIcon />}
                    onNavigate={close}
                  />
                ) : null}
                {canBrowse(lostFound) ? (
                  <SectionCard
                    href="/lost-and-found"
                    title="Lost & Found"
                    description="Lost something? Found something? Help it get home."
                    icon={<LostFoundIcon />}
                    onNavigate={close}
                  />
                ) : null}
                {dating === 'ON' ? (
                  <SectionCard
                    href="/dating"
                    title="Dating"
                    description="A private, verified space. Login required."
                    icon={<PeopleIcon />}
                    onNavigate={close}
                  />
                ) : null}
              </div>
              <div className="mt-2 border-t border-border-custom pt-2">
                <Link
                  href="/community"
                  onClick={close}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-text hover:bg-background-primary hover:text-primary"
                >
                  Community home
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="w-60 border-l border-border-custom bg-background-primary/30 p-3">
              <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-text-light-gray">
                My community
              </p>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account/community"
                    onClick={close}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-text hover:bg-background hover:text-primary"
                  >
                    My posts & profile
                  </Link>
                  {canPost(notices) ? (
                    <Link
                      href="/post/notice"
                      onClick={close}
                      className="block rounded-lg px-3 py-2 text-sm text-text-gray hover:bg-background hover:text-primary"
                    >
                      Post a notice
                    </Link>
                  ) : null}
                  {canPost(lostFound) ? (
                    <Link
                      href="/post/lost-found"
                      onClick={close}
                      className="block rounded-lg px-3 py-2 text-sm text-text-gray hover:bg-background hover:text-primary"
                    >
                      Post lost or found
                    </Link>
                  ) : null}
                </>
              ) : (
                <Link
                  href="/auth/login?redirect=/account/community"
                  onClick={close}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-background"
                >
                  Sign in to post
                </Link>
              )}

              <div className="mt-2 border-t border-border-custom pt-2">
                <Link
                  href={sellHref}
                  onClick={close}
                  className="flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Sell / Post
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
