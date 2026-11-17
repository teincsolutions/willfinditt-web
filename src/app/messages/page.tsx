'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useChats } from '@/hooks/useChat';
import {
  useDatingConversations,
  useMyDatingProfile,
  useSection,
} from '@/hooks/useCommunity';
import { useAuth } from '@/contexts/AuthContext';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function MessagesPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { data: chatsResponse, isLoading: chatsLoading } = useChats();
  const chats = chatsResponse?.data || [];
  const datingSection = useSection('dating');
  const datingOpen =
    datingSection.state === 'ON' || datingSection.state === 'READ_ONLY';
  const datingProfileQuery = useMyDatingProfile(isAuthenticated && datingOpen);
  const datingProfile = datingProfileQuery.data ?? null;
  const datingChatsOpen =
    datingOpen &&
    (datingProfile?.status === 'ACTIVE' || datingProfile?.status === 'HIDDEN');
  const { data: datingConversations = [], isLoading: datingLoading } =
    useDatingConversations(isAuthenticated && datingChatsOpen);

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

      {datingConversations.length > 0 ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-border-custom bg-background shadow-sm">
          <div className="border-b border-border-custom px-4 py-3">
            <h2 className="text-sm font-bold text-text">Dating</h2>
            <p className="mt-0.5 text-xs text-text-gray">
              Conversations with people you met in Dating.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {datingConversations.map((conversation) => {
              const peer = conversation.peerProfile;
              return (
                <Link
                  key={conversation.id}
                  href={`/messages/dating/${conversation.id}`}
                  className="block p-4 transition-colors hover:bg-background-primary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-custom bg-primaryLight">
                      {peer?.photoUrl ? (
                        <img
                          src={peer.photoUrl}
                          alt={peer.nickname}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg font-bold text-primary">
                          {(peer?.nickname ?? 'D').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <h3 className="truncate pr-2 font-semibold text-text">
                          {peer?.nickname ?? 'Dating member'}
                        </h3>
                        <span className="shrink-0 text-xs text-text-gray">
                          {formatDistanceToNow(new Date(conversation.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          className={`truncate pr-4 text-sm ${
                            conversation.unreadCount > 0
                              ? 'font-semibold text-text'
                              : 'text-text-gray'
                          }`}
                        >
                          {conversation.unreadCount > 0
                            ? `${conversation.unreadCount} new message${
                                conversation.unreadCount > 1 ? 's' : ''
                              }`
                            : 'Dating conversation'}
                        </p>
                        {conversation.unreadCount > 0 ? (
                          <span className="min-w-[20px] shrink-0 rounded-full bg-error px-2 py-0.5 text-center text-xs font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : datingLoading && datingChatsOpen ? (
        <p className="mb-4 text-sm text-text-gray">Loading dating conversations…</p>
      ) : null}

      <div className="bg-background rounded-xl shadow-sm border border-border-custom overflow-hidden">
        {chats.length === 0 ? (
          datingConversations.length > 0 ? (
            <p className="p-6 text-center text-sm text-text-gray">
              No marketplace messages yet.
            </p>
          ) : (
            <div className="p-12 text-center text-text-gray flex flex-col items-center">
              <div className="w-16 h-16 bg-background/50 rounded-full flex items-center justify-center mb-4 text-3xl">
                💬
              </div>
              <h3 className="text-lg font-medium text-text mb-1">No messages yet</h3>
              <p className="max-w-sm mx-auto mb-6">
                Start a conversation from Dating or contact a seller on an ad
                page.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/dating"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Go to Dating
                </Link>
                <Link
                  href="/"
                  className="px-6 py-2 border border-border-custom rounded-lg hover:bg-background-primary transition-colors"
                >
                  Browse Ads
                </Link>
              </div>
            </div>
          )
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
