'use client';

import { useEffect, useState } from 'react';
import { useNotificationConnection } from '@/hooks/useNotificationsSocket';
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  isBrowserNotificationsEnabled,
} from '@/lib/browser-notifications';
import {
  disableWebPush,
  enableWebPush,
  isWebPushConfigured,
  type EnableWebPushResult,
} from '@/lib/web-push';

function failureMessage(result: Extract<EnableWebPushResult, { ok: false }>) {
  switch (result.reason) {
    case 'permission-denied':
      return 'Notifications are blocked for this site. Allow them in your browser settings, then try again.';
    case 'no-token':
      return 'Could not create a push subscription. Check that notifications are allowed for this site.';
    case 'unsupported':
      return 'This browser cannot receive background notifications. In-app updates still work.';
    case 'not-configured':
      return 'Browser alerts are not configured for this site yet.';
    default:
      return result.message || 'Could not enable browser alerts. Please try again.';
  }
}

/**
 * Opt-in control for web push, plus the live in-app connection state.
 *
 * Off by default. Turning it on asks for permission (from the click gesture)
 * and registers an FCM token with the API, so alerts arrive even when the tab
 * is closed. Turning it off deregisters the token.
 */
export function BrowserAlertsToggle() {
  const connected = useNotificationConnection();

  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isSupported = isBrowserNotificationSupported();
    const currentPermission = getBrowserNotificationPermission();

    setSupported(isSupported);
    setConfigured(isWebPushConfigured());
    setPermission(currentPermission);
    setEnabled(
      isSupported &&
        currentPermission === 'granted' &&
        isBrowserNotificationsEnabled()
    );
  }, []);

  const handleToggle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      if (enabled) {
        await disableWebPush();
        setEnabled(false);
        return;
      }

      const result = await enableWebPush();
      setPermission(getBrowserNotificationPermission());

      if (result.ok) {
        setEnabled(true);
      } else {
        setEnabled(false);
        if (result.reason !== 'not-configured') {
          setError(failureMessage(result));
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const canToggle = supported && configured && permission !== 'denied';

  return (
    <div className="mb-6 rounded-xl border border-border-custom bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-text">Browser alerts</h2>
            <span
              className="inline-flex items-center gap-1.5 text-xs text-text-gray"
              title={
                connected
                  ? 'Connected to the notifications service'
                  : 'Reconnecting to the notifications service'
              }
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? 'bg-success' : 'bg-text-light-gray'
                }`}
              />
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          <p className="mt-1 text-sm text-text-gray">
            {enabled
              ? 'Alerts are on. You will get a notification even when this tab is closed.'
              : 'Get a notification when something happens, even if this tab is closed. Updates in this tab are always live.'}
          </p>

          {!supported && (
            <p className="mt-2 text-xs text-text-light-gray">
              This browser does not support notifications.
            </p>
          )}

          {supported && !configured && (
            <p className="mt-2 text-xs text-text-light-gray">
              Browser alerts are not configured for this site yet.
            </p>
          )}

          {supported && permission === 'denied' && (
            <p className="mt-2 text-xs text-error">
              Notifications are blocked for this site. Allow them in your
              browser settings, then reload.
            </p>
          )}

          {error && <p className="mt-2 text-xs text-error">{error}</p>}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable browser alerts"
          disabled={!canToggle || busy}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-background-primary border border-border-custom'
          } ${!canToggle || busy ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            } ${busy ? 'animate-pulse' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
