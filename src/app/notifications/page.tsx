'use client';

import { formatDistanceToNow } from 'date-fns';
import { useInfiniteNotifications, useMarkAllAsRead, useMarkAsRead } from '@/hooks/useNotifications';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    data,
    isLoading: notificationsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchNotifications,
  } = useInfiniteNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const hasAutoMarkedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const notifications: Notification[] = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  );

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
        router.push('/auth/login?redirect=/notifications');
    }
  }, [authLoading, isAuthenticated, router]);

  // Auto-mark all as read once the first page has loaded with unread items.
  // Deps included so it retries when data arrives (previously `[]` meant it
  // often ran before data loaded and never fired again).
  useEffect(() => {
    const autoMarkAll = async () => {
      const hasUnread = notifications.some(n => !n.isRead);
      if (hasUnread && !hasAutoMarkedRef.current && !markAllAsRead.isPending) {
        hasAutoMarkedRef.current = true;
        try {
          await markAllAsRead.mutateAsync();
          await refetchNotifications();
        } catch (error) {
          console.error('Failed to mark all as read:', error);
          hasAutoMarkedRef.current = false;
        }
      }
    };

    if (!notificationsLoading && notifications.length > 0) {
      autoMarkAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsLoading, notifications]);

  // Infinite scroll: fetch the next page when the sentinel scrolls into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, notifications.length]);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markAsRead.mutateAsync(id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  if (authLoading || notificationsLoading) {
    return <div className="container mx-auto px-4 py-8">Loading notifications...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-text-gray bg-background rounded-xl border border-border-custom">
             <div className="text-4xl mb-3">🔔</div>
             <p>You have no notifications.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${
                notification.isRead
                  ? 'bg-background border-border-custom'
                  : 'bg-background-primary/50 border-primary/20 hover:bg-background-primary'
              }`}
              onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                   <h3 className="font-semibold text-text">{notification.title}</h3>
                   <p className="text-text-gray mt-1">{notification.message}</p>
                   <p className="text-xs text-text-light-gray mt-2">
                     {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                   </p>
                </div>
                {!notification.isRead && (
                   <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 flex-shrink-0 shadow-sm shadow-primary/30"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Infinite-scroll sentinel + fallback controls */}
      {notifications.length > 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
          {isFetchingNextPage && (
            <p className="text-sm text-text-gray">Loading more...</p>
          )}
          {!isFetchingNextPage && hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
            >
              Load more
            </Button>
          )}
          {!hasNextPage && (
            <p className="text-xs text-text-light-gray">You&apos;re all caught up.</p>
          )}
        </div>
      )}
    </div>
  );
}
