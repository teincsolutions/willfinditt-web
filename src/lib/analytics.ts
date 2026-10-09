/**
 * Central analytics abstraction for WillfindITT web.
 *
 * Fans out typed marketplace events to GA4 (gtag) and Meta Pixel (fbq).
 * Both vendors load only when their ID is configured AND the visitor has
 * granted tracking consent (see CookieConsent + Consent Mode v2 defaults
 * in AnalyticsScripts). All helpers are safe no-ops on server / when
 * unconfigured, so this code ships dormant until IDs are added to env:
 *
 *   NEXT_PUBLIC_GA_ID=G-...            (Google Analytics 4)
 *   NEXT_PUBLIC_META_PIXEL_ID=...      (Meta Pixel)
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type ConsentChoice = 'granted' | 'declined';
const CONSENT_KEY = 'wf-tracking-consent';

export function getConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(CONSENT_KEY);
  return v === 'granted' || v === 'declined' ? v : null;
}

export function setConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_KEY, choice);
  const granted = choice === 'granted';
  window.gtag?.('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
  });
}

function pushGtag(event: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !GA_ID || !window.gtag) return;
  window.gtag('event', event, params || {});
}

function pushFbq(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === 'undefined' || !PIXEL_ID || !window.fbq) return;
  if (eventId) {
    window.fbq('track', event, params || {}, { eventID: eventId });
  } else {
    window.fbq('track', event, params || {});
  }
}

/** Generic marketplace events, mapped per-vendor below. */
export type AnalyticsEvent =
  | 'view_item' // ad detail viewed
  | 'view_item_list' // category / search results viewed
  | 'search' // search submitted
  | 'sign_up' // registration completed
  | 'login' // sign-in completed
  | 'lead' // contact reveal / chat started
  | 'post_ad' // ad published
  | 'purchase'; // boost / promotion checkout completed

export interface EventParams {
  /** Ad/listing id */
  itemId?: string;
  itemName?: string;
  category?: string;
  price?: number;
  currency?: string;
  searchTerm?: string;
  method?: string; // sign_up/login method: email, google, phone
  value?: number; // purchase amount
  /** Raw email/phone — sent to OUR api only, hashed server-side for CAPI. */
  email?: string;
  phone?: string;
}

const FB_EVENT_MAP: Record<AnalyticsEvent, string> = {
  view_item: 'ViewContent',
  view_item_list: 'ViewContent',
  search: 'Search',
  sign_up: 'CompleteRegistration',
  login: 'Login', // custom event (Meta has no standard login event)
  lead: 'Lead',
  post_ad: 'PostAd', // custom event
  purchase: 'Purchase',
};

/**
 * High-value events also relayed server-side via our API → Meta CAPI.
 * The shared eventId lets Meta deduplicate against the browser Pixel hit.
 */
const CAPI_RELAY: Partial<Record<AnalyticsEvent, string>> = {
  sign_up: 'CompleteRegistration',
  lead: 'Lead',
  post_ad: 'PostAd',
  purchase: 'Purchase',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function relayToCapi(
  event: AnalyticsEvent,
  eventId: string,
  params: EventParams,
): void {
  const capiEvent = CAPI_RELAY[event];
  if (!capiEvent || !API_URL || typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      eventName: capiEvent,
      eventId,
      eventSourceUrl: window.location.href,
      contentId: params.itemId,
      contentCategory: params.category,
      value: params.value ?? params.price,
      currency: params.currency || 'GHS',
      email: params.email,
      phone: params.phone,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${API_URL}/events`,
        new Blob([body], { type: 'application/json' }),
      );
    } else {
      void fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      });
    }
  } catch {
    // Tracking must never break the user flow.
  }
}

/**
 * Track a marketplace event in GA4 + Meta Pixel.
 * Safe no-op when vendors aren't loaded (no IDs / no consent / SSR).
 */
export function trackEvent(
  event: AnalyticsEvent,
  params?: EventParams,
): void {
  const {
    itemId,
    itemName,
    category,
    price,
    currency = 'GHS',
    searchTerm,
    method,
    value,
  } = params || {};

  // Shared dedup id for browser Pixel + server CAPI of the same action.
  const eventId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  pushGtag(event, {
    ...(itemId && { items: [{ item_id: itemId, item_name: itemName, item_category: category, price }] }),
    ...(searchTerm && { search_term: searchTerm }),
    ...(method && { method }),
    ...(value !== undefined && { value, currency }),
    ...(price !== undefined && value === undefined && { value: price, currency }),
  });

  pushFbq(
    FB_EVENT_MAP[event],
    {
      ...(itemId && { content_ids: [itemId], content_name: itemName, content_category: category, content_type: 'product' }),
      ...(searchTerm && { search_string: searchTerm }),
      ...(value !== undefined && { value, currency }),
      ...(price !== undefined && value === undefined && { value, currency: 'GHS' }),
    },
    // eventID enables dedup against the server-side CAPI relay below.
    CAPI_RELAY[event] ? eventId : undefined,
  );

  relayToCapi(event, eventId, params || {});
}

/** Track an SPA page view in both vendors (called on route change). */
export function trackPageView(path: string): void {
  pushGtag('page_view', { page_path: path });
  if (
    typeof window !== 'undefined' &&
    PIXEL_ID &&
    typeof window.fbq === 'function'
  ) {
    window.fbq('track', 'PageView');
  }
}
