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
import { apiError, lostFoundApi } from '@/services/community.service';
import { useLostFoundFormConfig, useMyKey } from '@/hooks/useCommunity';
import type {
  ListingPeriodInput,
  LostFoundFormConfig,
  LostFoundKind,
  LostFoundPost,
} from '@/types/community';

function LostFoundForm({
  existing,
  config,
}: {
  existing: LostFoundPost | null;
  config?: LostFoundFormConfig;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const rules = {
    title: config?.fields.title ?? { required: true, min: 3, max: 120 },
    body: config?.fields.body ?? { required: true, min: 10, max: 3000 },
    place: config?.fields.place ?? { required: false, max: 200 },
    posterName: config?.fields.posterName ?? { required: true, min: 2, max: 40 },
    images: config?.fields.images ?? { required: false, max: 6 },
  };
  const [kind, setKind] = useState<LostFoundKind>(existing?.kind ?? 'LOST');
  const [category, setCategory] = useState(existing?.category ?? 'ITEM');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [place, setPlace] = useState(existing?.place ?? '');
  const [happenedAt, setHappenedAt] = useState(
    toLocalInput(existing?.happenedAt, true)
  );
  const [cityId, setCityId] = useState(existing?.city?.id ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  // Older posts may show the neutral name; ask for a real choice on edit.
  const [posterName, setPosterName] = useState(
    existing?.posterName === 'Willfinditt user' ? '' : (existing?.posterName ?? '')
  );
  const [images, setImages] = useState<UploadedImage[]>(
    existing?.images
      .filter((i): i is typeof i & { assetId: string } => Boolean(i.assetId))
      .map((i) => ({ assetId: i.assetId, url: i.url })) ?? []
  );
  const [listing, setListing] = useState<ListingPeriodInput>({
    listingDays: config?.listing.defaultDays ?? 30,
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fields = {
      kind,
      category,
      title: title.trim(),
      body: body.trim(),
      place: place.trim() || undefined,
      happenedAt: fromLocalInput(happenedAt),
      cityId: cityId || undefined,
      phone: phone.trim() || undefined,
      posterName: posterName.trim(),
      images: images.map((i) => i.assetId),
    };
    try {
      const saved = existing
        ? await lostFoundApi.update(existing.id, fields)
        : await lostFoundApi.create({ ...fields, ...listing });
      queryClient.invalidateQueries({ queryKey: ['community'] });
      toast.success(existing ? 'Post updated' : 'Posted');
      router.push(`/lost-and-found/${saved.id}`);
    } catch (error) {
      toast.error(apiError(error, 'Could not save the post'));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <h1 className="text-2xl font-bold">
        {existing ? 'Edit post' : 'Lost or found something?'}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        {(['LOST', 'FOUND'] as LostFoundKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`py-3 rounded-xl border-2 font-bold ${
              kind === k
                ? 'border-primary bg-primaryLight text-primary'
                : 'border-border-custom'
            }`}
          >
            {k === 'LOST' ? 'I lost something' : 'I found something'}
          </button>
        ))}
      </div>

      {(config?.categories.length ?? 0) > 0 && (
        <Field label="What is it?">
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {existing &&
              !config?.categories.some((c) => c.value === existing.category) && (
                <option value={existing.category}>
                  {existing.categoryLabel ?? existing.category}
                </option>
              )}
            {config?.categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Title" hint="e.g. Black leather wallet lost at Kaneshie">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={rules.title.min}
          maxLength={rules.title.max}
        />
      </Field>
      <Field
        label="Details"
        hint={
          kind === 'FOUND'
            ? 'Keep one detail back so the owner can prove it is theirs.'
            : 'What it looks like and anything that identifies it.'
        }
      >
        <textarea
          className={inputClass}
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={rules.body.min}
          maxLength={rules.body.max}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Where (optional)">
          <input
            className={inputClass}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={rules.place.max}
          />
        </Field>
        <Field label="When (optional)">
          <input
            type="date"
            className={inputClass}
            value={happenedAt}
            onChange={(e) => setHappenedAt(e.target.value)}
          />
        </Field>
      </div>
      <CityPicker
        value={cityId}
        initialName={existing?.city?.name}
        onChange={setCityId}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Phone (optional)"
          hint="Hidden. Signed-in people tap to see it."
        >
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
          />
        </Field>
        <Field
          label="Name to show"
          hint="Shown on the post and in messages. A nickname is fine."
        >
          <input
            className={inputClass}
            value={posterName}
            onChange={(e) => setPosterName(e.target.value)}
            required
            minLength={rules.posterName.min}
            maxLength={rules.posterName.max}
          />
        </Field>
      </div>
      <div>
        <span className="block text-sm font-semibold mb-1">
          Photos (optional, up to {rules.images.max})
        </span>
        <CommunityImageUploader
          images={images}
          onChange={setImages}
          max={rules.images.max ?? 6}
        />
      </div>

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
        {busy ? 'Saving…' : existing ? 'Save changes' : 'Post'}
      </button>
    </form>
  );
}

function Flow({ readOnly }: { readOnly: boolean }) {
  const router = useRouter();
  const editId = useSearchParams().get('edit');
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const myKey = useMyKey();
  const config = useLostFoundFormConfig();
  const existing = useQuery({
    queryKey: [...myKey, 'lost-found', editId],
    queryFn: () => lostFoundApi.getMine(editId as string),
    enabled: isAuthenticated && Boolean(editId),
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/post/lost-found')}`);
    }
  }, [authLoading, isAuthenticated, router]);

  if (readOnly) {
    return <p className="py-16 text-center">Posting is paused at the moment.</p>;
  }
  if (
    authLoading ||
    !isAuthenticated ||
    config.isLoading ||
    (editId && existing.isLoading)
  ) {
    return <p className="py-16 text-text-gray">Loading…</p>;
  }
  if (editId && !existing.data) {
    return <p className="py-16 text-center">Post not found.</p>;
  }
  return (
    <LostFoundForm
      key={existing.data?.id ?? 'new'}
      existing={existing.data ?? null}
      config={config.data}
    />
  );
}

export default function PostLostFoundPage() {
  return (
    <SectionGate section="lost_found">
      {({ readOnly }) => (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Suspense fallback={<p className="py-16 text-text-gray">Loading…</p>}>
            <Flow readOnly={readOnly} />
          </Suspense>
        </div>
      )}
    </SectionGate>
  );
}
