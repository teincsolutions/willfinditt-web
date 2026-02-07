import api from './api';
import {
  Thread,
  ThreadDetail,
  ThreadMessage,
  ThreadsResponse,
  ThreadMessagesResponse,
  CreateThreadRequest,
  UpdateThreadRequest,
  CreateThreadMessageRequest,
} from '@/types/threads';

// 1. Get User's Threads
export const getUserThreads = async (
  params: { page?: number; limit?: number; status?: string; type?: string; priority?: string } = {}
): Promise<ThreadsResponse> => {
  const response = await api.get('/threads/my-threads', { params });
  return response.data;
};

// 2. Get Thread by ID
export const getThread = async (threadId: string): Promise<ThreadDetail> => {
  const response = await api.get(`/threads/${threadId}`);
  return response.data;
};

// 3. Get Thread Messages
export const getThreadMessages = async (
  threadId: string,
  params: { page?: number; limit?: number } = {}
): Promise<ThreadMessagesResponse> => {
  const response = await api.get(`/threads/${threadId}/messages`, { params });
  return response.data;
};

// 4. Create Thread
export const createThread = async (data: CreateThreadRequest): Promise<Thread> => {
  const response = await api.post('/threads', data);
  return response.data;
};

// 5. Update Thread
export const updateThread = async (
  threadId: string,
  data: UpdateThreadRequest
): Promise<Thread> => {
  const response = await api.patch(`/threads/${threadId}`, data);
  return response.data;
};

// 6. Add Message to Thread
export const addThreadMessage = async (
  threadId: string,
  data: CreateThreadMessageRequest
): Promise<ThreadMessage> => {
  const response = await api.post(`/threads/${threadId}/messages`, data);
  return response.data;
};

// 7. Update Thread Message
export const updateThreadMessage = async (
  messageId: string,
  data: { content?: string; isSystem?: boolean }
): Promise<ThreadMessage> => {
  const response = await api.patch(`/threads/messages/${messageId}`, data);
  return response.data;
};

// 8. Delete Thread
export const deleteThread = async (threadId: string): Promise<void> => {
  await api.delete(`/threads/${threadId}`);
};

// 9. Delete Thread Message
export const deleteThreadMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/threads/messages/${messageId}`);
};
