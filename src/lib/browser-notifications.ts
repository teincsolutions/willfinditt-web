/**
 * Browser (desktop/OS) notifications for the website.
 *
 * These are driven by the in-app websocket channel: the API pushes
 * `notification.received`, and we mirror it to the OS only when the user has
 * explicitly opted in. Nothing is requested on page load — browsers block
 * non-gesture permission prompts, and asking unprompted is a dark pattern.
 */

export const BROWSER_NOTIFICATIONS_KEY = 'willfinditt_browser_notifications';

const ICON = '/images/logo-favicon.png';

export const isBrowserNotificationSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window;

export const getBrowserNotificationPermission = (): NotificationPermission =>
  isBrowserNotificationSupported() ? Notification.permission : 'denied';

/** Has the user switched browser alerts on in the UI? */
export const isBrowserNotificationsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(BROWSER_NOTIFICATIONS_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setBrowserNotificationsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem(BROWSER_NOTIFICATIONS_KEY, 'true');
    } else {
      window.localStorage.removeItem(BROWSER_NOTIFICATIONS_KEY);
    }
  } catch {
    // Private mode / storage disabled: the in-app toast still works.
  }
};

/**
 * Ask the browser for permission. Must be called from a user gesture (button
 * click), otherwise Chrome and Safari ignore or auto-deny the prompt.
 */
export const requestBrowserNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!isBrowserNotificationSupported()) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  };

/**
 * Show an OS notification.
 *
 * Prefers the service worker registration: `new Notification()` throws on
 * Android Chrome, and a service-worker notification survives the tab losing
 * focus. Falls back to the constructor on desktop without a registration.
 */
export async function showBrowserNotification(
  title: string,
  options: NotificationOptions & { url?: string } = {}
): Promise<void> {
  if (!isBrowserNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const { url, ...rest } = options;
  const payload: NotificationOptions = {
    icon: ICON,
    badge: ICON,
    data: { url: url ?? '/notifications' },
    ...rest,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, payload);
        return;
      }
    }

    const notification = new Notification(title, payload);
    notification.onclick = () => {
      window.focus();
      if (url) window.location.assign(url);
      notification.close();
    };
  } catch {
    // Unsupported (e.g. Android without a service worker) — the toast covers it.
  }
}
