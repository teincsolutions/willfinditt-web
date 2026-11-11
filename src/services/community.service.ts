import api from './api';
import type {
  CommunityImage,
  CursorPage,
  EventFormConfig,
  EventPost,
  EventPostInput,
  EventProfile,
  EventProfileInput,
  EventType,
  LostFoundFormConfig,
  LostFoundInput,
  LostFoundKind,
  ListingPeriodInput,
  LostFoundPost,
  SectionFlag,
} from '@/types/community';

export const getSections = async (): Promise<SectionFlag[]> => {
  const res = await api.get<{ data: SectionFlag[] }>('/feature-flags');
  return res.data.data;
};

// --- Private community images -----------------------------------------------

/**
 * Uploads one image to the community media store. The server re-encodes it
 * (removing location and camera data) and keeps it private; posts refer to
 * it by assetId. One file per request, so any number of images works.
 */
export const uploadCommunityImage = async (
  file: File
): Promise<Required<CommunityImage>> => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/community/media', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const { assetId, url } = res.data.data;
  return { assetId, url };
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

  /** Explicit tap to see a family's numbers (signed-in, limited, logged). */
  revealProfilePhones: async (id: string): Promise<string[]> =>
    (await api.post(`/event-notices/profiles/${id}/phones`)).data.data.phones,

  myProfile: async (): Promise<EventProfile | null> =>
    (await api.get('/event-notices/profile/me')).data.data,

  saveProfile: async (input: EventProfileInput): Promise<EventProfile> =>
    (await api.post('/event-notices/profile/me', input)).data.data,

  mine: async (cursor?: string): Promise<CursorPage<EventPost>> =>
    (await api.get('/event-notices/posts/mine', { params: { cursor } })).data,

  /** One of my notices, any status, with asset ids (for editing). */
  getMine: async (id: string): Promise<EventPost> =>
    (await api.get(`/event-notices/posts/mine/${id}`)).data.data,

  renew: async (id: string, input: ListingPeriodInput): Promise<EventPost> =>
    (await api.post(`/event-notices/posts/${id}/renew`, input)).data.data,

  remove: async (id: string): Promise<void> => {
    await api.delete(`/event-notices/posts/${id}`);
  },

  create: async (input: EventPostInput): Promise<EventPost> =>
    (await api.post('/event-notices/posts', input)).data.data,

  update: async (
    id: string,
    input: Partial<Omit<EventPostInput, keyof ListingPeriodInput>>
  ): Promise<EventPost> =>
    (await api.patch(`/event-notices/posts/${id}`, input)).data.data,

  chat: async (id: string): Promise<{ chatId: string }> =>
    (await api.post(`/event-notices/posts/${id}/chat`)).data.data,
};

// --- Lost & Found -----------------------------------------------------------

export const lostFoundApi = {
  formConfig: async (): Promise<LostFoundFormConfig> =>
    (await api.get('/lost-found/form-config')).data.data,

  list: async (params: {
    kind?: LostFoundKind;
    category?: string;
    city?: string;
    cursor?: string;
  }): Promise<CursorPage<LostFoundPost>> =>
    (await api.get('/lost-found/posts', { params })).data,

  get: async (id: string): Promise<LostFoundPost> =>
    (await api.get(`/lost-found/posts/${id}`)).data.data,

  mine: async (cursor?: string): Promise<CursorPage<LostFoundPost>> =>
    (await api.get('/lost-found/posts/mine', { params: { cursor } })).data,

  /** One of my posts, any status, with asset ids (for editing). */
  getMine: async (id: string): Promise<LostFoundPost> =>
    (await api.get(`/lost-found/posts/mine/${id}`)).data.data,

  renew: async (
    id: string,
    input: ListingPeriodInput
  ): Promise<LostFoundPost> =>
    (await api.post(`/lost-found/posts/${id}/renew`, input)).data.data,

  remove: async (id: string): Promise<void> => {
    await api.delete(`/lost-found/posts/${id}`);
  },

  create: async (input: LostFoundInput): Promise<LostFoundPost> =>
    (await api.post('/lost-found/posts', input)).data.data,

  update: async (
    id: string,
    input: Partial<Omit<LostFoundInput, keyof ListingPeriodInput>>
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
