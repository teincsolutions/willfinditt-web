'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SectionGate } from '@/components/community/SectionGate';
import { CityPicker } from '@/components/community/CityPicker';
import {
  CommunityImageUploader,
  type UploadedImage,
} from '@/components/community/CommunityImageUploader';
import {
  ExpiryText,
  ListingPeriodPicker,
} from '@/components/community/ListingPeriod';
import {
  Field,
  fromLocalInput,
  inputClass,
  toLocalInput,
} from '@/components/community/form';
import { useAuth } from '@/contexts/AuthContext';
import { useMyKey, useNoticeFormConfig } from '@/hooks/useCommunity';
import { apiError, noticesApi } from '@/services/community.service';
import type {
  EventFormConfig,
  EventPost,
  EventProfile,
  EventType,
  ImageRole,
  ListingPeriodInput,
  Visibility,
} from '@/types/community';

/** Images the owner already has, as uploader items. */
const asUploaded = (images: { assetId?: string; url: string | null }[]) =>
  images
    .filter((i): i is { assetId: string; url: string | null } =>
      Boolean(i.assetId)
    )
    .map((i) => ({ assetId: i.assetId, url: i.url }));

// --- Step 1: the family / organiser profile (once per account) --------------

function ProfileForm({
  profile,
  config,
  onSaved,
}: {
  profile: EventProfile | null;
  config?: EventFormConfig;
  onSaved: (p: EventProfile) => void;
}) {
  const nameRule = config?.profile.displayName ?? { required: true, min: 2, max: 80 };
  const aboutRule = config?.profile.about ?? { required: false, max: 1000 };
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [phone1, setPhone1] = useState(profile?.phone1 ?? '');
  const [phone2, setPhone2] = useState(profile?.phone2 ?? '');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [cityId, setCityId] = useState(profile?.city?.id ?? '');
  const [photo, setPhoto] = useState<UploadedImage[]>(
    profile?.photoMediaId
      ? [{ assetId: profile.photoMediaId, url: profile.photoUrl }]
      : []
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const photoId = photo[0]?.assetId ?? null;
    try {
      const saved = await noticesApi.saveProfile({
        displayName: displayName.trim(),
        // '' / null clears an optional field on the server.
        phone1: phone1.trim() || null,
        phone2: phone2.trim() || null,
        about: about.trim() || null,
        cityId: cityId || null,
        // Only send the photo when it changed.
        ...(photoId !== (profile?.photoMediaId ?? null)
          ? { photoAssetId: photoId }
          : {}),
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
          minLength={nameRule.min}
          maxLength={nameRule.max}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Contact phone (optional)"
          hint="Hidden until a signed-in visitor taps to see it"
        >
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
          maxLength={aboutRule.max}
        />
      </Field>
      <div>
        <span className="block text-sm font-semibold mb-1">Photo (optional)</span>
        <CommunityImageUploader images={photo} onChange={setPhoto} max={1} />
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

function NoticeForm({
  existing,
  config,
}: {
  existing: EventPost | null;
  config?: EventFormConfig;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pick = (role: ImageRole) =>
    asUploaded(existing?.images.filter((i) => i.role === role) ?? []);
  const roleMax = (role: ImageRole, fallback: number) =>
    config?.imageRoles.find((r) => r.value === role)?.max ?? fallback;
  const titleRule = config?.fields.title ?? { required: true, min: 3, max: 120 };
  const bodyRule = config?.fields.body ?? { required: true, min: 10, max: 5000 };
  const venueRule = config?.fields.venue ?? { required: false, max: 200 };

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
  const [listing, setListing] = useState<ListingPeriodInput>({
    listingDays: config?.listing.defaultDays ?? 30,
  });
  const [deceased, setDeceased] = useState<UploadedImage[]>(pick('DECEASED_PHOTO'));
  const [poster, setPoster] = useState<UploadedImage[]>(pick('POSTER'));
  const [gallery, setGallery] = useState<UploadedImage[]>(pick('GALLERY'));
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
      ...(allows('DECEASED_PHOTO') ? deceased : []).map((i) => ({
        role: 'DECEASED_PHOTO' as const,
        assetId: i.assetId,
      })),
      ...(allows('POSTER') ? poster : []).map((i) => ({
        role: 'POSTER' as const,
        assetId: i.assetId,
      })),
      ...(allows('GALLERY') ? gallery : []).map((i) => ({
        role: 'GALLERY' as const,
        assetId: i.assetId,
      })),
    ];
    const fields = {
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
        ? await noticesApi.update(existing.id, fields)
        : await noticesApi.create({ ...fields, ...listing });
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
          minLength={titleRule.min}
          maxLength={titleRule.max}
        />
      </Field>
      <Field label="Notice" hint="Programme, family details, anything people should know">
        <textarea
          className={inputClass}
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={bodyRule.min}
          maxLength={bodyRule.max}
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
            maxLength={venueRule.max}
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
          <CommunityImageUploader
            images={deceased}
            onChange={setDeceased}
            max={roleMax('DECEASED_PHOTO', 1)}
          />
        </div>
      )}
      {allows('POSTER') && (
        <div>
          <span className="block text-sm font-semibold mb-1">
            Poster / obituary image (optional)
          </span>
          <CommunityImageUploader
            images={poster}
            onChange={setPoster}
            max={roleMax('POSTER', 1)}
          />
        </div>
      )}
      {allows('GALLERY') && (
        <div>
          <span className="block text-sm font-semibold mb-1">
            More photos (optional, up to {roleMax('GALLERY', 8)})
          </span>
          <CommunityImageUploader
            images={gallery}
            onChange={setGallery}
            max={roleMax('GALLERY', 8)}
          />
        </div>
      )}

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

      {existing ? (
        <p className="text-sm text-text-gray">
          <ExpiryText expiresAt={existing.expiresAt} />. To keep it up for
          longer, use Renew in My community posts.
        </p>
      ) : (
        <ListingPeriodPicker
          value={listing}
          onChange={setListing}
          rules={config?.listing}
        />
      )}

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
  const myKey = useMyKey();

  const profile = useQuery({
    queryKey: [...myKey, 'notice-profile'],
    queryFn: noticesApi.myProfile,
    enabled: isAuthenticated,
  });
  const existing = useQuery({
    queryKey: [...myKey, 'notice', editId],
    queryFn: () => noticesApi.getMine(editId as string),
    enabled: isAuthenticated && Boolean(editId),
    retry: false,
  });
  const [profileDone, setProfileDone] = useState(false);
  // Types and limits come from the server; wait for them.
  const config = useNoticeFormConfig();

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
    config.isLoading ||
    (editId && existing.isLoading)
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
        config={config.data}
        onSaved={() => {
          setProfileDone(true);
          profile.refetch();
          if (editProfile) router.push('/account/community');
        }}
      />
    );
  }
  if (editId && !existing.data) {
    return <p className="py-16 text-center">Notice not found.</p>;
  }
  return (
    <NoticeForm
      key={existing.data?.id ?? 'new'}
      existing={existing.data ?? null}
      config={config.data}
    />
  );
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
