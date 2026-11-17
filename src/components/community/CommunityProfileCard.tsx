'use client';

/* eslint-disable @next/next/no-img-element -- profile photos are private
   community assets served as short-lived signed links. */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useMyKey, useSection } from '@/hooks/useCommunity';
import { noticesApi } from '@/services/community.service';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

export function CommunityProfileCard({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const section = useSection('event_notices');
  const myKey = useMyKey();
  const profile = useQuery({
    queryKey: [...myKey, 'notice-profile'],
    queryFn: noticesApi.myProfile,
    enabled: isAuthenticated && section.state !== 'OFF',
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border-custom bg-white p-5">
        <h2 className="text-lg font-bold">Your community</h2>
        <p className="mt-1 text-sm text-text-gray">
          Sign in to post notices, report lost items and manage your community
          profile.
        </p>
        <Link
          href="/auth/login?redirect=/account/community"
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const name =
    profile.data?.displayName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Your community profile';
  const avatar = profile.data?.photoUrl || user?.avatar || null;
  const canEditProfile = section.state === 'ON';
  const profileHref = canEditProfile
    ? '/post/notice?profile=1'
    : '/account/community';

  return (
    <div className="overflow-hidden rounded-2xl border border-border-custom bg-white">
      <div className="h-16 bg-gradient-to-r from-primary to-primary/60" />
      <div className={`px-5 ${compact ? 'pb-4' : 'pb-5'}`}>
        <div className="-mt-8 mb-3 flex items-end justify-between gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-primary shadow-sm">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-black text-white">
                {initials(name)}
              </span>
            )}
          </div>
          {profile.data ? (
            <span className="rounded-full bg-successLight px-2 py-0.5 text-xs font-bold text-success">
              Community member
            </span>
          ) : null}
        </div>

        <h2 className="truncate text-lg font-bold">{name}</h2>
        <p className="text-sm text-text-gray">
          {profile.data?.city?.name ?? 'Add your city to your profile'}
        </p>
        {profile.data?.about ? (
          <p className="mt-2 line-clamp-2 text-sm text-text-gray">
            {profile.data.about}
          </p>
        ) : null}

        {!profile.data && section.state === 'ON' ? (
          <p className="mt-3 rounded-lg bg-background-primary p-3 text-sm text-text-gray">
            Set up your community profile so your name and photo appear on your
            posts.
          </p>
        ) : null}

        <div className="mt-4 space-y-2">
          <Link
            href="/account/community"
            className="flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            My posts & profile
          </Link>
          <Link
            href={profileHref}
            className="flex items-center justify-center rounded-lg border border-border-custom px-4 py-2.5 text-sm font-semibold text-text hover:bg-background-primary"
          >
            {profile.data ? 'Edit profile' : 'Set up profile'}
          </Link>
        </div>
      </div>
    </div>
  );
}
