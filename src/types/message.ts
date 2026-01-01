export interface ChatUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface Chat {
  id: string;
  senderId: string;
  receiverId: string;
  adId?: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
  receiver: ChatUser;
  unreadCount: number;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'LOCATION' | 'SYSTEM';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: MessageType;
  attachments: string[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: ChatUser;
}

export interface CreateChatRequest {
  receiverId: string;
  adId?: string;
}

export interface SendMessageRequest {
  receiverId: string;
  content: string;
  type?: MessageType;
  attachments?: string[];
}

export interface ChatResponse {
  data: Chat[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessageResponse {
  data: Message[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
