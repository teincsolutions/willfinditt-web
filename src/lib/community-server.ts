import type {
  CursorPage,
  EventPost,
  EventProfile,
  LostFoundPost,
  SectionFlag,
  SectionKey,
} from '@/types/community';

/**
 * Server-side reads for the public community pages, so they render (and
 * get their metadata) on the server. No user token is sent: these are the
 * public views. Not cached, because the flags can change at any time and
 * image links are short-lived.
 */
const API = process.env.NEXT_PUBLIC_API_URL;

async function getJson<T>(path: string): Promise<T | null> {
  if (!API) return null;
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** null means the flags could not be loaded (not the same as OFF). */
export async function fetchSections(): Promise<SectionFlag[] | null> {
  const body = await getJson<{ data: SectionFlag[] }>('/feature-flags');
  return body?.data ?? null;
}

export const sectionState = (
  flags: SectionFlag[] | null,
  key: SectionKey
) => (flags ? (flags.find((f) => f.key === key)?.state ?? 'OFF') : null);

export async function fetchNotices(): Promise<CursorPage<EventPost> | null> {
  return getJson('/event-notices/posts');
}

/** Public notices only: an unlisted one needs a signed-in reader. */
export async function fetchNotice(id: string): Promise<EventPost | null> {
  const body = await getJson<{ data: EventPost }>(
    `/event-notices/posts/${encodeURIComponent(id)}`
  );
  return body?.data ?? null;
}

export async function fetchNoticeProfile(
  id: string
): Promise<EventProfile | null> {
  const body = await getJson<{ data: EventProfile }>(
    `/event-notices/profiles/${encodeURIComponent(id)}`
  );
  return body?.data ?? null;
}

export async function fetchProfileNotices(
  id: string
): Promise<CursorPage<EventPost> | null> {
  return getJson(`/event-notices/posts?profile=${encodeURIComponent(id)}`);
}

export async function fetchLostFound(): Promise<CursorPage<LostFoundPost> | null> {
  return getJson('/lost-found/posts');
}

export async function fetchLostFoundPost(
  id: string
): Promise<LostFoundPost | null> {
  const body = await getJson<{ data: LostFoundPost }>(
    `/lost-found/posts/${encodeURIComponent(id)}`
  );
  return body?.data ?? null;
}

/** Plain-text summary for meta descriptions. */
export const summary = (text: string, max = 160) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};
