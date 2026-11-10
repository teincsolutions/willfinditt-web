'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ImageUploader';
import { SectionGate } from '@/components/community/SectionGate';
import { CityPicker } from '@/components/community/CityPicker';
import {
  Field,
  fromLocalInput,
  inputClass,
  toLocalInput,
} from '@/components/community/form';
import { useAuth } from '@/contexts/AuthContext';
import { useNoticeFormConfig } from '@/hooks/useCommunity';
import { apiError, noticesApi } from '@/services/community.service';
import type {
  EventPost,
  EventProfile,
  EventType,
  ImageRole,
  Visibility,
} from '@/types/community';

// --- Step 1: the family / organiser profile (once per account) --------------

function ProfileForm({
  profile,
  onSaved,
}: {
  profile: EventProfile | null;
  onSaved: (p: EventProfile) => void;
}) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [phone1, setPhone1] = useState(profile?.phone1 ?? '');
  const [phone2, setPhone2] = useState(profile?.phone2 ?? '');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [cityId, setCityId] = useState(profile?.city?.id ?? '');
  const [photo, setPhoto] = useState<string[]>(
    profile?.photoUrl ? [profile.photoUrl] : []
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const saved = await noticesApi.saveProfile({
        displayName: displayName.trim(),
        phone1: phone1.trim() || undefined,
        phone2: phone2.trim() || undefined,
        about: about.trim() || undefined,
        cityId: cityId || undefined,
        photoUrl: photo[0],
      });
      toast.success('Profile saved');
      onSaved(saved);
    } catch (error) {
      toast.error(apiError(error, 'Could not save the profile'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">
          {profile ? 'Edit your notices profile' : 'First, who is posting?'}
        </h1>
        <p className="text-text-gray">
          This name appears on your notices, for example &quot;The Mensah
          Family&quot;. Your account details stay private.
        </p>
      </div>
      <Field label="Family or organiser name">
        <input
          className={inputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={80}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Contact phone (optional)" hint="Shown on your notices">
          <input
            className={inputClass}
            value={phone1}
            onChange={(e) => setPhone1(e.target.value)}
            inputMode="tel"
          />
        </Field>
        <Field label="Second phone (optional)">
          <input
            className={inputClass}
            value={phone2}
            onChange={(e) => setPhone2(e.target.value)}
            inputMode="tel"
          />
        </Field>
      </div>
      <CityPicker
        value={cityId}
        initialName={profile?.city?.name}
        onChange={setCityId}
      />
      <Field label="About (optional)">
        <textarea
          className={inputClass}
          rows={3}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={1000}
        />
      </Field>
      <div>
        <span className="block text-sm font-semibold mb-1">Photo (optional)</span>
        <ImageUploader images={photo} onImagesChange={setPhoto} maxImages={1} />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="px-6 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}

// --- Step 2: the notice -----------------------------------------------------

function NoticeForm({ existing }: { existing: EventPost | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: config } = useNoticeFormConfig();
  const pick = (role: ImageRole) =>
    existing?.images.filter((i) => i.role === role).map((i) => i.url) ?? [];

  const [eventType, setEventType] = useState<EventType>(
    existing?.eventType ?? config?.eventTypes[0]?.value ?? 'FUNERAL'
  );
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [eventAt, setEventAt] = useState(toLocalInput(existing?.eventAt));
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [cityId, setCityId] = useState(existing?.city?.id ?? '');
  const [visibility, setVisibility] = useState<Visibility>(
    existing?.visibility ?? config?.visibility.default ?? 'PUBLIC'
  );
  const [deceased, setDeceased] = useState<string[]>(pick('DECEASED_PHOTO'));
  const [poster, setPoster] = useState<string[]>(pick('POSTER'));
  const [gallery, setGallery] = useState<string[]>(pick('GALLERY'));
  const [busy, setBusy] = useState(false);

  const roles =
    config?.eventTypes.find((t) => t.value === eventType)?.imageRoles ?? [
      'POSTER',
      'GALLERY',
    ];
  const allows = (r: ImageRole) => roles.includes(r);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const images = [
      ...(allows('DECEASED_PHOTO') ? deceased : []).map((url) => ({
        role: 'DECEASED_PHOTO' as const,
        url,
      })),
      ...poster.map((url) => ({ role: 'POSTER' as const, url })),
      ...gallery.map((url) => ({ role: 'GALLERY' as const, url })),
    ];
    const input = {
      eventType,
      title: title.trim(),
      body: body.trim(),
      eventAt: fromLocalInput(eventAt),
      venue: venue.trim() || undefined,
      cityId: cityId || undefined,
      visibility,
      images,
    };
    try {
      const saved = existing
        ? await noticesApi.update(existing.id, input)
        : await noticesApi.create(input);
      queryClient.invalidateQueries({ queryKey: ['community'] });
      toast.success(existing ? 'Notice updated' : 'Notice posted');
      router.push(`/notices/${saved.id}`);
    } catch (error) {
      toast.error(apiError(error, 'Could not save the notice'));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-2xl font-bold">
        {existing ? 'Edit notice' : 'Post a notice'}
      </h1>

      <Field label="Type of notice">
        <select
          className={inputClass}
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
        >
          {existing &&
            !config?.eventTypes.some((t) => t.value === existing.eventType) && (
              // Type switched off by admins after posting: still keepable.
              <option value={existing.eventType}>
                {existing.eventTypeLabel ?? existing.eventType}
              </option>
            )}
          {(config?.eventTypes ?? []).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Title" hint="e.g. Funeral of the late Kofi Mensah">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={120}
        />
      </Field>
      <Field label="Notice" hint="Programme, family details, anything people should know">
        <textarea
          className={inputClass}
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date and time (optional)">
          <input
            type="datetime-local"
            className={inputClass}
            value={eventAt}
            onChange={(e) => setEventAt(e.target.value)}
          />
        </Field>
        <Field label="Venue (optional)">
          <input
            className={inputClass}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            maxLength={200}
          />
        </Field>
      </div>
      <CityPicker
        value={cityId}
        initialName={existing?.city?.name}
        onChange={setCityId}
      />

      {allows('DECEASED_PHOTO') && (
        <div>
          <span className="block text-sm font-semibold mb-1">
            Photo of the deceased (optional)
          </span>
          <ImageUploader images={deceased} onImagesChange={setDeceased} maxImages={1} />
        </div>
      )}
      <div>
        <span className="block text-sm font-semibold mb-1">
          Funeral poster / obituary image (optional)
        </span>
        <ImageUploader images={poster} onImagesChange={setPoster} maxImages={1} />
      </div>
      <div>
        <span className="block text-sm font-semibold mb-1">
          More photos (optional, up to 8)
        </span>
        <ImageUploader images={gallery} onImagesChange={setGallery} maxImages={8} />
      </div>

      <fieldset>
        <legend className="block text-sm font-semibold mb-2">Who can see it</legend>
        {(config?.visibility.options ?? []).map((o) => (
          <label key={o.value} className="flex items-start gap-2 mb-2 text-sm">
            <input
              type="radio"
              name="visibility"
              checked={visibility === o.value}
              onChange={() => setVisibility(o.value)}
              className="mt-1"
            />
            {o.label}
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={busy}
        className="px-6 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
      >
        {busy ? 'Saving…' : existing ? 'Save changes' : 'Post notice'}
      </button>
    </form>
  );
}

function NoticeFlow({ readOnly }: { readOnly: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('edit');
  const editProfile = params.get('profile') === '1';
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const profile = useQuery({
    queryKey: ['community', 'my-notice-profile'],
    queryFn: noticesApi.myProfile,
    enabled: isAuthenticated,
  });
  const mine = useQuery({
    queryKey: ['community', 'my-notices'],
    queryFn: () => noticesApi.mine(),
    enabled: isAuthenticated && Boolean(editId),
  });
  const [profileDone, setProfileDone] = useState(false);
  // Types are admin-managed; wait for them so the form starts on a real one.
  const typeConfig = useNoticeFormConfig();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/post/notice')}`);
    }
  }, [authLoading, isAuthenticated, router]);

  if (readOnly) {
    return <p className="py-16 text-center">Posting is paused at the moment.</p>;
  }
  if (
    authLoading ||
    !isAuthenticated ||
    profile.isLoading ||
    typeConfig.isLoading ||
    (editId && mine.isLoading)
  ) {
    return <p className="py-16 text-text-gray">Loading…</p>;
  }
  if (profile.data?.status === 'SUSPENDED') {
    return <p className="py-16 text-center">Your notices profile is suspended.</p>;
  }
  if (!profile.data || (editProfile && !profileDone)) {
    return (
      <ProfileForm
        profile={profile.data ?? null}
        onSaved={() => {
          setProfileDone(true);
          profile.refetch();
          if (editProfile) router.push('/account/community');
        }}
      />
    );
  }
  const existing = editId
    ? (mine.data?.items.find((p) => p.id === editId) ?? null)
    : null;
  if (editId && !existing) {
    return <p className="py-16 text-center">Notice not found.</p>;
  }
  return <NoticeForm key={existing?.id ?? 'new'} existing={existing} />;
}

export default function PostNoticePage() {
  return (
    <SectionGate section="event_notices">
      {({ readOnly }) => (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Suspense fallback={<p className="py-16 text-text-gray">Loading…</p>}>
            <NoticeFlow readOnly={readOnly} />
          </Suspense>
        </div>
      )}
    </SectionGate>
  );
}
