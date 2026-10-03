/**
 * Google Sign-In configuration.
 *
 * NEXT_PUBLIC_* vars are baked into the JS bundle at `next build` time, so a
 * missing value here means the deployment was built without the
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID secret/build-arg — it cannot be fixed at
 * runtime. Callers must hide Google buttons when unconfigured instead of
 * sending an empty client_id to Google (Error 400: invalid_request).
 */
export const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const isGoogleSignInConfigured = googleClientId.length > 0;

if (!isGoogleSignInConfigured && process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google Sign-In buttons are hidden.'
  );
}
