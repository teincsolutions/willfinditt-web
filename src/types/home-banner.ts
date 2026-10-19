export interface HomeBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  backgroundColor: string;
  textColor: string;
  imageOverlay: boolean;
  primaryCtaLabel?: string | null;
  primaryCtaUrl?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaUrl?: string | null;
  altText?: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
