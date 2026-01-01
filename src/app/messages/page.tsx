'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useChats } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { data: chatsResponse, isLoading: chatsLoading } = useChats();
  const chats = chatsResponse?.data || [];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/messages');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || chatsLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-background-primary/30 rounded w-1/4 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-background-primary/30 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden">
        {chats.length === 0 ? (
          <div className="p-12 text-center text-text-gray flex flex-col items-center">
            <div className="w-16 h-16 bg-background/50 rounded-full flex items-center justify-center mb-4 text-3xl">
              💬
            </div>
            <h3 className="text-lg font-medium text-text mb-1">No messages yet</h3>
            <p className="max-w-xs mx-auto mb-6">Start a conversation by contacting a seller on an ad page.</p>
            <Link 
              href="/"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Ads
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => {
              // Determine which participant is the "other" user
              const isMeSender = chat.senderId === user?.id;
              const otherUser = isMeSender ? chat.receiver : chat.sender;
              
              if (!otherUser) return null; // Should not happen

              return (
                <Link
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                  className="block p-4 hover:bg-background-primary/50 transition-colors relative group"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-background-primary/30 overflow-hidden border border-border-custom">
                         {otherUser.avatar ? (
                           <OptimizedImage
                             src={otherUser.avatar}
                             alt={otherUser.username}
                             fill
                             containerClassName="w-full h-full"
                             className="object-cover"
                           />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center bg-background-primary text-primary font-bold text-lg">
                              {(otherUser.firstName || otherUser.username || '?').charAt(0).toUpperCase()}
                            </div>
                         )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold text-text truncate pr-2">
                          {otherUser.firstName ? `${otherUser.firstName} ${otherUser.lastName || ''}` : otherUser.username}
                        </h3>
                        {chat.lastMessageAt && (
                          <span className="text-xs text-text-gray whitespace-nowrap ml-2 flex-shrink-0">
                            {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate pr-4 ${chat.unreadCount > 0 ? 'font-semibold text-text' : 'text-text-gray'}`}>
                          {chat.lastMessage || 'Start the conversation...'}
                        </p>
                         {chat.unreadCount > 0 && (
                           <span className="flex-shrink-0 bg-error text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                             {chat.unreadCount}
                           </span>
                         )}
                      </div>
                    </div>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                       <span className="text-text-light-gray">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
