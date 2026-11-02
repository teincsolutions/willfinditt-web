'use client';

import { useEffect, useState } from 'react';
import { useNotificationConnection } from '@/hooks/useNotificationsSocket';
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  isBrowserNotificationsEnabled,
  setBrowserNotificationsEnabled,
  requestBrowserNotificationPermission,
} from '@/lib/browser-notifications';

/**
 * Opt-in control for OS-level notifications, plus the live-connection state.
 *
 * Off by default: we never request permission on page load, only when the user
 * flips the switch. The socket itself is connected either way — turning this
 * on only mirrors already-delivered notifications to the operating system.
 */
export function BrowserAlertsToggle() {
  const connected = useNotificationConnection();

  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isSupported = isBrowserNotificationSupported();
    const currentPermission = getBrowserNotificationPermission();
    setSupported(isSupported);
    setPermission(currentPermission);
    setEnabled(
      isSupported &&
        currentPermission === 'granted' &&
        isBrowserNotificationsEnabled()
    );
  }, []);

  const handleToggle = async () => {
    if (!supported || busy) return;
    setBusy(true);

    try {
      if (enabled) {
        setBrowserNotificationsEnabled(false);
        setEnabled(false);
        return;
      }

      const result = await requestBrowserNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        setBrowserNotificationsEnabled(true);
        setEnabled(true);
      } else {
        // Denied or dismissed: leave the opt-in off.
        setBrowserNotificationsEnabled(false);
        setEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

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
            Get a desktop notification when something happens on your account.
            Updates in this tab are always live.
          </p>
          {!supported && (
            <p className="mt-2 text-xs text-text-light-gray">
              This browser does not support notifications.
            </p>
          )}
          {supported && permission === 'denied' && (
            <p className="mt-2 text-xs text-error">
              Notifications are blocked for this site. Allow them in your
              browser settings, then reload.
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Enable browser alerts"
          disabled={!supported || busy || permission === 'denied'}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-background-primary border border-border-custom'
          } ${!supported || permission === 'denied' ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
