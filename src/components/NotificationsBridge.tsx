'use client';

import { useEffect } from 'react';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';

/**
 * Mounts the notifications websocket for the whole session. Renders nothing.
 *
 * Also registers the minimal service worker used to render OS notifications:
 * Android Chrome does not support `new Notification()` and requires
 * `registration.showNotification()`.
 */
export function NotificationsBridge() {
  useNotificationsSocket();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Service workers are only available on secure origins (or localhost).
    const isSecure =
      window.location.protocol === 'https:' ||
      ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (!isSecure) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal: the in-app toast still works without the worker.
    });
  }, []);

  return null;
}
