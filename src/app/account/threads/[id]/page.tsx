'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { useThread, useThreadMessages, useAddThreadMessage } from '@/hooks/useThreads';
import { ThreadMessage, ThreadStatus } from '@/types/threads';
import { Button } from '@/components/Button';

function ThreadDetailContent() {
  // State Management
  const params = useParams();
  const threadId = params.id as string;
  const [messageContent, setMessageContent] = useState('');

  // API Hooks
  const { data: thread, isLoading: isThreadLoading } = useThread(threadId);
  const { data: messagesResponse = [], isLoading: isMessagesLoading, refetch: refetchMessages } = useThreadMessages(threadId);
  const addMessageMutation = useAddThreadMessage(threadId);

  // Extract messages array
  const messages = Array.isArray(messagesResponse) ? messagesResponse : messagesResponse?.data || [];

  // Loading State
  if (isThreadLoading) {
    return <div className="p-8 text-center text-text-gray">Loading thread...</div>;
  }

  // Not Found State
  if (!thread) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-gray mb-4">Thread not found</p>
        <Link href="/account/threads">
          <Button variant="outline">Back to Threads</Button>
        </Link>
      </div>
    );
  }

  // Handlers
  const handleAddMessage = () => {
    if (!messageContent.trim()) {
      alert('Please enter a message');
      return;
    }

    addMessageMutation.mutate(
      { content: messageContent },
      {
        onSuccess: () => {
          setMessageContent('');
          refetchMessages();
        },
      }
    );
  };

  // Helper Functions
  const getStatusColor = (status: ThreadStatus): string => {
    const colorMap: Record<ThreadStatus, string> = {
      'OPEN': 'bg-success/20 text-success',
      'CLOSED': 'bg-error/20 text-error',
      'PENDING': 'bg-warning/20 text-warning',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-600';
  };

  // Component Render
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <Link href="/account/threads">
          <button className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Threads</span>
          </button>
        </Link>
      </div>

      {/* Thread Header */}
      <ThreadHeader
        thread={thread}
        getStatusColor={getStatusColor}
      />

      {/* Messages Section */}
      <MessagesList
        messages={messages}
        isLoading={isMessagesLoading}
      />

      {/* Message Input */}
      {thread.status !== 'CLOSED' ? (
        <MessageInput
          value={messageContent}
          onChange={setMessageContent}
          onSend={handleAddMessage}
          isLoading={addMessageMutation.isPending}
        />
      ) : (
        <ClosedThreadNotice />
      )}
    </div>
  );
}

// Subcomponents for better organization
interface ThreadHeaderProps {
  thread: any;
  getStatusColor: (status: ThreadStatus) => string;
}

function ThreadHeader({
  thread,
  getStatusColor,
}: ThreadHeaderProps) {
  return (
    <div className="bg-background rounded-lg border border-border-custom p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text mb-3">{thread.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(thread.status)}`}>
              {thread.status}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-text-gray">
        Created {format(new Date(thread.createdAt), 'MMM dd, yyyy h:mm a')}
      </p>
    </div>
  );
}

interface MessagesListProps {
  messages: ThreadMessage[];
  isLoading: boolean;
}

function MessagesList({ messages, isLoading }: MessagesListProps) {
  return (
    <div className="bg-background rounded-lg border border-border-custom p-6">
      <h2 className="text-lg font-bold text-text mb-4">Messages</h2>

      {isLoading ? (
        <div className="text-center py-8 text-text-gray">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-text-gray">No messages yet. Start the conversation!</div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
}

interface MessageItemProps {
  message: ThreadMessage;
}

function MessageItem({ message }: MessageItemProps) {
  return (
    <div
      className={`p-4 rounded-lg ${
        message.isSystem
          ? 'bg-gray-100 text-text-gray text-sm italic border-l-4 border-gray-300'
          : 'bg-background-primary/50 border border-border-custom'
      }`}
    >
      {!message.isSystem && (
        <p className="text-sm font-medium text-text mb-2">{message.user?.username || 'Unknown User'}</p>
      )}
      <p className="text-text whitespace-pre-wrap break-words">{message.content}</p>
      <p className="text-xs text-text-gray mt-2">
        {format(new Date(message.createdAt), 'MMM dd, yyyy h:mm a')}
      </p>
    </div>
  );
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

function MessageInput({ value, onChange, onSend, isLoading }: MessageInputProps) {
  return (
    <div className="bg-background rounded-lg border border-border-custom p-6">
      <label className="block text-sm font-medium text-text mb-2">Add a Message</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message here..."
        className="w-full px-4 py-3 border border-border-custom rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        rows={4}
      />
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="outline" onClick={() => onChange('')}>
          Clear
        </Button>
        <Button
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className="bg-primary hover:opacity-90"
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </div>
  );
}

function ClosedThreadNotice() {
  return (
    <div className="bg-error/10 border border-error/30 rounded-lg p-4 text-error">
      <p className="text-sm font-medium">This thread is closed</p>
      <p className="text-xs mt-1">You cannot add new messages to a closed thread.</p>
    </div>
  );
}

export default function ThreadDetailPage() {
  return <ThreadDetailContent />;
}
