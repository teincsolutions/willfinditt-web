import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth';

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ConnectionStatus {
  connected: boolean;
  reason?: string;
}

type EventMap = {
  status: ConnectionStatus;
  'notification.received': InAppNotification;
  'notifications.recent': {
    count: number;
    notifications: InAppNotification[];
  };
  'notification.read': { notificationId: string; isRead: boolean };
  'notifications.all_read': { count: number };
  error: { message: string } | Error;
};

type Handler<T> = (payload: T) => void;

/**
 * The API is mounted under `/api/v1`, but the notifications gateway lives on
 * the Socket.IO `/notifications` namespace at the host root.
 */
function getSocketOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return base.replace(/\/api(\/v\d+)?\/?$/, '');
}

/**
 * Singleton Socket.IO client for the `/notifications` namespace.
 *
 * Mirrors the admin dashboard implementation. The API pushes
 * `notification.received` to the `user_<id>` room for every persisted
 * notification, so the site does not need to poll.
 */
class NotificationsSocket {
  private socket: Socket | null = null;
  private token: string | null = null;
  private handlers = new Map<keyof EventMap, Set<Handler<never>>>();

  connect(token?: string): void {
    const accessToken = token ?? getAccessToken();
    if (!accessToken) return;

    // Same token and a live socket: nothing to do.
    if (this.socket && this.token === accessToken) {
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    this.teardown();

    this.token = accessToken;
    this.socket = io(`${getSocketOrigin()}/notifications`, {
      auth: { token: accessToken },
      // WebSocket first, long-polling fallback for proxies that drop the
      // Upgrade header.
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      setConnected(true);
      this.emit('status', { connected: true });
    });

    this.socket.on('disconnect', (reason?: string) => {
      setConnected(false);
      this.emit('status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error: Error) => {
      setConnected(false);
      this.emit('status', { connected: false, reason: error.message });
      this.emit('error', error);
    });

    this.socket.on('notification.received', (payload: InAppNotification) =>
      this.emit('notification.received', payload)
    );

    this.socket.on('notifications.recent', (payload) =>
      this.emit('notifications.recent', payload)
    );

    this.socket.on('notification.read', (payload) =>
      this.emit('notification.read', payload)
    );

    this.socket.on('notifications.all_read', (payload) =>
      this.emit('notifications.all_read', payload)
    );

    // The gateway rejects sockets with a bad/expired token and disconnects.
    // Drop the cached token so the next auth refresh can reconnect.
    this.socket.on('error', (error) => {
      this.emit('error', error);
      const message =
        typeof error === 'string' ? error : error?.message ?? '';
      if (
        message === 'Authentication token required' ||
        message === 'Invalid authentication token' ||
        message === 'Unauthorized'
      ) {
        this.token = null;
        this.socket?.disconnect();
      }
    });
  }

  disconnect(): void {
    this.teardown();
    this.token = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)?.add(handler as Handler<never>);
  }

  off<K extends keyof EventMap>(
    event: K,
    handler: Handler<EventMap[K]>
  ): void {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  private emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload as never));
  }

  private teardown(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    setConnected(false);
  }
}

export const notificationsSocket = new NotificationsSocket();

// ---------------------------------------------------------------------------
// Connection state store
//
// The socket is a singleton, so the UI reads its status through
// `useSyncExternalStore` instead of subscribing to the socket directly. That
// keeps multiple components (header badge, notifications page) in sync without
// opening a second listener or a second socket.
// ---------------------------------------------------------------------------

let connected = false;
const connectionListeners = new Set<() => void>();

function setConnected(next: boolean): void {
  if (connected === next) return;
  connected = next;
  connectionListeners.forEach((listener) => listener());
}

export function subscribeConnection(listener: () => void): () => void {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

export function getConnectionSnapshot(): boolean {
  return connected;
}

