'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useSection } from '@/hooks/useCommunity';
import type { SectionKey } from '@/types/community';

/**
 * Renders a community section according to its state (plan v3, section 13):
 * OFF -> not found, SHUTDOWN -> maintenance screen, READ_ONLY -> banner and
 * `readOnly` for disabling post/edit controls.
 */
export function SectionGate({
  section,
  children,
}: {
  section: SectionKey;
  children: (ctx: { readOnly: boolean }) => ReactNode;
}) {
  const { isLoading, state, bannerMessage } = useSection(section);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-text-gray">
        Loading…
      </div>
    );
  }

  if (state === 'OFF') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-text-gray mb-6">
          This page doesn&apos;t exist or isn&apos;t available yet.
        </p>
        <Link href="/" className="text-primary font-semibold">
          Go to the home page
        </Link>
      </div>
    );
  }

  if (state === 'SHUTDOWN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Back soon</h1>
        <p className="text-text-gray mb-6">
          {bannerMessage || 'This section is closed for maintenance.'}
        </p>
        <Link href="/" className="text-primary font-semibold">
          Go to the home page
        </Link>
      </div>
    );
  }

  return (
    <>
      {state === 'READ_ONLY' && (
        <div className="bg-warning/15 border-b border-warning/40 text-sm text-center px-4 py-2">
          {bannerMessage || 'Posting is paused at the moment.'}
        </div>
      )}
      {children({ readOnly: state === 'READ_ONLY' })}
    </>
  );
}

/** Small "Load more" button for cursor lists. */
export function LoadMore({
  show,
  loading,
  onClick,
}: {
  show: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  if (!show) return null;
  return (
    <div className="text-center mt-8">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="px-5 py-2.5 rounded-lg border border-border-custom font-semibold hover:bg-background-primary disabled:opacity-60"
      >
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}
