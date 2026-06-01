import type { Context } from "hono";

/** Best-effort client IP for rate limiting, honoring reverse-proxy headers. */
export function clientIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "anonymous"
  );
}

// Behind a reverse proxy the real public host/scheme arrive in the
// x-forwarded-* headers; the plain Host is the internal upstream. Prefer the
// forwarded values so the slug prefix and copy links use the real domain.
export function baseUrl(c: Context): string {
  const host =
    c.req.header("x-forwarded-host") ?? c.req.header("host") ?? "localhost:3000";
  const proto =
    c.req.header("x-forwarded-proto")?.split(",")[0].trim() ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
