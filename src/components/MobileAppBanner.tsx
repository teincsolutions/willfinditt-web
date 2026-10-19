'use client';

import { useEffect, useState } from 'react';

const APP_STORE_URL =
  'https://apps.apple.com/us/app/willfinditt/id6755352985';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.willfinditt.willfinditt';
const DISMISS_KEY = 'willfinditt-app-banner-dismissed';
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

type Platform = 'ios' | 'android' | null;

/**
 * Lightweight install/open banner for mobile browsers. iOS also gets the
 * native Safari smart banner from `apple-itunes-app` metadata; this covers
 * Android and in-app browsers where the native banner is unavailable.
 */
export function MobileAppBanner() {
  const [platform, setPlatform] = useState<Platform>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    let isDismissed = false;
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      isDismissed =
        dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS;
    } catch {
      // localStorage may be unavailable (private mode); show the banner.
    }

    if (!isDismissed && (isIOS || isAndroid)) {
      setPlatform(isIOS ? 'ios' : 'android');
    }
  }, []);

  if (!platform) return null;

  const storeUrl = platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  const openUrl =
    platform === 'ios'
      ? 'willfinditt://'
      : `intent://#Intent;scheme=willfinditt;package=com.willfinditt.willfinditt;S.browser_fallback_url=${encodeURIComponent(
          PLAY_STORE_URL
        )};end`;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures; the banner still closes for this session.
    }
    setPlatform(null);
  };

  return (
    <div className="lg:hidden bg-text text-white">
      <div className="container mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black leading-tight">
            Get the Willfinditt app
          </p>
          <p className="text-[11px] text-white/70 leading-tight">
            Open listings faster and message sellers on the go.
          </p>
        </div>

        <a
          href={openUrl}
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/15 text-xs font-bold hover:bg-white/25 transition-colors"
        >
          Open app
        </a>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Get app
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss app banner"
          className="flex-shrink-0 p-1 text-white/70 hover:text-white transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
