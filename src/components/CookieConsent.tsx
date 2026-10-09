'use client';

import { useEffect, useState } from 'react';
import { getConsent, setConsent } from '@/lib/analytics';
import { GA_ID, PIXEL_ID } from '@/lib/analytics';

/**
 * Cookie-consent banner (Ghana Data Protection Act 2012).
 * Renders only when tracking IDs are configured and no choice stored yet.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ((!GA_ID && !PIXEL_ID) || getConsent() !== null) return;
    // Small delay so the banner doesn't flash over the first paint.
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const choose = (granted: boolean) => {
    setConsent(granted ? 'granted' : 'declined');
    window.dispatchEvent(new Event('wf-consent-change'));
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          We use cookies to measure traffic and improve WillfindITT. You can
          accept or decline tracking — the site works either way.{' '}
          <a href="/privacy-policy" className="underline">
            Privacy Policy
          </a>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose(true)}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
