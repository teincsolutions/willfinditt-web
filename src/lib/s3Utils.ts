export function convertS3UrlToSignedRequest(url: string): string {
  const withoutScheme = url.replace(/^s3:\/\//, "");
  const [bucketWithPrefix, ...pathParts] = withoutScheme.split("/");
  const bucket = bucketWithPrefix.split("-").slice(1).join("-");
  return `/upload/signed-url/${bucket}/${pathParts.join("/")}`;
}
