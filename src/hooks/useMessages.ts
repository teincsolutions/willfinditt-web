import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getThreads,
  getThread,
  sendMessage,
} from '@/services/messages.service';

export const useMessages = () => {
  return useQuery({
    queryKey: ['messages'],
    queryFn: getThreads,
  });
};

export const useMessageThread = (threadId: string) => {
  return useQuery({
    queryKey: ['messageThread', threadId],
    queryFn: () => getThread(threadId),
    enabled: !!threadId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      threadId,
      content,
    }: {
      threadId: string;
      content: string;
    }) => sendMessage(threadId, content),
    onSuccess: (_, { threadId }) => {
      queryClient.invalidateQueries({ queryKey: ['messageThread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
