import { deleteToken, getToken } from 'firebase/messaging';
import { getMessagingClient, isFirebaseConfigured } from './firebase-client';
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  isBrowserNotificationsEnabled,
  requestBrowserNotificationPermission,
  setBrowserNotificationsEnabled,
} from './browser-notifications';
import {
  registerPushToken,
  unregisterPushToken,
} from '@/services/notifications.service';

export const WEB_PUSH_TOKEN_KEY = 'willfinditt_web_push_token';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export type WebPushFailureReason =
  | 'unsupported'
  | 'not-configured'
  | 'permission-denied'
  | 'no-token'
  | 'error';

export type EnableWebPushResult =
  | { ok: true }
  | { ok: false; reason: WebPushFailureReason; message?: string };

/** Can this build/browser subscribe at all? */
export function isWebPushConfigured(): boolean {
  return isFirebaseConfigured() && Boolean(VAPID_KEY);
}

function storedToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(WEB_PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function rememberToken(token: string): void {
  try {
    window.localStorage.setItem(WEB_PUSH_TOKEN_KEY, token);
  } catch {
    // Storage disabled — the server registration still stands.
  }
}

function forgetToken(): void {
  try {
    window.localStorage.removeItem(WEB_PUSH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function activeRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
  ]).catch(() => null);
}

async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingClient();
  if (!messaging) return null;

  const registration = await activeRegistration();
  if (!registration) return null;

  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

/**
 * Turn on browser push: ask permission, get an FCM token, and register it with
 * the API so One Night Notify can deliver even when the tab is closed.
 */
export async function enableWebPush(): Promise<EnableWebPushResult> {
  if (!isBrowserNotificationSupported()) {
    return { ok: false, reason: 'unsupported' };
  }
  if (!isWebPushConfigured()) {
    return { ok: false, reason: 'not-configured' };
  }

  const permission = await requestBrowserNotificationPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  try {
    const token = await requestFcmToken();
    if (!token) return { ok: false, reason: 'no-token' };

    await registerPushToken(token, 'web', {
      userAgent: navigator.userAgent,
    });

    rememberToken(token);
    setBrowserNotificationsEnabled(true);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/** Turn off browser push: deregister the token and drop the Firebase one. */
export async function disableWebPush(): Promise<void> {
  const token = storedToken();

  if (token) {
    try {
      await unregisterPushToken(token);
    } catch {
      // The local opt-in must still flip off if the API is unreachable.
    }
  }

  try {
    const messaging = await getMessagingClient();
    if (messaging) await deleteToken(messaging);
  } catch {
    // ignore
  }

  forgetToken();
  setBrowserNotificationsEnabled(false);
}

/**
 * Re-register after login. The FCM token usually survives, but it must be
 * bound to whoever is signed in now.
 */
export async function syncWebPushRegistration(): Promise<void> {
  if (!isWebPushConfigured()) return;
  if (!isBrowserNotificationsEnabled()) return;
  if (getBrowserNotificationPermission() !== 'granted') return;

  try {
    const token = await requestFcmToken();
    if (!token) return;

    await registerPushToken(token, 'web', {
      userAgent: navigator.userAgent,
    });
    rememberToken(token);
  } catch {
    // Non-fatal: the in-app socket still delivers.
  }
}

/**
 * Stop this browser receiving pushes for the user who just signed out, without
 * discarding the FCM subscription (so the next user can re-register).
 */
export async function releaseWebPushRegistration(): Promise<void> {
  const token = storedToken();
  if (!token) return;

  try {
    await unregisterPushToken(token);
  } catch {
    // ignore
  }
  forgetToken();
}
