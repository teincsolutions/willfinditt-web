// Community sections. Mirrors willfind8-api modules feature-flags,
// event-notices and lost-found (plan v3, Phase 1).

export type SectionKey = 'event_notices' | 'lost_found' | 'dating';
export type SectionState = 'ON' | 'READ_ONLY' | 'SHUTDOWN' | 'OFF';

export interface SectionFlag {
  key: SectionKey;
  state: SectionState;
  bannerMessage: string | null;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CityRef {
  id: string;
  name: string;
}

/** Listing period rules from form-config (shared by all sections). */
export interface ListingRules {
  choices: number[];
  defaultDays: number;
  minDays: number;
  maxDays: number;
  purgeAfterDays: number;
}

/** How long to list a post: a choice of days or a custom end date. */
export interface ListingPeriodInput {
  listingDays?: number;
  listUntil?: string;
}

export interface FieldRule {
  required: boolean;
  min?: number;
  max?: number;
}

/** A private community image: an upload result or an image on a post. */
export interface CommunityImage {
  /** On uploads and on the owner's own posts (needed to edit). */
  assetId?: string;
  /** Short-lived signed link; null if it could not be made. */
  url: string | null;
}

// --- Events & Notices -------------------------------------------------------

/** Key of an admin-managed notice type, e.g. FUNERAL, WEDDING. */
export type EventType = string;
export type ImageRole = 'DECEASED_PHOTO' | 'POSTER' | 'GALLERY';
export type Visibility = 'PUBLIC' | 'UNLISTED';

export interface EventImage extends CommunityImage {
  role: ImageRole;
  sortOrder: number;
}

export interface EventPost {
  id: string;
  eventType: EventType;
  /** Readable name of the type, from the admin-managed list. */
  eventTypeLabel?: string;
  title: string;
  body: string;
  eventAt: string | null;
  venue: string | null;
  city: CityRef | null;
  visibility: Visibility;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  images: EventImage[];
  profile: { id: string; displayName: string; photoUrl: string | null };
  /** Only on the owner's own posts. */
  status?: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'EXPIRED';
}

export interface EventProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  about: string | null;
  /** Public profiles: whether there is a number to reveal. */
  hasPhone?: boolean;
  /** Only on the owner's own profile (others use the reveal). */
  phone1?: string | null;
  phone2?: string | null;
  /** Only on the owner's own profile, to keep or replace the photo. */
  photoMediaId?: string | null;
  city: CityRef | null;
  createdAt: string;
  status?: 'ACTIVE' | 'SUSPENDED';
}

export interface EventFormConfig {
  eventTypes: {
    value: EventType;
    label: string;
    description?: string | null;
    imageRoles: ImageRole[];
  }[];
  imageRoles: { value: ImageRole; label: string; max: number }[];
  visibility: {
    default: Visibility;
    options: { value: Visibility; label: string }[];
  };
  listing: ListingRules;
  fields: {
    title: FieldRule;
    body: FieldRule;
    venue: FieldRule;
  };
  profile: {
    displayName: FieldRule;
    about: FieldRule;
  };
}

export interface EventPostInput extends ListingPeriodInput {
  eventType: EventType;
  title: string;
  body: string;
  eventAt?: string;
  venue?: string;
  cityId?: string;
  visibility?: Visibility;
  images?: { role: ImageRole; assetId: string }[];
}

/** Partial update: fields left out are kept; null clears. */
export interface EventProfileInput {
  displayName?: string;
  photoAssetId?: string | null;
  about?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  cityId?: string | null;
}

// --- Lost & Found -----------------------------------------------------------

export type LostFoundKind = 'LOST' | 'FOUND';

export interface LostFoundPost {
  id: string;
  kind: LostFoundKind;
  /** Key of an admin-managed category, e.g. ITEM, PET. */
  category: string;
  categoryLabel?: string;
  title: string;
  body: string;
  place: string | null;
  happenedAt: string | null;
  posterName: string;
  /** The owner marked it resolved (item returned / owner found). */
  resolved: boolean;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  images: (CommunityImage & { sortOrder: number })[];
  hasPhone: boolean;
  city: CityRef | null;
  /** Only on the owner's own posts. */
  status?: 'ACTIVE' | 'RESOLVED' | 'SUSPENDED' | 'REJECTED' | 'EXPIRED';
  phone?: string | null;
}

export interface LostFoundFormConfig {
  categories: { value: string; label: string; description?: string | null }[];
  listing: ListingRules;
  fields: {
    title: FieldRule;
    body: FieldRule;
    place: FieldRule;
    posterName: FieldRule;
    images: FieldRule;
  };
}

export interface LostFoundInput extends ListingPeriodInput {
  kind: LostFoundKind;
  category?: string;
  title: string;
  body: string;
  place?: string;
  happenedAt?: string;
  cityId?: string;
  phone?: string;
  posterName: string;
  /** Asset ids from /community/media, in display order. */
  images?: string[];
}

// --- Love & Dating (Phase 2 — matches willfind8-api dating module) ---------

export type DatingGender = 'MAN' | 'WOMAN';
export type DatingLookingFor = 'MAN' | 'WOMAN' | 'ANYONE';
export type DatingProfileStatus =
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'HIDDEN'
  | 'REJECTED'
  | 'SUSPENDED';

export type DatingKycStatus =
  | 'PENDING'
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'REJECTED';

export type DatingDocumentType =
  | 'NATIONAL_ID'
  | 'DRIVERS_LICENSE'
  | 'PASSPORT';

export interface DatingFormConfig {
  genders: { value: DatingGender; label: string }[];
  lookingFor: { value: DatingLookingFor; label: string }[];
  profile: {
    nickname: FieldRule;
    birthYear: { required: boolean; minAge: number; note: string };
    about: FieldRule;
    photo: { required: boolean; upload: string };
  };
  kyc: {
    upload: string;
    facePhotosCount: number;
    retentionDays: number;
    documentTypes: { value: DatingDocumentType; label: string }[];
  };
  post: {
    title: FieldRule;
    body: FieldRule;
  };
  listing: ListingRules;
}

export interface DatingPublicProfile {
  id: string;
  nickname: string;
  age: number;
  gender: DatingGender;
  lookingFor: DatingLookingFor;
  about: string | null;
  city: CityRef | null;
  photoUrl: string | null;
  verified: boolean;
  createdAt: string;
}

export interface DatingMyProfile extends DatingPublicProfile {
  birthYear: number;
  photoMediaId: string | null;
  status: DatingProfileStatus;
  kycStatus: DatingKycStatus | null;
}

export interface DatingPost {
  id: string;
  title: string;
  body: string;
  city: CityRef | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  profile: DatingPublicProfile;
  status?: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'EXPIRED';
}

export interface DatingKycState {
  id: string;
  documentType: DatingDocumentType;
  status: DatingKycStatus;
  consentAt: string;
  submittedAt: string;
  reviewedAt: string | null;
  decisionReason: string | null;
  infoRequestMessage: string | null;
  isAdult: boolean | null;
  ageBand: string | null;
  imagesPurgedAt: string | null;
}

export interface DatingKycSubmitInput {
  consent: boolean;
  documentType: DatingDocumentType;
  documentNumber: string;
  documentKey: string;
  faceKeys: [string, string, string];
}

export interface DatingProfileInput {
  nickname?: string;
  birthYear?: number;
  gender?: DatingGender;
  lookingFor?: DatingLookingFor;
  about?: string | null;
  photoAssetId?: string | null;
  cityId?: string | null;
  hidden?: boolean;
}

export interface DatingPostInput extends ListingPeriodInput {
  title: string;
  body: string;
  cityId?: string;
}

export interface DatingConversation {
  id: string;
  /** Null for conversations started directly from a dating profile. */
  post: { id: string; title: string } | null;
  peerProfile: DatingPublicProfile | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatingMessage {
  id: string;
  conversationId: string;
  isMine: boolean;
  senderProfile: {
    id: string;
    nickname: string;
    photoUrl: string | null;
  } | null;
  type: 'TEXT' | 'IMAGE' | 'PHONE_SHARE';
  text: string;
  imageUrl: string | null;
  readAt: string | null;
  createdAt: string;
}
