import { useQuery } from '@tanstack/react-query';
import { pageService, PageData } from '@/services/page.service';

export const usePage = (slug: string) => {
  return useQuery<PageData, Error>({
    queryKey: ['page', slug],
    queryFn: async() => await pageService.getPageBySlug(slug),
    staleTime: 1000 * 60 * 60, // 1 hour stale time for static content
    retry: 1,
  });
};
