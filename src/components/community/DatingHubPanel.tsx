'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CityPicker } from '@/components/community/CityPicker';
import { LoadMore, SectionGate } from '@/components/community/SectionGate';
import {
  useDatingConversations,
  useDatingMessages,
  useDatingPosts,
  useMyDatingKyc,
  useMyDatingProfile,
  useMyKey,
} from '@/hooks/useCommunity';
import {
  apiError,
  datingApi,
  uploadCommunityImage,
} from '@/services/community.service';
import type {
  DatingDocumentType,
  DatingGender,
  DatingLookingFor,
  DatingPost,
} from '@/types/community';

const GENDER_LABELS: Record<DatingGender, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
};

const LOOKING_FOR_LABELS: Record<DatingLookingFor, string> = {
  WOMAN: 'Seeking a woman',
  MAN: 'Seeking a man',
  ANYONE: 'Open to anyone',
};

const DOC_TYPES: { value: DatingDocumentType; label: string }[] = [
  { value: 'NATIONAL_ID', label: 'National ID (Ghana Card)' },
  { value: 'DRIVERS_LICENSE', label: "Driver's Licence" },
  { value: 'PASSPORT', label: 'Passport' },
];

type SubView = 'browse' | 'new-post' | 'inbox' | 'profile';

const pillClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-border-custom text-text-gray hover:bg-background-primary hover:text-text'
  }`;

export function DatingHubPanel() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const myKey = useMyKey();

  const kycQuery = useMyDatingKyc(isAuthenticated);
  const profileQuery = useMyDatingProfile(isAuthenticated);

  const [subView, setSubView] = useState<SubView>('browse');

  // Browse filters
  const [filterGender, setFilterGender] = useState<DatingGender | ''>('');
  const [filterLookingFor, setFilterLookingFor] = useState<
    DatingLookingFor | ''
  >('');
  const [filterCity, setFilterCity] = useState('');

  // KYC onboarding state (3-step wizard)
  const [kycStep, setKycStep] = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<DatingDocumentType>('NATIONAL_ID');
  const [docNumber, setDocNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [documentKey, setDocumentKey] = useState('');
  const [faceKeys, setFaceKeys] = useState<[string, string, string]>([
    '',
    '',
    '',
  ]);
  const [kycBusy, setKycBusy] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  // Dating profile setup state
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState<number>(1996);
  const [gender, setGender] = useState<DatingGender>('MAN');
  const [lookingFor, setLookingFor] = useState<DatingLookingFor>('WOMAN');
  const [about, setAbout] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // New introduction post state
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postBusy, setPostBusy] = useState(false);
  const [postMsg, setPostMsg] = useState<string | null>(null);

  // Encrypted Inbox state
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [draftMsg, setDraftMsg] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [reportMsgId, setReportMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const kycRecord = kycQuery.data ?? null;
  const kycStatus = kycRecord?.status ?? 'NOT_STARTED';
  const myProfile = profileQuery.data ?? null;
  const isVerifiedAndActive =
    isAuthenticated &&
    kycStatus === 'APPROVED' &&
    (myProfile?.status === 'ACTIVE' || myProfile?.status === 'HIDDEN');

  const postsQuery = useDatingPosts(
    {
      gender: filterGender || undefined,
      lookingFor: filterLookingFor || undefined,
      city: filterCity || undefined,
    },
    isVerifiedAndActive && subView === 'browse'
  );

  const conversationsQuery = useDatingConversations(
    isVerifiedAndActive && subView === 'inbox'
  );
  const messagesQuery = useDatingMessages(
    activeConvId,
    isVerifiedAndActive && subView === 'inbox'
  );

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border-custom bg-white p-8 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-primaryLight px-3 py-1 text-xs font-bold text-primary">
          ID-Verified &amp; Private
        </span>
        <h2 className="mt-3 text-2xl font-black text-text">
          Love &amp; Dating on Willfinditt
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-gray">
          Every member verifies their identity with a government ID and three
          live face checks before joining. Your real name, phone number, email,
          and marketplace ads are never shown on your dating profile — only your
          chosen dating nickname, approximate age, and city appear.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/auth/login?redirect=/dating"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  const handleUploadKycSlot = async (
    file: File,
    onKey: (key: string) => void
  ) => {
    setKycError(null);
    setKycBusy(true);
    try {
      const { key } = await datingApi.uploadKycImage(file);
      onKey(key);
    } catch (err) {
      setKycError(apiError(err, 'Could not upload verification photo'));
    } finally {
      setKycBusy(false);
    }
  };

  const handleSubmitKyc = async () => {
    setKycError(null);
    setKycBusy(true);
    try {
      await datingApi.submitKyc({
        consent,
        documentType: docType,
        documentNumber: docNumber.trim(),
        documentKey,
        faceKeys,
      });
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-kyc'],
      });
    } catch (err) {
      setKycError(apiError(err, 'Could not submit KYC verification'));
    } finally {
      setKycBusy(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileMsg(null);
    setProfileBusy(true);
    try {
      const payload = {
        nickname: nickname.trim() || myProfile?.nickname || '',
        birthYear: Number(birthYear || myProfile?.birthYear || 1996),
        gender,
        lookingFor,
        about: about.trim() || null,
        cityId: profileCity || null,
        ...(photoAssetId ? { photoAssetId } : {}),
      };
      if (myProfile) {
        await datingApi.updateProfile(payload);
      } else {
        await datingApi.createProfile(payload);
      }
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-profile'],
      });
      setProfileMsg(
        myProfile
          ? 'Dating profile updated.'
          : 'Dating profile created (pending approval).'
      );
    } catch (err) {
      setProfileMsg(apiError(err, 'Could not save dating profile'));
    } finally {
      setProfileBusy(false);
    }
  };

  const handleCreatePost = async () => {
    setPostMsg(null);
    setPostBusy(true);
    try {
      await datingApi.createPost({
        title: postTitle.trim(),
        body: postBody.trim(),
      });
      setPostTitle('');
      setPostBody('');
      await queryClient.invalidateQueries({
        queryKey: ['community', 'dating', 'posts'],
      });
      setSubView('browse');
    } catch (err) {
      setPostMsg(apiError(err, 'Could not publish introduction'));
    } finally {
      setPostBusy(false);
    }
  };

  const handleStartChat = async (post: DatingPost) => {
    try {
      const conv = await datingApi.startConversation(post.id);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
      setActiveConvId(conv.id);
      setSubView('inbox');
    } catch (err) {
      alert(apiError(err, 'Could not open private conversation'));
    }
  };

  const handleSelectConversation = async (convId: string) => {
    setActiveConvId(convId);
    try {
      await datingApi.markRead(convId);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
    } catch {
      // Non-fatal
    }
  };

  const handleSendMessage = async () => {
    if (!activeConvId || !draftMsg.trim()) return;
    setChatBusy(true);
    try {
      await datingApi.sendMessage(activeConvId, {
        type: 'TEXT',
        text: draftMsg.trim(),
      });
      setDraftMsg('');
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-messages', activeConvId],
      });
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
    } catch (err) {
      alert(apiError(err, 'Could not send message'));
    } finally {
      setChatBusy(false);
    }
  };

  const handleSharePhone = async () => {
    if (!activeConvId) return;
    setChatBusy(true);
    try {
      await datingApi.sharePhone(activeConvId);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-messages', activeConvId],
      });
    } catch (err) {
      alert(apiError(err, 'Could not share phone number'));
    } finally {
      setChatBusy(false);
    }
  };

  const handleShredConversation = async (convId: string) => {
    if (
      !window.confirm(
        'Delete this conversation? The encryption key will be destroyed immediately so neither side can read past messages.'
      )
    ) {
      return;
    }
    try {
      await datingApi.deleteConversation(convId);
      setActiveConvId(null);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
    } catch (err) {
      alert(apiError(err, 'Could not delete conversation'));
    }
  };

  const handleReportMessage = async () => {
    if (!activeConvId || !reportMsgId || reportReason.trim().length < 3) return;
    try {
      await datingApi.reportMessage(
        activeConvId,
        reportMsgId,
        reportReason.trim()
      );
      setReportMsgId(null);
      setReportReason('');
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-messages', activeConvId],
      });
      alert('Report sent to the safety team.');
    } catch (err) {
      alert(apiError(err, 'Could not report message'));
    }
  };

  // Gate 1: User has not completed KYC + Active Profile yet
  if (!isVerifiedAndActive) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex rounded-full bg-primaryLight px-3 py-1 text-xs font-bold text-primary">
                Verification status: {kycStatus.replace(/_/g, ' ')}
              </span>
              <h2 className="mt-2 text-xl font-black text-text">
                Complete your private Dating verification &amp; profile
              </h2>
              <p className="mt-1 text-sm text-text-gray">
                Your ID and 3 live face photos are stored in a private vault,
                never shown to other members, and automatically purged 30 days
                after review.
              </p>
            </div>
          </div>

          {kycRecord?.decisionReason || kycRecord?.infoRequestMessage ? (
            <div className="mt-4 rounded-xl border border-error/40 bg-error/5 p-3 text-sm text-error">
              Reviewer note:{' '}
              {kycRecord.infoRequestMessage || kycRecord.decisionReason}
            </div>
          ) : null}

          {kycStatus === 'PENDING' ? (
            <div className="mt-4 rounded-xl border border-border-custom bg-background-primary p-4 text-sm text-text">
              Your ID &amp; face verification photos have been submitted and are
              waiting for moderator approval. Make sure your pseudonymous dating
              profile below is filled in so it goes live right away once
              approved.
            </div>
          ) : kycStatus !== 'APPROVED' ? (
            <div className="mt-6 space-y-5 border-t border-border-custom pt-5">
              {/* Step indicators */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {[
                  { s: 1 as const, label: '1. ID Details & Consent' },
                  { s: 2 as const, label: '2. ID Document Photo' },
                  { s: 3 as const, label: '3. Three Face Checks' },
                ].map((item) => (
                  <button
                    key={item.s}
                    type="button"
                    onClick={() => setKycStep(item.s)}
                    className={pillClass(kycStep === item.s)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {kycError ? (
                <p className="text-sm font-medium text-error">{kycError}</p>
              ) : null}

              {kycStep === 1 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-text">
                      Government ID Type
                    </label>
                    <select
                      value={docType}
                      onChange={(e) =>
                        setDocType(e.target.value as DatingDocumentType)
                      }
                      className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
                    >
                      {DOC_TYPES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-text">
                      Document Number (HMAC hashed, never stored in plain text)
                    </label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="e.g. GHA-123456789-0"
                      className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-start gap-2 text-sm text-text-gray">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        I consent to Willfinditt verifying my ID and 3 live face
                        photos for safety and age verification. Raw verification
                        photos are deleted 30 days after review.
                      </span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      disabled={docNumber.trim().length < 5 || !consent}
                      onClick={() => setKycStep(2)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Next: Upload ID Photo
                    </button>
                  </div>
                </div>
              ) : kycStep === 2 ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border-custom p-4">
                    <p className="text-sm font-bold text-text">
                      Government ID Photo (Required)
                    </p>
                    <p className="mt-1 text-xs text-text-gray">
                      Upload a clear photo of the front of your selected ID.
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadKycSlot(f, setDocumentKey);
                      }}
                      className="mt-2 block w-full text-xs text-text-gray"
                    />
                    {documentKey ? (
                      <p className="mt-1 text-xs font-semibold text-green-600">
                        Uploaded securely
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setKycStep(1)}
                      className="rounded-lg border border-border-custom px-4 py-2 text-sm font-semibold text-text"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!documentKey || kycBusy}
                      onClick={() => setKycStep(3)}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Next: Three Face Photos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      '1. Straight-on face photo',
                      '2. Slight head turn (left or right)',
                      '3. Clear selfie in good light',
                    ].map((label, idx) => (
                      <div
                        key={label}
                        className="rounded-xl border border-border-custom p-4"
                      >
                        <p className="text-sm font-bold text-text">{label}</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUploadKycSlot(f, (key) =>
                                setFaceKeys((prev) => {
                                  const next: [string, string, string] = [
                                    ...prev,
                                  ] as [string, string, string];
                                  next[idx] = key;
                                  return next;
                                })
                              );
                            }
                          }}
                          className="mt-2 block w-full text-xs text-text-gray"
                        />
                        {faceKeys[idx] ? (
                          <p className="mt-1 text-xs font-semibold text-green-600">
                            Uploaded securely
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setKycStep(2)}
                      className="rounded-lg border border-border-custom px-4 py-2 text-sm font-semibold text-text"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={
                        kycBusy ||
                        !documentKey ||
                        !faceKeys[0] ||
                        !faceKeys[1] ||
                        !faceKeys[2]
                      }
                      onClick={handleSubmitKyc}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {kycBusy ? 'Submitting…' : 'Submit Verification'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Dating Profile card */}
        <div className="rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-text">
            Your Pseudonymous Dating Profile
          </h3>
          <p className="mt-1 text-sm text-text-gray">
            Choose a nickname that is different from your real name. Only your
            nickname, approximate age, city, and dating photo are visible in
            Dating.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                Dating Nickname
              </label>
              <input
                type="text"
                value={nickname || myProfile?.nickname || ''}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. SunnyAma"
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                Birth Year (18+ only — never shown publicly)
              </label>
              <input
                type="number"
                min={1925}
                max={new Date().getFullYear() - 18}
                value={birthYear || myProfile?.birthYear || 1996}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                I am a
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as DatingGender)}
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              >
                <option value="MAN">Man</option>
                <option value="WOMAN">Woman</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                Looking for
              </label>
              <select
                value={lookingFor}
                onChange={(e) =>
                  setLookingFor(e.target.value as DatingLookingFor)
                }
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              >
                <option value="WOMAN">A woman</option>
                <option value="MAN">A man</option>
                <option value="ANYONE">Anyone</option>
              </select>
            </div>
            <div>
              <CityPicker
                value={profileCity}
                onChange={setProfileCity}
                label="City (optional)"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                Public Dating Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    const uploaded = await uploadCommunityImage(f);
                    setPhotoAssetId(uploaded.assetId);
                    setPhotoPreview(uploaded.url);
                  } catch (err) {
                    setProfileMsg(apiError(err, 'Could not upload photo'));
                  }
                }}
                className="w-full text-xs text-text-gray"
              />
              {photoPreview || myProfile?.photoUrl ? (
                <p className="mt-1 text-xs text-green-600">Photo attached</p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold text-text">
                About you
              </label>
              <textarea
                rows={3}
                value={about || myProfile?.about || ''}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Share your interests, values, and what kind of connection you are looking for…"
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              />
            </div>
          </div>

          {profileMsg ? (
            <p className="mt-3 text-sm font-medium text-primary">{profileMsg}</p>
          ) : null}

          <div className="mt-4">
            <button
              type="button"
              disabled={profileBusy}
              onClick={handleSaveProfile}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {profileBusy ? 'Saving…' : 'Save Dating Profile'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verified & Active Member View
  const posts = postsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const conversations = conversationsQuery.data ?? [];
  const messages = [
    ...(messagesQuery.data?.pages.flatMap((p) => p.items) ?? []),
  ].reverse();

  return (
    <div className="space-y-6">
      {/* Top sub-navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-custom bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'browse' as const, label: 'Browse Introductions' },
            { id: 'new-post' as const, label: 'Post Introduction' },
            { id: 'inbox' as const, label: 'Encrypted Dating Inbox' },
            { id: 'profile' as const, label: `My Profile (${myProfile.nickname})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubView(item.id)}
              className={pillClass(subView === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-text-gray">
          Signed in as{' '}
          <strong className="text-text">{myProfile.nickname}</strong> · KYC
          Verified
        </span>
      </div>

      {subView === 'browse' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: '' as const, label: 'All posters' },
              { value: 'WOMAN' as const, label: 'Women' },
              { value: 'MAN' as const, label: 'Men' },
            ].map((g) => (
              <button
                key={g.label}
                type="button"
                onClick={() => setFilterGender(g.value)}
                className={pillClass(filterGender === g.value)}
              >
                {g.label}
              </button>
            ))}

            {[
              { value: '' as const, label: 'Looking for: Any' },
              { value: 'WOMAN' as const, label: 'Seeking a woman' },
              { value: 'MAN' as const, label: 'Seeking a man' },
              { value: 'ANYONE' as const, label: 'Open to anyone' },
            ].map((lf) => (
              <button
                key={lf.label}
                type="button"
                onClick={() => setFilterLookingFor(lf.value)}
                className={pillClass(filterLookingFor === lf.value)}
              >
                {lf.label}
              </button>
            ))}
          </div>

          <div className="max-w-md">
            <CityPicker
              value={filterCity}
              onChange={setFilterCity}
              label="Filter by city"
            />
          </div>

          {postsQuery.isLoading ? (
            <p className="py-12 text-center text-text-gray">
              Loading introductions…
            </p>
          ) : !posts.length ? (
            <div className="rounded-2xl border border-dashed border-border-custom bg-white py-14 text-center">
              <p className="font-semibold text-text">
                No dating introductions match your filters yet.
              </p>
              <button
                type="button"
                onClick={() => setSubView('new-post')}
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Write an introduction
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col justify-between rounded-2xl border border-border-custom bg-white p-5 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      {post.profile.photoUrl ? (
                        <img
                          src={post.profile.photoUrl}
                          alt={post.profile.nickname}
                          referrerPolicy="no-referrer"
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primaryLight text-lg font-bold text-primary">
                          {post.profile.nickname.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-text">
                          {post.profile.nickname}, {post.profile.age}
                        </p>
                        <p className="text-xs text-text-gray">
                          {GENDER_LABELS[post.profile.gender]} ·{' '}
                          {LOOKING_FOR_LABELS[post.profile.lookingFor]}
                          {post.city ? ` · ${post.city.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-text-gray">
                      {post.body}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border-custom pt-3">
                    <span className="text-xs text-text-light-gray">
                      Encrypted 1-to-1 chat
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartChat(post)}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white hover:opacity-90"
                    >
                      Message privately
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <LoadMore
            show={Boolean(postsQuery.hasNextPage)}
            loading={postsQuery.isFetchingNextPage}
            onClick={() => postsQuery.fetchNextPage()}
          />
        </div>
      ) : subView === 'new-post' ? (
        <div className="max-w-2xl rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-text">
            Post a Dating Introduction
          </h3>
          <p className="mt-1 text-sm text-text-gray">
            Posting as <strong>{myProfile.nickname}</strong>. Do not include
            your phone number or social handles in the public post — you can
            share your number inside encrypted chat when you feel comfortable.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                Headline (3–120 characters)
              </label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="e.g. Looking for a serious partner in Accra who loves music and travel"
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-text">
                About you &amp; who you&apos;d like to meet (min 10 characters)
              </label>
              <textarea
                rows={5}
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="Write a warm, honest introduction…"
                className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
              />
            </div>
            {postMsg ? (
              <p className="text-sm font-medium text-error">{postMsg}</p>
            ) : null}
            <button
              type="button"
              disabled={
                postBusy ||
                postTitle.trim().length < 3 ||
                postBody.trim().length < 10
              }
              onClick={handleCreatePost}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {postBusy ? 'Publishing…' : 'Publish Introduction'}
            </button>
          </div>
        </div>
      ) : subView === 'inbox' ? (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border-custom bg-white p-4 shadow-sm lg:grid-cols-[280px_1fr]">
          {/* Conversation list */}
          <div className="border-b border-border-custom pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <h3 className="text-sm font-bold text-text">
              Encrypted Dating Conversations
            </h3>
            <p className="mt-0.5 text-xs text-text-gray">
              Separate from marketplace messages.
            </p>
            <div className="mt-3 space-y-2">
              {!conversations.length ? (
                <p className="py-6 text-xs text-text-gray">
                  No conversations yet. Message someone from Browse
                  Introductions to start.
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors ${
                      activeConvId === conv.id
                        ? 'bg-primaryLight text-primary'
                        : 'hover:bg-background-primary'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {conv.peerProfile?.nickname ?? 'Dating member'}
                      </p>
                      <p className="truncate text-xs text-text-gray">
                        {conv.post.title}
                      </p>
                    </div>
                    {conv.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Active Conversation Thread */}
          <div className="flex min-h-[380px] flex-col justify-between">
            {!activeConvId ? (
              <div className="flex flex-1 items-center justify-center text-sm text-text-gray">
                Select a conversation to view encrypted messages.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-custom pb-3">
                  <span className="text-xs font-semibold text-text-gray">
                    AES-256-GCM Encrypted Conversation
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={chatBusy}
                      onClick={handleSharePhone}
                      className="rounded-lg border border-border-custom px-3 py-1 text-xs font-semibold text-text hover:border-primary hover:text-primary"
                    >
                      Share my number in this chat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShredConversation(activeConvId)}
                      className="rounded-lg border border-error/40 px-3 py-1 text-xs font-semibold text-error hover:bg-error/5"
                    >
                      Delete &amp; shred key
                    </button>
                  </div>
                </div>

                <div className="my-4 max-h-[340px] flex-1 space-y-3 overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.isMine ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${
                          m.isMine
                            ? 'bg-primary text-white'
                            : 'bg-background-primary text-text'
                        }`}
                      >
                        {m.type === 'PHONE_SHARE' ? (
                          <p className="font-semibold">Shared phone: {m.text}</p>
                        ) : (
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        )}
                      </div>
                      {!m.isMine ? (
                        <button
                          type="button"
                          onClick={() => setReportMsgId(m.id)}
                          className="mt-1 text-[11px] text-text-light-gray hover:text-error"
                        >
                          Report message
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                {reportMsgId ? (
                  <div className="mb-3 rounded-xl border border-error/40 bg-error/5 p-3">
                    <p className="text-xs font-bold text-text">
                      Report message to safety moderators
                    </p>
                    <input
                      type="text"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Describe the issue (at least 3 characters)…"
                      className="mt-2 w-full rounded-lg border border-border-custom bg-white px-3 py-1.5 text-xs"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleReportMessage}
                        className="rounded-lg bg-error px-3 py-1 text-xs font-bold text-white"
                      >
                        Submit report
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportMsgId(null)}
                        className="text-xs text-text-gray"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draftMsg}
                    onChange={(e) => setDraftMsg(e.target.value)}
                    placeholder="Write an encrypted message…"
                    className="flex-1 rounded-xl border border-border-custom bg-background px-3.5 py-2 text-sm text-text"
                  />
                  <button
                    type="button"
                    disabled={chatBusy || !draftMsg.trim()}
                    onClick={handleSendMessage}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-text">
            My Dating Profile &amp; Privacy
          </h3>
          <p className="mt-1 text-sm text-text-gray">
            Nickname: <strong>{myProfile.nickname}</strong> · Age:{' '}
            {myProfile.age} · Status: {myProfile.status}
          </p>
          <p className="mt-2 text-sm text-text-gray">
            {myProfile.about || 'No about text set.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border-custom pt-4">
            <button
              type="button"
              onClick={async () => {
                const nextHidden = myProfile.status !== 'HIDDEN';
                await datingApi.updateProfile({ hidden: nextHidden });
                await queryClient.invalidateQueries({
                  queryKey: [...myKey, 'dating-profile'],
                });
              }}
              className="rounded-lg border border-border-custom px-4 py-2 text-xs font-bold text-text hover:bg-background-primary"
            >
              {myProfile.status === 'HIDDEN'
                ? 'Show My Dating Profile'
                : 'Hide My Dating Profile'}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    'Delete your Dating profile? All your dating posts will be removed and your dating chat keys will be crypto-shredded.'
                  )
                ) {
                  return;
                }
                await datingApi.deleteProfile();
                await queryClient.invalidateQueries({
                  queryKey: [...myKey, 'dating-profile'],
                });
              }}
              className="rounded-lg border border-error px-4 py-2 text-xs font-bold text-error hover:bg-error/5"
            >
              Delete Dating Profile &amp; Shred Chat Keys
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DatingPageClient() {
  return (
    <SectionGate section="dating">
      {() => (
        <div className="min-h-screen bg-background">
          <section className="border-b border-border-custom bg-gradient-to-br from-primary/10 via-background to-background-primary/40">
            <div className="container mx-auto flex flex-col justify-between gap-4 px-4 py-8 md:flex-row md:items-end">
              <div>
                <Link
                  href="/community"
                  className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  ← Back to Community Hub
                </Link>
                <h1 className="mt-1 text-3xl font-black text-text">
                  Love &amp; Dating
                </h1>
                <p className="mt-1 text-sm text-text-gray">
                  ID-verified introductions and private encrypted conversations.
                </p>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-8">
            <DatingHubPanel />
          </div>
        </div>
      )}
    </SectionGate>
  );
}
