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

// --- Events & Notices -------------------------------------------------------

/** Key of an admin-managed notice type, e.g. FUNERAL, WEDDING. */
export type EventType = string;
export type ImageRole = 'DECEASED_PHOTO' | 'POSTER' | 'GALLERY';
export type Visibility = 'PUBLIC' | 'UNLISTED';

export interface EventImage {
  role: ImageRole;
  url: string;
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
  status?: 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
}

export interface EventProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  about: string | null;
  phone1: string | null;
  phone2: string | null;
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
}

export interface EventPostInput {
  eventType: EventType;
  title: string;
  body: string;
  eventAt?: string;
  venue?: string;
  cityId?: string;
  visibility?: Visibility;
  images?: { role: ImageRole; url: string }[];
}

export interface EventProfileInput {
  displayName: string;
  photoUrl?: string;
  about?: string;
  phone1?: string;
  phone2?: string;
  cityId?: string;
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
  posterName: string | null;
  status: 'ACTIVE' | 'RESOLVED' | 'SUSPENDED' | 'REJECTED';
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  images: { url: string; sortOrder: number }[];
  hasPhone: boolean;
  city: CityRef | null;
  /** Only on the owner's own posts. */
  phone?: string | null;
}

export interface LostFoundFormConfig {
  categories: { value: string; label: string; description?: string | null }[];
}

export interface LostFoundInput {
  kind: LostFoundKind;
  category?: string;
  title: string;
  body: string;
  place?: string;
  happenedAt?: string;
  cityId?: string;
  phone?: string;
  posterName?: string;
  images?: string[];
}
