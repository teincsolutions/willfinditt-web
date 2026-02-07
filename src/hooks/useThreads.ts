import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as threadsService from '@/services/threads.service';
import {
  CreateThreadRequest,
  UpdateThreadRequest,
  CreateThreadMessageRequest,
} from '@/types/threads';

export const useThreads = (
  params: { page?: number; limit?: number; status?: string; type?: string; priority?: string } = {}
) => {
  return useQuery({
    queryKey: ['threads', params.page, params.limit, params.status, params.type, params.priority],
    queryFn: () => threadsService.getUserThreads(params),
    refetchInterval: 30000, // Poll every 30s for new threads
  });
};

export const useThread = (threadId: string) => {
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadsService.getThread(threadId),
    enabled: !!threadId,
  });
};

export const useThreadMessages = (
  threadId: string,
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery({
    queryKey: ['threadMessages', threadId, params],
    queryFn: () => threadsService.getThreadMessages(threadId, params),
    enabled: !!threadId,
    refetchInterval: 5000, // Poll messages for active thread
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateThreadRequest) => threadsService.createThread(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};

export const useUpdateThreadMutation = (threadId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateThreadRequest) => threadsService.updateThread(threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
    },
  });
};

export const useAddThreadMessage = (threadId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateThreadMessageRequest) =>
      threadsService.addThreadMessage(threadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadMessages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadId] });
    },
  });
};

export const useUpdateThreadMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string;
      data: { content?: string; isSystem?: boolean };
    }) => threadsService.updateThreadMessage(messageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadMessages'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
};

export const useDeleteThread = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (threadId: string) => threadsService.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threads'] });
    },
  });
};

export const useDeleteThreadMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => threadsService.deleteThreadMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadMessages'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
};