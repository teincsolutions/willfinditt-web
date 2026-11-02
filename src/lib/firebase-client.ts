import {
  initializeApp,
  getApp,
  getApps,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

/**
 * Firebase web app config.
 *
 * These values are public by design (they ship to every browser); access is
 * controlled by the API-key restrictions configured in the Firebase console.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True when every value Firebase Messaging needs is present. */
export const isFirebaseConfigured = (): boolean =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );

/** Initialise (or reuse) the Firebase app. Browser only. */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined' || !isFirebaseConfigured()) {
    return null;
  }

  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Firebase Messaging, or null when the browser cannot support it (SSR, no
 * service worker, Safari private mode, etc.).
 */
export async function getMessagingClient(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    if (!(await isSupported())) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}
