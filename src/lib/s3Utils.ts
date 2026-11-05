export function convertS3UrlToSignedRequest(url: string): string {
  const withoutScheme = url.replace(/^s3:\/\//, "");
  const [bucketWithPrefix, ...pathParts] = withoutScheme.split("/");
  const bucket = bucketWithPrefix.split("-").slice(1).join("-");
  return `/upload/signed-url/${bucket}/${pathParts.join("/")}`;
}

/**
 * `s3://` keys are private: turning one into a viewable URL calls the signed-url
 * API, which needs a login. Don't call it for logged-out visitors, because a 401
 * sends them to the login page.
 */
export function needsSignedUrl(url?: string | null): boolean {
  return Boolean(url?.startsWith("s3://"));
}
