import api from './api';
import { Thread, Message } from '@/types/message';

export const getThreads = async (): Promise<Thread[]> => {
  const response = await api.get('/messages/threads');
  return response.data;
};

export const getThread = async (
  threadId: string
): Promise<{ thread: Thread; messages: Message[] }> => {
  const response = await api.get(`/messages/threads/${threadId}`);
  return response.data;
};

export const sendMessage = async (
  threadId: string,
  content: string
): Promise<Message> => {
  const response = await api.post(`/messages/threads/${threadId}`, { content });
  return response.data;
};
