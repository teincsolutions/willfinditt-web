import api from './api';
import {
  Chat,
  Message,
  ChatResponse,
  MessageResponse,
  CreateChatRequest,
  SendMessageRequest,
} from '@/types/message';

// 1. Create a Chat
export const createChat = async (data: CreateChatRequest): Promise<Chat> => {
  const response = await api.post('/chat', data);
  return response.data;
};

// 2. Get User Chats
export const getUserChats = async (
  params: { page?: number; limit?: number; search?: string; adId?: string } = {}
): Promise<ChatResponse> => {
  const response = await api.get('/chat', { params });
  return response.data;
};

// 3. Get Chat Stats
export const getChatStats = async (): Promise<{
  totalChats: number;
  activeChats: number;
  unreadMessages: number;
}> => {
  const response = await api.get('/chat/stats');
  return response.data;
};

// 4. Get Chat by ID
export const getChat = async (chatId: string): Promise<Chat> => {
  const response = await api.get(`/chat/${chatId}`);
  return response.data;
};

// 5. Get Messages
export const getMessages = async (
  chatId: string,
  params: { page?: number; limit?: number; type?: string; search?: string } = {}
): Promise<MessageResponse> => {
  const response = await api.get(`/chat/${chatId}/messages`, { params });
  return response.data;
};

// 6. Send Message (REST)
export const sendMessage = async (
  chatId: string,
  data: SendMessageRequest
): Promise<Message> => {
  const response = await api.post(`/chat/${chatId}/messages`, data);
  return response.data;
};

// 7. Mark as Read
export const markChatAsRead = async (chatId: string): Promise<void> => {
  await api.patch(`/chat/${chatId}/read`);
};

// 8. Delete Chat
export const deleteChat = async (chatId: string): Promise<void> => {
  await api.delete(`/chat/${chatId}`);
};

// 9. Delete Message
export const deleteMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/chat/messages/${messageId}`);
};
