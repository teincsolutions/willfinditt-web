export type ThreadType = 'SUPPORT' | 'NOTIFICATION' | 'SYSTEM';
export type ThreadStatus = 'OPEN' | 'CLOSED' | 'PENDING';
export type ThreadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ThreadUser {
  id: string;
  username: string;
  email?: string;
}

export interface Thread {
  id: string;
  userId: string;
  title: string;
  type: ThreadType;
  status: ThreadStatus;
  priority: ThreadPriority;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
  user?: ThreadUser;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  userId: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  user?: ThreadUser;
}


export interface CreateThreadRequest {
  title: string;
  type: ThreadType;
  priority?: ThreadPriority;
}

export interface UpdateThreadRequest {
  title?: string;
  status?: ThreadStatus;
  priority?: ThreadPriority;
  type?: ThreadType;
}

export interface CreateThreadMessageRequest {
  content: string;
  isSystem?: boolean;
}

export type ThreadsResponse = Thread[];

export interface ThreadMessagesResponse {
  data: ThreadMessage[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
