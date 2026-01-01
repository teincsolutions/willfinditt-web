'use client';

import { formatDistanceToNow } from 'date-fns';
import { useNotifications, useMarkAllAsRead, useMarkAsRead } from '@/hooks/useNotifications';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = notificationsData?.data || [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
        router.push('/auth/login?redirect=/notifications');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleMarkAsRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
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
            onClick={handleMarkAllRead}
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
          notifications.map((notification: any) => (
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
    </div>
  );
}
