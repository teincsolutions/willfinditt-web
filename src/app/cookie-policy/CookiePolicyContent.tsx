'use client';

import { OPEN_COOKIE_SETTINGS_EVENT } from '@/components/CookieConsent';

function openSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}

/**
 * Hardcoded (not CMS-driven) so it always exists — the consent banner,
 * footer and privacy policy link here.
 */
export function CookiePolicyContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-text tracking-tight mb-4 text-center">
          Cookie Policy
        </h1>
        <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
        <p className="text-center text-text-gray mt-4">
          Last updated: October 2026
        </p>
      </div>

      <div className="space-y-8 text-text-gray leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-text mb-2">
            1. What are cookies?
          </h2>
          <p>
            Cookies are small text files stored on your device when you visit
            WillfindITT. They help the site remember you, keep you signed in,
            and — only with your permission — measure usage and show relevant
            ads.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">
            2. Strictly-necessary cookies (always on)
          </h2>
          <p>
            These are required for the site to work and need no consent under
            the Ghana Data Protection Act, 2012 (Act 843):
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Authentication/session tokens that keep you signed in.</li>
            <li>Security cookies (CSRF protection, abuse prevention).</li>
            <li>Load-balancing and your cookie-consent choice itself.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">
            3. Analytics cookies (your choice)
          </h2>
          <p>
            With your consent we use <strong>Google Analytics 4</strong> to
            understand anonymous, aggregated usage (pages visited, searches
            made) so we can improve WillfindITT. IP addresses are truncated
            and no advertising identifiers are collected by us. Retention: up
            to 14 months. Provider: Google LLC (data may be processed outside
            Ghana).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">
            4. Marketing & ads cookies (your choice)
          </h2>
          <p>
            With your consent we measure our advertising campaigns and show
            relevant ads on other platforms. Key actions (such as signup,
            contacting a seller, or posting an ad) may also be shared with
            our advertising partners through server-side measurement using a
            shared event id for deduplication. Retention is governed by the
            applicable advertising partner&apos;s cookie policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">
            5. Manage your preferences
          </h2>
          <p>
            You can change or withdraw consent at any time — the site keeps
            working either way:
          </p>
          <button
            type="button"
            onClick={openSettings}
            className="mt-3 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Open cookie settings
          </button>
          <p className="mt-3">
            You can also block cookies in your browser settings, though
            strictly-necessary functions (like sign-in) will stop working.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-text mb-2">
            6. Your rights & contact
          </h2>
          <p>
            Under the Data Protection Act, 2012 you may request access to,
            correction or deletion of your personal data. See our{' '}
            <a href="/privacy-policy" className="underline">
              Privacy Policy
            </a>{' '}
            or contact us via the details listed there.
          </p>
        </section>
      </div>
    </div>
  );
}
