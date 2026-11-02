'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/lib/auth';
import { useNotificationsSocket } from '@/hooks/useNotificationsSocket';
import {
  releaseWebPushRegistration,
  syncWebPushRegistration,
} from '@/lib/web-push';

/**
 * Mounts the notifications websocket for the whole session. Renders nothing.
 *
 * Also registers the service worker used for web push (and for rendering OS
 * notifications: Android Chrome does not support `new Notification()`), and
 * keeps the browser's push registration bound to the signed-in user.
 */
export function NotificationsBridge() {
  useNotificationsSocket();

  const { isAuthenticated, isLoading } = useAuth();

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

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // The FCM token survives logins, but it must point at the current user.
      void syncWebPushRegistration();
      return;
    }

    // `isLoading` is false while the profile query is disabled (it only runs
    // once the provider has detected a token), so a valid session briefly
    // looks signed out on load. Only release once there is no token at all,
    // otherwise every page load deactivates and re-registers the device.
    if (!getAccessToken()) {
      // Stop this browser receiving the previous user's notifications.
      void releaseWebPushRegistration();
    }
  }, [isAuthenticated, isLoading]);

  return null;
}
