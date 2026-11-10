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
import { apiError, lostFoundApi } from '@/services/community.service';
import type { LostFoundKind, LostFoundPost } from '@/types/community';

function LostFoundForm({ existing }: { existing: LostFoundPost | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<LostFoundKind>(existing?.kind ?? 'LOST');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [place, setPlace] = useState(existing?.place ?? '');
  const [happenedAt, setHappenedAt] = useState(
    toLocalInput(existing?.happenedAt, true)
  );
  const [cityId, setCityId] = useState(existing?.city?.id ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [posterName, setPosterName] = useState(existing?.posterName ?? '');
  const [images, setImages] = useState<string[]>(
    existing?.images.map((i) => i.url) ?? []
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const input = {
      kind,
      title: title.trim(),
      body: body.trim(),
      place: place.trim() || undefined,
      happenedAt: fromLocalInput(happenedAt),
      cityId: cityId || undefined,
      phone: phone.trim() || undefined,
      posterName: posterName.trim() || undefined,
      images,
    };
    try {
      const saved = existing
        ? await lostFoundApi.update(existing.id, input)
        : await lostFoundApi.create(input);
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

      <Field label="Title" hint="e.g. Black leather wallet lost at Kaneshie">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={120}
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
          minLength={10}
          maxLength={3000}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Where (optional)">
          <input
            className={inputClass}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={200}
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
        <Field label="Name to show (optional)" hint="Defaults to your first name">
          <input
            className={inputClass}
            value={posterName}
            onChange={(e) => setPosterName(e.target.value)}
            maxLength={40}
          />
        </Field>
      </div>
      <div>
        <span className="block text-sm font-semibold mb-1">Photos (optional, up to 6)</span>
        <ImageUploader images={images} onImagesChange={setImages} maxImages={6} />
      </div>
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
  const mine = useQuery({
    queryKey: ['community', 'my-lost-found'],
    queryFn: () => lostFoundApi.mine(),
    enabled: isAuthenticated && Boolean(editId),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent('/post/lost-found')}`);
    }
  }, [authLoading, isAuthenticated, router]);

  if (readOnly) {
    return <p className="py-16 text-center">Posting is paused at the moment.</p>;
  }
  if (authLoading || !isAuthenticated || (editId && mine.isLoading)) {
    return <p className="py-16 text-text-gray">Loading…</p>;
  }
  const existing = editId
    ? (mine.data?.items.find((p) => p.id === editId) ?? null)
    : null;
  if (editId && !existing) {
    return <p className="py-16 text-center">Post not found.</p>;
  }
  return <LostFoundForm key={existing?.id ?? 'new'} existing={existing} />;
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
