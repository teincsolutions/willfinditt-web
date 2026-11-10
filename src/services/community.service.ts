import api from './api';
import type {
  CursorPage,
  EventFormConfig,
  EventPost,
  EventPostInput,
  EventProfile,
  EventProfileInput,
  EventType,
  LostFoundInput,
  LostFoundKind,
  LostFoundPost,
  SectionFlag,
} from '@/types/community';

export const getSections = async (): Promise<SectionFlag[]> => {
  const res = await api.get<{ data: SectionFlag[] }>('/feature-flags');
  return res.data.data;
};

// --- Events & Notices -------------------------------------------------------

export const noticesApi = {
  formConfig: async (): Promise<EventFormConfig> =>
    (await api.get('/event-notices/form-config')).data.data,

  list: async (params: {
    eventType?: EventType;
    city?: string;
    profile?: string;
    cursor?: string;
  }): Promise<CursorPage<EventPost>> =>
    (await api.get('/event-notices/posts', { params })).data,

  get: async (id: string): Promise<EventPost> =>
    (await api.get(`/event-notices/posts/${id}`)).data.data,

  profile: async (id: string): Promise<EventProfile> =>
    (await api.get(`/event-notices/profiles/${id}`)).data.data,

  myProfile: async (): Promise<EventProfile | null> =>
    (await api.get('/event-notices/profile/me')).data.data,

  saveProfile: async (input: EventProfileInput): Promise<EventProfile> =>
    (await api.post('/event-notices/profile/me', input)).data.data,

  mine: async (cursor?: string): Promise<CursorPage<EventPost>> =>
    (await api.get('/event-notices/posts/mine', { params: { cursor } })).data,

  create: async (input: EventPostInput): Promise<EventPost> =>
    (await api.post('/event-notices/posts', input)).data.data,

  update: async (
    id: string,
    input: Partial<EventPostInput>
  ): Promise<EventPost> =>
    (await api.patch(`/event-notices/posts/${id}`, input)).data.data,

  chat: async (id: string): Promise<{ chatId: string }> =>
    (await api.post(`/event-notices/posts/${id}/chat`)).data.data,
};

// --- Lost & Found -----------------------------------------------------------

export const lostFoundApi = {
  list: async (params: {
    kind?: LostFoundKind;
    city?: string;
    cursor?: string;
  }): Promise<CursorPage<LostFoundPost>> =>
    (await api.get('/lost-found/posts', { params })).data,

  get: async (id: string): Promise<LostFoundPost> =>
    (await api.get(`/lost-found/posts/${id}`)).data.data,

  mine: async (cursor?: string): Promise<CursorPage<LostFoundPost>> =>
    (await api.get('/lost-found/posts/mine', { params: { cursor } })).data,

  create: async (input: LostFoundInput): Promise<LostFoundPost> =>
    (await api.post('/lost-found/posts', input)).data.data,

  update: async (
    id: string,
    input: Partial<LostFoundInput>
  ): Promise<LostFoundPost> =>
    (await api.patch(`/lost-found/posts/${id}`, input)).data.data,

  resolve: async (id: string): Promise<LostFoundPost> =>
    (await api.post(`/lost-found/posts/${id}/resolve`)).data.data,

  revealPhone: async (id: string): Promise<string> =>
    (await api.post(`/lost-found/posts/${id}/phone`)).data.data.phone,

  chat: async (id: string): Promise<{ chatId: string }> =>
    (await api.post(`/lost-found/posts/${id}/chat`)).data.data,
};

/** Readable message from an API error. */
export function apiError(error: unknown, fallback: string): string {
  const e = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  return m || fallback;
}

/** HTTP status of an API error, if any. */
export function apiStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}
