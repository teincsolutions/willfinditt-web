'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CityPicker } from '@/components/community/CityPicker';
import { LoadMore, SectionGate } from '@/components/community/SectionGate';
import {
  useDatingConversations,
  useDatingProfiles,
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
  DatingPublicProfile,
} from '@/types/community';

const GENDER_LABELS: Record<DatingGender, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
};

const LOOKING_FOR_LABELS: Record<DatingLookingFor, string> = {
  WOMAN: 'Looking for a woman',
  MAN: 'Looking for a man',
  ANYONE: 'Open to anyone',
};

const DOC_TYPES: { value: DatingDocumentType; label: string }[] = [
  { value: 'NATIONAL_ID', label: 'National ID (Ghana Card)' },
  { value: 'DRIVERS_LICENSE', label: "Driver's Licence" },
  { value: 'PASSPORT', label: 'Passport' },
];

type DatingTab = 'discover' | 'matches' | 'likes' | 'profile';
type LikedProfile = { profile: DatingPublicProfile };

const pillClass = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-border-custom text-text-gray hover:bg-background-primary hover:text-text'
  }`;

const likesStorageKey = (profileId: string) =>
  `community:dating:likes:v2:${profileId}`;

export function DatingHubPanel() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myKey = useMyKey();

  const kycQuery = useMyDatingKyc(isAuthenticated);
  const profileQuery = useMyDatingProfile(isAuthenticated);

  const [tab, setTab] = useState<DatingTab>('discover');
  const [showMe, setShowMe] = useState<DatingLookingFor | null>(null);
  const [filterCity, setFilterCity] = useState('');
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const [liked, setLiked] = useState<LikedProfile[]>([]);
  const [likesReady, setLikesReady] = useState(false);

  // KYC setup
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
  const [kycNotice, setKycNotice] = useState<string | null>(null);

  // Profile setup
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState(1996);
  const [gender, setGender] = useState<DatingGender>('MAN');
  const [lookingFor, setLookingFor] = useState<DatingLookingFor>('WOMAN');
  const [about, setAbout] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [photoAssetId, setPhotoAssetId] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const kyc = kycQuery.data ?? null;
  const profile = profileQuery.data ?? null;
  const kycStatus = kyc?.status ?? 'NOT_STARTED';

  const kycAllowsBrowsing =
    Boolean(kyc) &&
    kyc?.status !== 'REJECTED' &&
    (kyc?.status !== 'APPROVED' || kyc?.isAdult === true);

  const canBrowse =
    isAuthenticated &&
    Boolean(profile) &&
    kycAllowsBrowsing &&
    profile?.status !== 'REJECTED' &&
    profile?.status !== 'SUSPENDED';

  const canInteract =
    canBrowse &&
    (profile?.status === 'ACTIVE' || profile?.status === 'HIDDEN') &&
    kyc?.status === 'APPROVED';

  const effectiveShowMe: DatingLookingFor =
    showMe ?? profile?.lookingFor ?? 'ANYONE';

  const profilesQuery = useDatingProfiles(
    {
      gender: effectiveShowMe === 'ANYONE' ? undefined : effectiveShowMe,
      city: filterCity || undefined,
    },
    canBrowse && tab === 'discover'
  );

  const conversationsQuery = useDatingConversations(canInteract);

  // Keep the form in sync with the saved profile without overwriting edits.
  useEffect(() => {
    if (!profile) return;
    setNickname(profile.nickname);
    setBirthYear(profile.birthYear);
    setGender(profile.gender);
    setLookingFor(profile.lookingFor);
    setAbout(profile.about ?? '');
    setProfileCity(profile.city?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    const key = likesStorageKey(profile.id);
    try {
      const raw = window.localStorage.getItem(key);
      setLiked(raw ? (JSON.parse(raw) as LikedProfile[]) : []);
    } catch {
      setLiked([]);
    } finally {
      setLikesReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (!profile || !likesReady) return;
    try {
      window.localStorage.setItem(
        likesStorageKey(profile.id),
        JSON.stringify(liked)
      );
    } catch {
      // Private browsing or quota: likes still work for this session.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liked, likesReady, profile?.id]);

  const profiles = useMemo(() => {
    const rows = profilesQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return rows.filter((item) => {
      if (item.id === profile?.id) return false;
      if (skipped.has(item.id)) return false;
      if (effectiveShowMe !== 'ANYONE' && item.gender !== effectiveShowMe)
        return false;
      return (
        item.lookingFor === 'ANYONE' ||
        item.lookingFor === profile?.gender
      );
    });
  }, [profilesQuery.data, profile?.id, profile?.gender, effectiveShowMe, skipped]);

  const conversations = conversationsQuery.data ?? [];

  const likeIds = useMemo(
    () => new Set(liked.map((entry) => entry.profile.id)),
    [liked]
  );

  const unlike = (profileId: string) => {
    setLiked((previous) =>
      previous.filter((entry) => entry.profile.id !== profileId)
    );
  };

  const toggleLike = (target: DatingPublicProfile) => {
    if (likeIds.has(target.id)) {
      unlike(target.id);
      return;
    }
    setLiked((previous) => [{ profile: target }, ...previous]);
  };

  const skip = (profileId: string) => {
    setSkipped((previous) => new Set(previous).add(profileId));
  };

  const startChat = async (target: DatingPublicProfile) => {
    try {
      const conversation = await datingApi.startProfileConversation(target.id);
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
      router.push(`/messages/dating/${conversation.id}`);
    } catch (err) {
      alert(apiError(err, 'Could not start the conversation.'));
    }
  };

  const uploadKycFile = async (
    file: File,
    onKey: (key: string) => void
  ) => {
    setKycError(null);
    setKycBusy(true);
    try {
      const { key } = await datingApi.uploadKycImage(file);
      onKey(key);
    } catch (err) {
      setKycError(apiError(err, 'Could not upload the verification photo.'));
    } finally {
      setKycBusy(false);
    }
  };

  const submitKyc = async () => {
    setKycError(null);
    setKycNotice(null);
    setKycBusy(true);
    try {
      await datingApi.submitKyc({
        consent,
        documentType: docType,
        documentNumber: docNumber.trim(),
        documentKey,
        faceKeys,
      });
      setDocumentKey('');
      setFaceKeys(['', '', '']);
      setKycStep(1);
      setKycNotice('Your identity check was submitted for review.');
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-kyc'],
      });
    } catch (err) {
      setKycError(apiError(err, 'Could not submit the identity check.'));
    } finally {
      setKycBusy(false);
    }
  };

  const saveProfile = async () => {
    setProfileMsg(null);
    if (!photoAssetId && !profile?.photoUrl) {
      setProfileMsg('A public dating photo is required.');
      return;
    }
    setProfileBusy(true);
    try {
      const payload = {
        nickname: nickname.trim(),
        birthYear: Number(birthYear),
        gender,
        lookingFor,
        about: about.trim() || null,
        cityId: profileCity || null,
        ...(photoAssetId ? { photoAssetId } : {}),
      };
      if (profile) {
        await datingApi.updateProfile(payload);
      } else {
        await datingApi.createProfile(payload);
      }
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-profile'],
      });
      setPhotoAssetId(null);
      setProfileMsg(
        profile
          ? 'Your dating profile was updated.'
          : 'Your dating profile was submitted for review.'
      );
    } catch (err) {
      setProfileMsg(apiError(err, 'Could not save the dating profile.'));
    } finally {
      setProfileBusy(false);
    }
  };

  const uploadPublicPhoto = async (file: File) => {
    setProfileMsg(null);
    setPhotoBusy(true);
    try {
      const uploaded = await uploadCommunityImage(file);
      setPhotoAssetId(uploaded.assetId);
      setProfileMsg('Public photo attached.');
    } catch (err) {
      setProfileMsg(apiError(err, 'Could not upload the public photo.'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const toggleHidden = async () => {
    if (!profile) return;
    try {
      await datingApi.updateProfile({ hidden: profile.status !== 'HIDDEN' });
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-profile'],
      });
    } catch (err) {
      alert(apiError(err, 'Could not update your profile visibility.'));
    }
  };

  const deleteProfile = async () => {
    if (
      !window.confirm(
        'Delete your dating profile? Your public profile and dating conversations will be removed.'
      )
    ) {
      return;
    }
    try {
      await datingApi.deleteProfile();
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-profile'],
      });
      await queryClient.invalidateQueries({
        queryKey: [...myKey, 'dating-conversations'],
      });
    } catch (err) {
      alert(apiError(err, 'Could not delete your dating profile.'));
    }
  };

  if (authLoading) {
    return <p className="py-12 text-center text-text-gray">Loading…</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border-custom bg-white p-8 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-primaryLight px-3 py-1 text-xs font-bold text-primary">
          ID-verified and private
        </span>
        <h2 className="mt-3 text-2xl font-black text-text">
          Love &amp; Dating on Willfinditt
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-gray">
          Every member completes an identity check before joining. Your real
          name, phone number, email, and marketplace ads are never shown on your
          dating profile. Other members only see your chosen nickname,
          approximate age, city, and dating photo.
        </p>
        <Link
          href="/auth/login?redirect=/dating"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
        >
          Sign in to continue
        </Link>
      </div>
    );
  }

  if (kycQuery.isLoading || profileQuery.isLoading) {
    return <p className="py-12 text-center text-text-gray">Loading…</p>;
  }

  if (!profile || !kyc) {
    return (
      <div className="space-y-6">
        {!profile && kyc?.status === 'PENDING' ? (
          <div className="rounded-2xl border border-border-custom bg-background-primary p-4 text-sm text-text">
            Your identity check is under review. Add your dating profile below
            so it can go live as soon as your identity is approved.
          </div>
        ) : null}
        <SetupPanel
          kycStatus={kycStatus}
          kyc={kyc}
          kycStep={kycStep}
          setKycStep={setKycStep}
          docType={docType}
          setDocType={setDocType}
          docNumber={docNumber}
          setDocNumber={setDocNumber}
          consent={consent}
          setConsent={setConsent}
          documentKey={documentKey}
          setDocumentKey={setDocumentKey}
          faceKeys={faceKeys}
          kycBusy={kycBusy}
          kycError={kycError}
          kycNotice={kycNotice}
          uploadKycFile={uploadKycFile}
          setFaceKeys={setFaceKeys}
          submitKyc={submitKyc}
          nickname={nickname}
          setNickname={setNickname}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          gender={gender}
          setGender={setGender}
          lookingFor={lookingFor}
          setLookingFor={setLookingFor}
          about={about}
          setAbout={setAbout}
          profileCity={profileCity}
          setProfileCity={setProfileCity}
          photoBusy={photoBusy}
          hasPhoto={Boolean(profile?.photoUrl) || Boolean(photoAssetId)}
          uploadPublicPhoto={uploadPublicPhoto}
          profileBusy={profileBusy}
          profileMsg={profileMsg}
          saveProfile={saveProfile}
        />
      </div>
    );
  }

  if (!canBrowse) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-error/40 bg-error/5 p-5 text-sm text-text">
          <p className="font-bold">Dating is unavailable for this profile.</p>
          <p className="mt-1 text-text-gray">
            {profile.status === 'REJECTED'
              ? 'Your dating profile was not approved. You can review the reason and contact support.'
              : profile.status === 'SUSPENDED'
                ? 'Your dating profile is suspended. Contact support if you need help.'
                : kycStatus === 'REJECTED'
                  ? 'Your identity check was not approved. You can review the note and try again.'
                  : 'Please complete the required checks to continue.'}
          </p>
          {kyc?.decisionReason || kyc?.infoRequestMessage ? (
            <p className="mt-2 rounded-lg bg-white p-3 text-error">
              {kyc.infoRequestMessage || kyc.decisionReason}
            </p>
          ) : null}
        </div>
        <SetupPanel
          kycStatus={kycStatus}
          kyc={kyc}
          kycStep={kycStep}
          setKycStep={setKycStep}
          docType={docType}
          setDocType={setDocType}
          docNumber={docNumber}
          setDocNumber={setDocNumber}
          consent={consent}
          setConsent={setConsent}
          documentKey={documentKey}
          setDocumentKey={setDocumentKey}
          faceKeys={faceKeys}
          kycBusy={kycBusy}
          kycError={kycError}
          kycNotice={kycNotice}
          uploadKycFile={uploadKycFile}
          setFaceKeys={setFaceKeys}
          submitKyc={submitKyc}
          nickname={nickname}
          setNickname={setNickname}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          gender={gender}
          setGender={setGender}
          lookingFor={lookingFor}
          setLookingFor={setLookingFor}
          about={about}
          setAbout={setAbout}
          profileCity={profileCity}
          setProfileCity={setProfileCity}
          photoBusy={photoBusy}
          hasPhoto={Boolean(profile.photoUrl) || Boolean(photoAssetId)}
          uploadPublicPhoto={uploadPublicPhoto}
          profileBusy={profileBusy}
          profileMsg={profileMsg}
          saveProfile={saveProfile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-custom bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('discover')}
            className={pillClass(tab === 'discover')}
          >
            Discover
          </button>
          <button
            type="button"
            onClick={() => setTab('matches')}
            className={pillClass(tab === 'matches')}
          >
            Matches
            {canInteract && conversations.length > 0
              ? ` (${conversations.length})`
              : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('likes')}
            className={pillClass(tab === 'likes')}
          >
            Likes{liked.length > 0 ? ` (${liked.length})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={pillClass(tab === 'profile')}
          >
            Your profile
          </button>
        </div>
        <span className="text-xs font-semibold text-text-gray">
          {profile.nickname} · {profile.age}
          {profile.verified ? ' · Verified' : ''}
        </span>
      </div>

      {!canInteract ? (
        <div className="rounded-xl border border-border-custom bg-background-primary p-3 text-sm text-text-gray">
          Your profile is still under review. You can browse, but messaging
          unlocks after approval.
        </div>
      ) : null}

      {tab === 'discover' ? (
        <DiscoverTab
          profiles={profiles}
          loading={profilesQuery.isLoading}
          error={profilesQuery.isError}
          refetch={profilesQuery.refetch}
          hasNextPage={Boolean(profilesQuery.hasNextPage)}
          fetchingNext={profilesQuery.isFetchingNextPage}
          fetchNext={() => profilesQuery.fetchNextPage()}
          showMe={effectiveShowMe}
          setShowMe={setShowMe}
          filterCity={filterCity}
          setFilterCity={setFilterCity}
          liked={likeIds}
          toggleLike={toggleLike}
          skip={skip}
          canInteract={canInteract}
          startChat={startChat}
        />
      ) : tab === 'matches' ? (
        <MatchesTab
          conversations={conversations}
          loading={conversationsQuery.isLoading}
          canInteract={canInteract}
        />
      ) : tab === 'likes' ? (
        <LikesTab
          liked={liked}
          unlike={unlike}
          canInteract={canInteract}
          startChat={startChat}
        />
      ) : (
        <ProfileTab
          profile={profile}
          onToggleHidden={toggleHidden}
          onDelete={deleteProfile}
        />
      )}
    </div>
  );
}

function SetupPanel({
  kycStatus,
  kyc,
  kycStep,
  setKycStep,
  docType,
  setDocType,
  docNumber,
  setDocNumber,
  consent,
  setConsent,
  documentKey,
  setDocumentKey,
  faceKeys,
  kycBusy,
  kycError,
  kycNotice,
  uploadKycFile,
  setFaceKeys,
  submitKyc,
  nickname,
  setNickname,
  birthYear,
  setBirthYear,
  gender,
  setGender,
  lookingFor,
  setLookingFor,
  about,
  setAbout,
  profileCity,
  setProfileCity,
  photoBusy,
  hasPhoto,
  uploadPublicPhoto,
  profileBusy,
  profileMsg,
  saveProfile,
}: {
  kycStatus: string;
  kyc: ReturnType<typeof useMyDatingKyc>['data'];
  kycStep: 1 | 2 | 3;
  setKycStep: (step: 1 | 2 | 3) => void;
  docType: DatingDocumentType;
  setDocType: (value: DatingDocumentType) => void;
  docNumber: string;
  setDocNumber: (value: string) => void;
  consent: boolean;
  setConsent: (value: boolean) => void;
  documentKey: string;
  setDocumentKey: (value: string) => void;
  faceKeys: [string, string, string];
  kycBusy: boolean;
  kycError: string | null;
  kycNotice: string | null;
  uploadKycFile: (file: File, onKey: (key: string) => void) => void;
  setFaceKeys: Dispatch<SetStateAction<[string, string, string]>>;
  submitKyc: () => void;
  nickname: string;
  setNickname: (value: string) => void;
  birthYear: number;
  setBirthYear: (value: number) => void;
  gender: DatingGender;
  setGender: (value: DatingGender) => void;
  lookingFor: DatingLookingFor;
  setLookingFor: (value: DatingLookingFor) => void;
  about: string;
  setAbout: (value: string) => void;
  profileCity: string;
  setProfileCity: (value: string) => void;
  photoBusy: boolean;
  hasPhoto: boolean;
  uploadPublicPhoto: (file: File) => void;
  profileBusy: boolean;
  profileMsg: string | null;
  saveProfile: () => void;
}) {
  const kycDone = kycStatus === 'PENDING' || kycStatus === 'APPROVED';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-primaryLight px-3 py-1 text-xs font-bold text-primary">
          Identity status: {kycStatus.replace(/_/g, ' ')}
        </span>
        <h2 className="mt-2 text-xl font-black text-text">
          {kycDone
            ? 'Your identity check is complete'
            : 'Verify your identity to start dating'}
        </h2>
        <p className="mt-1 text-sm text-text-gray">
          Your ID and face photos are stored privately, are never shown to other
          members, and are deleted 30 days after review.
        </p>

        {kyc?.decisionReason || kyc?.infoRequestMessage ? (
          <div className="mt-4 rounded-xl border border-error/40 bg-error/5 p-3 text-sm text-error">
            {kyc.infoRequestMessage || kyc.decisionReason}
          </div>
        ) : null}

        {kycNotice ? (
          <p className="mt-4 rounded-lg bg-background-primary p-3 text-sm text-text">
            {kycNotice}
          </p>
        ) : null}

        {!kycDone ? (
          <div className="mt-5 space-y-5 border-t border-border-custom pt-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {[
                { s: 1 as const, label: '1. ID details and consent' },
                { s: 2 as const, label: '2. ID document photo' },
                { s: 3 as const, label: '3. Three face checks' },
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
                    Government ID type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) =>
                      setDocType(e.target.value as DatingDocumentType)
                    }
                    className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
                  >
                    {DOC_TYPES.map((doc) => (
                      <option key={doc.value} value={doc.value}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-text">
                    Document number
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. GHA-123456789-0"
                    className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
                  />
                  <p className="mt-1 text-xs text-text-gray">
                    Your ID number is never shown to other members.
                  </p>
                </div>
                <label className="flex items-start gap-2 text-sm text-text-gray md:col-span-2">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    I consent to Willfinditt checking my ID and three face
                    photos for safety and age verification.
                  </span>
                </label>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    disabled={docNumber.trim().length < 5 || !consent}
                    onClick={() => setKycStep(2)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Next: upload ID photo
                  </button>
                </div>
              </div>
            ) : kycStep === 2 ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border-custom p-4">
                  <p className="text-sm font-bold text-text">
                    Government ID photo
                  </p>
                  <p className="mt-1 text-xs text-text-gray">
                    Upload a clear photo of the front of your selected ID.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadKycFile(file, setDocumentKey);
                    }}
                    className="mt-2 block w-full text-xs text-text-gray"
                  />
                  {documentKey ? (
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      ID photo attached
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
                    Next: three face photos
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {[
                    '1. Straight-on face photo',
                    '2. Slight head turn',
                    '3. Clear selfie in good light',
                  ].map((label, index) => (
                    <div
                      key={label}
                      className="rounded-xl border border-border-custom p-4"
                    >
                      <p className="text-sm font-bold text-text">{label}</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            uploadKycFile(file, (key) =>
                              setFaceKeys((previous) => {
                                const next = [...previous] as [
                                  string,
                                  string,
                                  string,
                                ];
                                next[index] = key;
                                return next;
                              })
                            );
                          }
                        }}
                        className="mt-2 block w-full text-xs text-text-gray"
                      />
                      {faceKeys[index] ? (
                        <p className="mt-1 text-xs font-semibold text-green-600">
                          Face photo attached
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
                    onClick={submitKyc}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {kycBusy ? 'Submitting…' : 'Submit identity check'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-text">Your dating profile</h3>
        <p className="mt-1 text-sm text-text-gray">
          Use a nickname that does not reveal your real name. Only your
          nickname, approximate age, city, about text, and public photo are
          visible to other members.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-text">
              Dating nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. SunnyAma"
              className="w-full rounded-lg border border-border-custom bg-background px-3 py-2 text-sm text-text"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-text">
              Birth year (18+ only, never shown publicly)
            </label>
            <input
              type="number"
              min={1925}
              max={new Date().getFullYear() - 18}
              value={birthYear}
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
          <CityPicker
            value={profileCity}
            onChange={setProfileCity}
            label="City (optional)"
          />
          <div>
            <label className="mb-1 block text-xs font-bold text-text">
              Public dating photo (required)
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={photoBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPublicPhoto(file);
              }}
              className="w-full text-xs text-text-gray disabled:opacity-50"
            />
            {photoBusy ? (
              <p className="mt-1 text-xs text-text-gray">Uploading…</p>
            ) : hasPhoto || profileMsg === 'Public photo attached.' ? (
              <p className="mt-1 text-xs text-green-600">Photo attached</p>
            ) : (
              <p className="mt-1 text-xs text-text-gray">
                A public photo is required to publish your profile.
              </p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-bold text-text">
              About you
            </label>
            <textarea
              rows={3}
              value={about}
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
            disabled={profileBusy || photoBusy || !hasPhoto}
            onClick={saveProfile}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {profileBusy ? 'Saving…' : 'Save dating profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  liked,
  onLike,
  onSkip,
  onMessage,
  canInteract,
}: {
  profile: DatingPublicProfile;
  liked: boolean;
  onLike: () => void;
  onSkip?: () => void;
  onMessage: () => void;
  canInteract: boolean;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border-custom bg-white shadow-sm">
      <div className="relative h-56 w-full bg-primaryLight">
        {profile.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={profile.nickname}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-black text-primary">
            {profile.nickname.slice(0, 1).toUpperCase()}
          </div>
        )}
        {profile.verified ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-green-700 shadow-sm">
            Verified
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-text">
              {profile.nickname}, {profile.age}
            </h3>
            <p className="mt-0.5 text-xs text-text-gray">
              {GENDER_LABELS[profile.gender]} ·{' '}
              {LOOKING_FOR_LABELS[profile.lookingFor]}
              {profile.city ? ` · ${profile.city.name}` : ''}
            </p>
          </div>
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-text-gray">
          {profile.about || 'No introduction yet.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-custom pt-3">
          <button
            type="button"
            onClick={onLike}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
              liked
                ? 'border-primary bg-primaryLight text-primary'
                : 'border-border-custom text-text hover:border-primary hover:text-primary'
            }`}
          >
            {liked ? 'Liked · Unlike' : 'Like'}
          </button>
          {onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg border border-border-custom px-3 py-1.5 text-xs font-bold text-text-gray hover:border-text hover:text-text"
            >
              Skip
            </button>
          ) : null}
          <button
            type="button"
            onClick={onMessage}
            disabled={!canInteract}
            title={
              canInteract
                ? undefined
                : 'Messaging unlocks after your profile is approved.'
            }
            className="ml-auto rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Message
          </button>
        </div>
      </div>
    </article>
  );
}

function DiscoverTab({
  profiles,
  loading,
  error,
  refetch,
  hasNextPage,
  fetchingNext,
  fetchNext,
  showMe,
  setShowMe,
  filterCity,
  setFilterCity,
  liked,
  toggleLike,
  skip,
  canInteract,
  startChat,
}: {
  profiles: DatingPublicProfile[];
  loading: boolean;
  error: boolean;
  refetch: () => void;
  hasNextPage: boolean;
  fetchingNext: boolean;
  fetchNext: () => void;
  showMe: DatingLookingFor;
  setShowMe: (value: DatingLookingFor) => void;
  filterCity: string;
  setFilterCity: (value: string) => void;
  liked: Set<string>;
  toggleLike: (profile: DatingPublicProfile) => void;
  skip: (profileId: string) => void;
  canInteract: boolean;
  startChat: (profile: DatingPublicProfile) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-xs font-bold text-text">Show me</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'ANYONE' as const, label: 'Anyone' },
              { value: 'WOMAN' as const, label: 'Women' },
              { value: 'MAN' as const, label: 'Men' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setShowMe(item.value)}
                className={pillClass(showMe === item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-[220px] flex-1">
          <CityPicker
            value={filterCity}
            onChange={setFilterCity}
            label="Filter by city"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-text-gray">Loading profiles…</p>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-error">Could not load profiles.</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      ) : !profiles.length ? (
        <div className="rounded-2xl border border-dashed border-border-custom bg-white py-14 text-center">
          <p className="font-semibold text-text">No profiles yet</p>
          <p className="mt-1 text-sm text-text-gray">
            {filterCity
              ? 'No profiles in this city match your preferences yet.'
              : 'No profiles match your preferences yet. Check back soon.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              liked={liked.has(profile.id)}
              onLike={() => toggleLike(profile)}
              onSkip={() => skip(profile.id)}
              onMessage={() => startChat(profile)}
              canInteract={canInteract}
            />
          ))}
        </div>
      )}

      <LoadMore
        show={hasNextPage}
        loading={fetchingNext}
        onClick={fetchNext}
      />
    </div>
  );
}

function MatchesTab({
  conversations,
  loading,
  canInteract,
}: {
  conversations: {
    id: string;
    peerProfile: DatingPublicProfile | null;
    unreadCount: number;
    updatedAt: string;
  }[];
  loading: boolean;
  canInteract: boolean;
}) {
  if (!canInteract) {
    return (
      <div className="rounded-2xl border border-border-custom bg-white p-8 text-center text-text-gray">
        <p className="font-semibold text-text">Matches unlock after approval</p>
        <p className="mt-1 text-sm">
          Keep browsing while your profile is being reviewed.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="py-12 text-center text-text-gray">Loading matches…</p>;
  }

  if (!conversations.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-custom bg-white p-8 text-center">
        <p className="font-semibold text-text">No matches yet</p>
        <p className="mt-1 text-sm text-text-gray">
          Start a conversation from Discover and your matches will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border-custom overflow-hidden rounded-2xl border border-border-custom bg-white">
      {conversations.map((conversation) => {
        const peer = conversation.peerProfile;
        return (
          <Link
            key={conversation.id}
            href={`/messages/dating/${conversation.id}`}
            className="flex items-center gap-3 p-4 hover:bg-background-primary"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primaryLight">
              {peer?.photoUrl ? (
                <img
                  src={peer.photoUrl}
                  alt={peer.nickname}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-lg font-bold text-primary">
                  {(peer?.nickname ?? 'D').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-text">
                {peer?.nickname ?? 'Dating member'}
              </p>
              <p className="truncate text-xs text-text-gray">
                {conversation.unreadCount > 0
                  ? `${conversation.unreadCount} new message${
                      conversation.unreadCount > 1 ? 's' : ''
                    }`
                  : 'Dating conversation'}
              </p>
            </div>
            <span className="text-xs text-text-gray">
              {new Date(conversation.updatedAt).toLocaleDateString()}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function LikesTab({
  liked,
  unlike,
  canInteract,
  startChat,
}: {
  liked: LikedProfile[];
  unlike: (profileId: string) => void;
  canInteract: boolean;
  startChat: (profile: DatingPublicProfile) => void;
}) {
  if (!liked.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-custom bg-white p-8 text-center">
        <p className="font-semibold text-text">No likes yet</p>
        <p className="mt-1 text-sm text-text-gray">
          Profiles you like from Discover will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {liked.map(({ profile }) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          liked
          onLike={() => unlike(profile.id)}
          onMessage={() => startChat(profile)}
          canInteract={canInteract}
        />
      ))}
    </div>
  );
}

function ProfileTab({
  profile,
  onToggleHidden,
  onDelete,
}: {
  profile: {
    nickname: string;
    age: number;
    about: string | null;
    status: string;
    photoUrl: string | null;
    city?: { name: string } | null;
  };
  onToggleHidden: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="max-w-2xl rounded-2xl border border-border-custom bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-primaryLight">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.nickname}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xl font-bold text-primary">
              {profile.nickname.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-black text-text">
            {profile.nickname}, {profile.age}
          </h3>
          <p className="text-sm text-text-gray">
            Status: {profile.status.replace(/_/g, ' ')}
            {profile.city ? ` · ${profile.city.name}` : ''}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-text-gray">
        {profile.about || 'No about text set.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-border-custom pt-4">
        <button
          type="button"
          onClick={onToggleHidden}
          className="rounded-lg border border-border-custom px-4 py-2 text-xs font-bold text-text hover:bg-background-primary"
        >
          {profile.status === 'HIDDEN'
            ? 'Show my dating profile'
            : 'Hide my dating profile'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-error px-4 py-2 text-xs font-bold text-error hover:bg-error/5"
        >
          Delete dating profile
        </button>
      </div>
    </div>
  );
}

export function DatingPageClient() {
  return (
    <SectionGate section="dating">
      {() => (
        <div className="min-h-screen bg-background">
          <section className="border-b border-border-custom bg-gradient-to-br from-primary/10 via-background to-background-primary/40">
            <div className="container mx-auto px-4 py-8">
              <Link
                href="/community"
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
              >
                ← Back to Community
              </Link>
              <h1 className="mt-1 text-3xl font-black text-text">Dating</h1>
              <p className="mt-1 text-sm text-text-gray">
                Discover verified members and keep your conversations in
                Messages.
              </p>
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
