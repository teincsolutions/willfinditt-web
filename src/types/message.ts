import { User } from './user';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  participants: User[];
  lastMessage: Message;
  updatedAt: string;
}
