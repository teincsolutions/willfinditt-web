import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatService from '@/services/chat.service';
import { CreateChatRequest, SendMessageRequest } from '@/types/message';
import { useAuth } from '@/contexts/AuthContext';

export const useChats = (params: { page?: number; limit?: number; search?: string; adId?: string } = {}) => {
  return useQuery({
    queryKey: ['chats', params],
    queryFn: () => chatService.getUserChats(params),
    refetchInterval: 10000, // Poll every 10s for new chats/messages if no socket
  });
};

export const useChat = (chatId: string) => {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => chatService.getChat(chatId),
    enabled: !!chatId,
    refetchInterval: 5000, // Poll active chat more frequently
  });
};

export const useMessages = (
  chatId: string,
  params: { page?: number; limit?: number; type?: string; search?: string } = {}
) => {
  return useQuery({
    queryKey: ['messages', chatId, params],
    queryFn: () => chatService.getMessages(chatId, params),
    enabled: !!chatId,
    refetchInterval: 3000, // Poll messages for active chat
  });
};

export const useChatStats = () => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['chat-stats'],
    queryFn: chatService.getChatStats,
    enabled: !!isAuthenticated,
    refetchInterval: 30000,
  });
};

export const useChatUnreadCount = () => {
  const { data } = useChatStats();
  return data?.unreadMessages ?? 0;
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChatRequest) => chatService.createChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, data }: { chatId: string; data: SendMessageRequest }) =>
      chatService.sendMessage(chatId, data),
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] }); // Update last message in list
    },
  });
};

export const useMarkChatAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatService.markChatAsRead(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat-stats'] });
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] }); // optional
    },
  });
};
