import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getSections,
  lostFoundApi,
  noticesApi,
} from '@/services/community.service';
import type {
  EventType,
  LostFoundKind,
  SectionKey,
  SectionState,
} from '@/types/community';

/** Which community sections are available. Entry points read this. */
export const useSections = () =>
  useQuery({
    queryKey: ['community', 'sections'],
    queryFn: getSections,
    staleTime: 60_000,
    retry: 1,
  });

/** State of one section; OFF if the server does not know it yet. */
export const useSection = (key: SectionKey) => {
  const query = useSections();
  const flag = query.data?.find((f) => f.key === key);
  return {
    isLoading: query.isLoading,
    state: (flag?.state ?? 'OFF') as SectionState,
    bannerMessage: flag?.bannerMessage ?? null,
  };
};

export const useNotices = (filters: {
  eventType?: EventType;
  city?: string;
  profile?: string;
}) =>
  useInfiniteQuery({
    queryKey: ['community', 'notices', filters],
    queryFn: ({ pageParam }) =>
      noticesApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useNotice = (id: string, signedIn: boolean) =>
  useQuery({
    // signedIn is part of the key: unlisted notices need a signed-in user.
    queryKey: ['community', 'notice', id, signedIn],
    queryFn: () => noticesApi.get(id),
    retry: false,
  });

export const useNoticeFormConfig = () =>
  useQuery({
    queryKey: ['community', 'notices', 'form-config'],
    queryFn: noticesApi.formConfig,
    staleTime: 5 * 60_000,
  });

export const useLostFound = (filters: {
  kind?: LostFoundKind;
  city?: string;
}) =>
  useInfiniteQuery({
    queryKey: ['community', 'lost-found', filters],
    queryFn: ({ pageParam }) =>
      lostFoundApi.list({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

export const useLostFoundPost = (id: string) =>
  useQuery({
    queryKey: ['community', 'lost-found-post', id],
    queryFn: () => lostFoundApi.get(id),
    retry: false,
  });
