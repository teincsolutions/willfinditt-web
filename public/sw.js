// Minimal service worker for Willfinditt browser notifications.
//
// It does NOT cache anything and has no fetch handler, so it cannot serve
// stale pages. Its only job is to render notifications with
// `registration.showNotification()` (required on Android Chrome) and to open
// the right page when one is clicked.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Web push (FCM). Shown by the service worker so it also works when the tab is
// closed and on Android Chrome, where `new Notification()` is not available.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || payload.title || 'Willfinditt';
  const body = notification.body || payload.body || '';
  const link =
    (payload.fcmOptions && payload.fcmOptions.link) ||
    data.url ||
    '/notifications';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/images/logo-favicon.png',
      badge: '/images/logo-favicon.png',
      tag: data.notificationId || data.tag || undefined,
      data: { url: link },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) {
              return client.navigate(targetUrl).then(() => client.focus());
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      })
  );
});
