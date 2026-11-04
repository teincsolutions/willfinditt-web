import api from './api';

interface NotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  count: number;
}

// Get user's notifications
export const getMyNotifications = async (
  params: NotificationsParams = {}
): Promise<NotificationsResponse> => {
  const response = await api.get('/notifications/my-notifications', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      ...(params.isRead !== undefined && { isRead: params.isRead }),
      ...(params.type && { type: params.type }),
    },
  });
  return response.data;
};

// Get unread notifications count
export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get('/notifications/unread-count');
  return response.data.count ?? response.data ?? 0;
};

// Get notification by ID
export const getNotification = async (id: string): Promise<Notification> => {
  const response = await api.get(`/notifications/${id}`);
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/mark-read`);
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/notifications/mark-all-read');
};

// Register a push token (Firebase web push / mobile FCM) for the current user
export const registerPushToken = async (
  token: string,
  platform: 'ios' | 'android' | 'web' = 'web',
  meta?: Record<string, unknown>
): Promise<{ providerRegistered: boolean }> => {
  const response = await api.post('/notifications/push-token', {
    token,
    platform,
    meta,
  });
  return response.data;
};

// Stop delivering pushes to a token
export const unregisterPushToken = async (token: string): Promise<void> => {
  await api.delete('/notifications/push-token', { data: { token } });
};
