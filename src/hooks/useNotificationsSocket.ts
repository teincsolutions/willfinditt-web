'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/lib/auth';
import {
  notificationsSocket,
  subscribeConnection,
  getConnectionSnapshot,
  type InAppNotification,
} from '@/lib/notifications-socket';
import {
  isBrowserNotificationsEnabled,
  showBrowserNotification,
} from '@/lib/browser-notifications';

const MAX_TRACKED_IDS = 100;

/**
 * Where a notification should take the user. Falls back to the notifications
 * page so the toast action always does something useful.
 */
export function notificationLink(notification: InAppNotification): string {
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const adId = typeof data.adId === 'string' ? data.adId : undefined;
  const type = notification.type ?? '';
  const topic = typeof data.topic === 'string' ? data.topic : '';

  if (type === 'CHAT_MESSAGE' || topic === 'chat.message' || topic.startsWith('chat.')) {
    return '/messages';
  }

  if (
    type.startsWith('THREAD_') ||
    topic.startsWith('threads.') ||
    type.startsWith('threads.')
  ) {
    return '/account/threads';
  }

  if (adId && (type === 'AD_INTERACTION' || type === 'AD_COMMENT')) {
    return `/ads/${adId}`;
  }

  if (type === 'AD_APPROVED' || type === 'AD_REJECTED' || type === 'AD_EXPIRED') {
    return adId ? `/ads/${adId}` : '/account/my-ads';
  }

  if (type === 'SELLER_REVIEW') {
    return '/account';
  }

  return '/notifications';
}

/**
 * Connects the site to the API's `/notifications` websocket namespace.
 *
 * Mounted once (see `NotificationsBridge`). Incoming notifications invalidate
 * the React Query caches that drive the header badge and the notifications
 * page, show an in-app toast, and — only when the user opted in — mirror to an
 * OS notification.
 */
export function useNotificationsSocket(): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      notificationsSocket.disconnect();
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    notificationsSocket.connect(token);

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });
    };

    const remember = (id?: string): boolean => {
      if (!id) return false;
      if (seen.current.has(id)) return true;
      seen.current.add(id);
      if (seen.current.size > MAX_TRACKED_IDS) {
        const oldest = seen.current.values().next().value;
        if (oldest) seen.current.delete(oldest);
      }
      return false;
    };

    const handleReceived = (notification: InAppNotification) => {
      // The gateway can deliver the same row twice (personal room + topic
      // room). Collapse duplicates.
      if (remember(notification.id)) return;

      invalidate();

      const link = notificationLink(notification);
      toast.info(notification.title, {
        description: notification.message,
        action: {
          label: 'View',
          onClick: () => router.push(link),
        },
      });

      if (isBrowserNotificationsEnabled()) {
        void showBrowserNotification(notification.title, {
          body: notification.message,
          tag: notification.id,
          url: link,
        });
      }
    };

    // Sent right after connecting with the unread backlog. Refresh the lists,
    // but do not toast a burst of old notifications.
    const handleRecent = (payload: {
      count: number;
      notifications: InAppNotification[];
    }) => {
      payload.notifications?.forEach((notification) => remember(notification.id));
      invalidate();
    };

    // Reconnect with the current access token when the tab wakes up. The
    // socket holds the token it connected with, and the REST client may have
    // rotated it while the tab was in the background.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const currentToken = getAccessToken();
      if (!currentToken) return;
      notificationsSocket.connect(currentToken);
      if (!notificationsSocket.isConnected()) invalidate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    notificationsSocket.on('notification.received', handleReceived);
    notificationsSocket.on('notifications.recent', handleRecent);
    notificationsSocket.on('notification.read', invalidate);
    notificationsSocket.on('notifications.all_read', invalidate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      notificationsSocket.off('notification.received', handleReceived);
      notificationsSocket.off('notifications.recent', handleRecent);
      notificationsSocket.off('notification.read', invalidate);
      notificationsSocket.off('notifications.all_read', invalidate);
    };
  }, [isAuthenticated, queryClient, router]);
}

/** Live connection state, shared across components. */
export function useNotificationConnection(): boolean {
  return useSyncExternalStore(
    subscribeConnection,
    getConnectionSnapshot,
    () => false
  );
}
