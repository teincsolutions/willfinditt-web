import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyNotifications,
  getUnreadCount,
  getNotification,
  markNotificationAsRead,
  markAllAsRead,
} from '@/services/notifications.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

// Get user's notifications (paginated, single page)
export const useNotifications = (params: NotificationsParams = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => getMyNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get user's notifications with infinite scroll.
// Pages are fetched via `meta.page` / `meta.totalPages` from the backend.
export const useInfiniteNotifications = (
  params: Omit<NotificationsParams, 'page'> & { limit?: number } = {}
) => {
  const { limit = 20, ...filters } = params;
  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', { limit, ...filters }],
    queryFn: ({ pageParam = 1 }) =>
      getMyNotifications({ ...filters, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const meta = lastPage.meta;
      if (!meta) return undefined;
      const currentPage = Number(meta.page);
      const totalPages = Number(meta.totalPages);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to mark all as read';
      toast.error(message);
    },
  });
};
