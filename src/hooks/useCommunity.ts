import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getSections,
  lostFoundApi,
  noticesApi,
} from '@/services/community.service';
import type {
  CursorPage,
  EventPost,
  EventType,
  LostFoundKind,
  LostFoundPost,
  SectionFlag,
  SectionKey,
  SectionState,
} from '@/types/community';

/**
 * Which community sections are available. Server pages pass the flags they
 * already fetched, so the first render needs no request.
 */
export const useSections = (initial?: SectionFlag[]) =>
  useQuery({
    queryKey: ['community', 'sections'],
    queryFn: getSections,
    initialData: initial,
    staleTime: 60_000,
    retry: 2,
  });

/**
 * State of one section. `isError` means the flags could not be loaded: that
 * is not the same as OFF, so pages show a retry instead of "not found".
 */
export const useSection = (key: SectionKey, initial?: SectionFlag[]) => {
  const query = useSections(initial);
  const flag = query.data?.find((f) => f.key === key);
  return {
    isLoading: query.isLoading,
    isError: query.isError && !query.data,
    retry: () => query.refetch(),
    state: (flag?.state ?? 'OFF') as SectionState,
    bannerMessage: flag?.bannerMessage ?? null,
  };
};

/**
 * Query key prefix for the signed-in user's own community data. Includes
 * the user id, so switching accounts never shows the previous user's posts.
 */
export const useMyKey = () => {
  const { user } = useAuth();
  return ['community', 'me', user?.id ?? 'signed-out'] as const;
};

const firstPage = <T>(page?: CursorPage<T>) =>
  page ? { pages: [page], pageParams: [undefined] } : undefined;

export const useNotices = (
  filters: { eventType?: EventType; city?: string; profile?: string },
  initial?: CursorPage<EventPost>
) =>
  useInfiniteQuery({
    queryKey: ['community', 'notices', filters],
    queryFn: ({ pageParam }) =>
      noticesApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: firstPage(initial),
  });

export const useNotice = (
  id: string,
  signedIn: boolean,
  initial?: EventPost | null
) =>
  useQuery({
    // signedIn is part of the key: unlisted notices need a signed-in user.
    queryKey: ['community', 'notice', id, signedIn],
    queryFn: () => noticesApi.get(id),
    initialData: initial ?? undefined,
    retry: false,
  });

export const useNoticeFormConfig = () =>
  useQuery({
    queryKey: ['community', 'notices', 'form-config'],
    queryFn: noticesApi.formConfig,
    staleTime: 5 * 60_000,
  });

export const useLostFoundFormConfig = () =>
  useQuery({
    queryKey: ['community', 'lost-found', 'form-config'],
    queryFn: lostFoundApi.formConfig,
    staleTime: 5 * 60_000,
  });

export const useLostFound = (
  filters: { kind?: LostFoundKind; category?: string; city?: string },
  initial?: CursorPage<LostFoundPost>
) =>
  useInfiniteQuery({
    queryKey: ['community', 'lost-found', filters],
    queryFn: ({ pageParam }) =>
      lostFoundApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: firstPage(initial),
  });

export const useLostFoundPost = (id: string, initial?: LostFoundPost | null) =>
  useQuery({
    queryKey: ['community', 'lost-found-post', id],
    queryFn: () => lostFoundApi.get(id),
    initialData: initial ?? undefined,
    retry: false,
  });

/**
 * Where "Sell" goes. The normal ad form unless a community section is open
 * for posting, in which case the chooser. The flags load in the background,
 * so the button never waits for them.
 */
export const useSellHref = () => {
  const { data } = useSections();
  const anyOpen = data?.some(
    (f) => (f.key === 'event_notices' || f.key === 'lost_found') && f.state === 'ON'
  );
  return anyOpen ? '/post' : '/ads/new';
};
