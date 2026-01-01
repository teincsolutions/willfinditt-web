'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useChat, useMessages, useSendMessage, useMarkChatAsRead } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { OptimizedImage } from '@/components/OptimizedImage';

export default function ChatPage() {
  const { id } = useParams();
  const chatId = id as string;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: chat, isLoading: chatLoading } = useChat(chatId);
  const { data: messagesResponse, isLoading: messagesLoading } = useMessages(chatId, { sort: 'createdAt:asc', limit: 50 } as any);
  
  const messages = messagesResponse?.data || [];

  // Mutations
  const sendMessage = useSendMessage();
  const markAsRead = useMarkChatAsRead();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/messages/${chatId}`);
    }
  }, [authLoading, isAuthenticated, router, chatId]);

  // Mark as read on mount and when messages change
  useEffect(() => {
    if (chatId && messages.length > 0) {
      markAsRead.mutate(chatId);
    }
  }, [chatId, messages.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendMessage.isPending) return;

    // Identify receiver
    const receiverId = chat?.senderId === user?.id ? chat?.receiverId : chat?.senderId;
    if (!receiverId) return;

    sendMessage.mutate(
      { 
        chatId, 
        data: { 
          content: inputText, 
          receiverId, 
          type: 'TEXT' 
        } 
      },
      {
        onSuccess: () => {
          setInputText('');
        },
      }
    );
  };

  if (authLoading || chatLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-100px)] flex items-center justify-center">Loading conversation...</div>;
  }

  if (!chat) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center">Chat not found</div>;
  }

  const otherUser = chat.senderId === user?.id ? chat.receiver : chat.sender;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="bg-background p-4 rounded-t-xl shadow-sm border border-border-custom border-b-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="md:hidden p-2 -ml-2 text-text-gray hover:bg-background/50 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          
          <div className="w-10 h-10 rounded-full bg-background-primary/30 overflow-hidden">
             {otherUser.avatar ? (
               <OptimizedImage
                 src={otherUser.avatar}
                 alt={otherUser.username}
                 fill
                 containerClassName="w-full h-full"
                 className="object-cover"
               />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-background-primary text-primary font-bold">
                  {(otherUser.firstName || otherUser.username || '?').charAt(0).toUpperCase()}
                </div>
             )}
          </div>
          <div>
            <h2 className="font-semibold text-text">
              {otherUser.firstName ? `${otherUser.firstName} ${otherUser.lastName || ''}` : otherUser.username}
            </h2>
            {chat.adId && (
              <p className="text-xs text-text-gray flex items-center gap-1">
                <span>Ad related</span>
                {/* Could link to ad here */}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           {/* Actions like delete chat could go here */}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-background p-4 overflow-y-auto border-l border-r border-border-custom">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-light-gray">
            <p>No messages yet.</p>
            <p className="text-sm">Say hello to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
             {messages.map((msg, index) => {
               const isMe = msg.senderId === user?.id;
               const showDate = index === 0 || 
                 new Date(msg.createdAt).toDateString() !== new Date(messages[index-1].createdAt).toDateString();

               return (
                 <div key={msg.id}>
                   {showDate && (
                     <div className="flex justify-center my-4">
                       <span className="text-xs bg-background-primary/30 text-text-gray px-2 py-1 rounded-full">
                         {format(new Date(msg.createdAt), 'MMM d, yyyy')}
                       </span>
                     </div>
                   )}
                   
                   <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                       isMe 
                         ? 'bg-primary text-white rounded-tr-none' 
                         : 'bg-background text-text border border-border-custom rounded-tl-none'
                     }`}>
                       <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                       <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-text-gray'}`}>
                         {format(new Date(msg.createdAt), 'h:mm a')}
                         {isMe && (
                           <span className="ml-1 inline-block">
                             {msg.isRead ? '✓✓' : '✓'}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
             <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-background p-4 rounded-b-xl shadow-sm border border-border-custom border-t-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <button type="button" className="p-2 text-text-light-gray hover:text-text-gray rounded-lg hover:bg-background/50 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-border-custom rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-background"
          />
          
          <button
            type="submit"
            disabled={!inputText.trim() || sendMessage.isPending}
            className="bg-primary text-white p-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMessage.isPending ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
