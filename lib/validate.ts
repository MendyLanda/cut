// Pure validation + slug helpers shared by the admin routes. No request/runtime
// dependencies, so they're trivially testable and host-agnostic.

// Paths that must never be used as a slug (they are real routes / static files).
export const RESERVED = new Set([
  "admin",
  "api",
  "favicon.ico",
  "app.js",
  "assets",
  "robots.txt",
]);

// Unambiguous base32-ish alphabet (no 0/1/o/l/i).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

export function randomSlug(len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let slug = "";
  for (const b of bytes) slug += ALPHABET[b % ALPHABET.length];
  return slug;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && !RESERVED.has(slug);
}

type Ok<T> = { value: T };
type Err = { error: string };
type Result<T> = Ok<T> | Err;

export function isErr<T>(r: Result<T>): r is Err {
  return "error" in r;
}

/** Normalizes a destination URL, defaulting to https:// and validating it. */
export function normalizeUrl(raw: string): Result<string> {
  let url = raw.trim();
  if (!url) return { error: "Enter a destination URL." };
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    return { error: "That doesn't look like a valid URL." };
  }
  return { value: url };
}

// The client sends `expiresAt` as an absolute epoch (ms) so the value is
// timezone-correct regardless of the server's (UTC) clock.
export function parseExpiry(raw: string): Result<number | null> {
  const v = raw.trim();
  if (!v) return { value: null };
  const t = Number(v);
  if (!Number.isFinite(t) || t <= 0) return { error: "Invalid expiration date." };
  if (t <= Date.now()) return { error: "Expiration must be in the future." };
  return { value: t };
}

export function parseMaxClicks(raw: string): Result<number | null> {
  const v = raw.trim();
  if (!v) return { value: null };
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) {
    return { error: "Click limit must be a positive whole number." };
  }
  return { value: n };
}
