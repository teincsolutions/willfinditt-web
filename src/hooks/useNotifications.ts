import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyNotifications,
  getUnreadCount,
  getNotification,
  markNotificationAsRead,
  markAllAsRead,
} from '@/services/notifications.service';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

// Get user's notifications
export const useNotifications = (params: NotificationsParams = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getMyNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get unread notifications count (for header badge)
export const useUnreadCount = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    enabled: !!isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Get single notification
export const useNotification = (id: string) => {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => getNotification(id),
    enabled: !!id,
  });
};

// Mark notification as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
