'use client';

/* eslint-disable @next/next/no-img-element -- upload bucket images */
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SectionGate, LoadMore } from '@/components/community/SectionGate';
import { NoticeCard } from '@/components/community/Cards';
import { useNotices } from '@/hooks/useCommunity';
import { noticesApi } from '@/services/community.service';

function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const profile = useQuery({
    queryKey: ['community', 'notice-profile', id],
    queryFn: () => noticesApi.profile(id),
    retry: false,
  });
  const posts = useNotices({ profile: id });
  const items = posts.data?.pages.flatMap((p) => p.items) ?? [];

  if (profile.isLoading) {
    return <p className="max-w-5xl mx-auto px-4 py-16 text-text-gray">Loading…</p>;
  }
  if (!profile.data) {
    return (
      <p className="max-w-5xl mx-auto px-4 py-16 text-center">
        Profile not found.
      </p>
    );
  }
  const p = profile.data;
  const phones = [p.phone1, p.phone2].filter(Boolean) as string[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        {p.photoUrl ? (
          <img src={p.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primaryLight flex items-center justify-center text-2xl font-bold text-primary">
            {p.displayName.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{p.displayName}</h1>
          {p.city && <p className="text-text-gray">{p.city.name}</p>}
          {phones.length > 0 && (
            <p className="text-sm mt-1">
              {phones.map((ph, i) => (
                <a
                  key={ph}
                  href={`tel:${ph.replace(/[^\d+]/g, '')}`}
                  className="text-primary font-semibold mr-3"
                >
                  {i === 0 ? 'Call ' : 'Or '}
                  {ph}
                </a>
              ))}
            </p>
          )}
        </div>
      </div>
      {p.about && <p className="whitespace-pre-wrap mb-8">{p.about}</p>}

      <h2 className="text-lg font-bold mb-4">Notices</h2>
      {items.length === 0 ? (
        <p className="text-text-gray">No current notices.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((post) => (
            <NoticeCard key={post.id} post={post} />
          ))}
        </div>
      )}
      <LoadMore
        show={Boolean(posts.hasNextPage)}
        loading={posts.isFetchingNextPage}
        onClick={() => posts.fetchNextPage()}
      />
    </div>
  );
}

export default function NoticeProfilePage() {
  return <SectionGate section="event_notices">{() => <ProfileView />}</SectionGate>;
}
