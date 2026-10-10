'use client';

import { useEffect, useState } from 'react';
import {
  GA_ID,
  PIXEL_ID,
  getConsent,
  setConsent,
  type ConsentPreferences,
} from '@/lib/analytics';

/** Dispatched (e.g. from /cookie-policy) to reopen the preferences panel. */
export const OPEN_COOKIE_SETTINGS_EVENT = 'wf-open-cookie-settings';

/**
 * Cookie-consent banner (Ghana Data Protection Act 2012).
 * Separate asks for analytics vs marketing; strictly-necessary cookies
 * are disclosed but need no consent. Links to /cookie-policy.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  // GDPR: consent must be opt-in — both default OFF, no pre-ticked boxes.
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!GA_ID && !PIXEL_ID) return;
    if (getConsent() !== null) return;
    const t = setTimeout(() => setVisible(true), 1500);
    const reopen = () => {
      const stored = getConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => {
      clearTimeout(t);
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    };
  }, []);

  if (!visible) return null;

  const save = (prefs: ConsentPreferences) => {
    setConsent(prefs);
    setVisible(false);
    setCustomizing(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto max-w-5xl">
        {!customizing ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              We use cookies to measure traffic and improve WillfindITT. Choose
              what you allow — the site works either way.{' '}
              <a href="/cookie-policy" className="underline">
                Cookie Policy
              </a>
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={() => save({ analytics: true, marketing: true })}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-900">
              Cookie preferences
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2 opacity-70">
                <span>
                  <span className="font-medium text-gray-900">
                    Strictly necessary
                  </span>
                  <br />
                  Login, security, load balancing. Always on — the site cannot
                  work without these.
                </span>
                <input type="checkbox" checked disabled aria-label="Strictly necessary cookies (always on)" className="mt-1" />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2">
                <span>
                  <span className="font-medium text-gray-900">Analytics</span>
                  <br />
                  Anonymous traffic measurement (Google Analytics 4) to improve
                  WillfindITT.
                </span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  aria-label="Analytics cookies"
                  className="mt-1"
                />
              </label>
              {/* Only ask for marketing when the Pixel is actually configured. */}
              {PIXEL_ID ? (
                <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2">
                  <span>
                    <span className="font-medium text-gray-900">
                      Marketing & ads
                    </span>
                    <br />
                    Meta Pixel for relevant ads and campaign measurement on
                    Facebook/Instagram.
                  </span>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    aria-label="Marketing cookies"
                    className="mt-1"
                  />
                </label>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="/cookie-policy" className="text-sm underline text-gray-700">
                Read the Cookie Policy
              </a>
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => save({ analytics: false, marketing: false })}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reject all
              </button>
              <button
                type="button"
                onClick={() =>
                  save({ analytics, marketing: PIXEL_ID ? marketing : false })
                }
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Save choices
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
