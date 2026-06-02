import { getContext } from "hono/context-storage";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createHash } from "node:crypto";
import { envVar } from "./env.js";

const COOKIE = "auth";

// True when the request reached us over HTTPS — directly or via a TLS-terminating
// reverse proxy (Traefik/nginx/Caddy), which forward the original scheme in
// `x-forwarded-proto`. We can't key the cookie's Secure flag off NODE_ENV: a
// production image served over plain HTTP (common for self-hosted/LAN setups)
// would set Secure, and the browser would silently drop the cookie — so sign-in
// would never stick.
function isHttps(): boolean {
  const proto = getContext().req.header("x-forwarded-proto");
  return proto?.split(",")[0].trim() === "https";
}

// The cookie never stores the password itself — only a hash of it. On every
// request we recompute the hash from ADMIN_PASSWORD and compare.
function token(): string {
  const pw = envVar("ADMIN_PASSWORD") ?? "";
  return createHash("sha256").update(pw).digest("hex");
}

/** True only when ADMIN_PASSWORD is set and the request carries a valid cookie. */
export function isAuthed(): boolean {
  if (!envVar("ADMIN_PASSWORD")) return false;
  return getCookie(getContext(), COOKIE) === token();
}

/** Returns true and sets the auth cookie when the password matches. */
export function signIn(password: string): boolean {
  const expected = envVar("ADMIN_PASSWORD");
  if (!expected || password !== expected) return false;
  setCookie(getContext(), COOKIE, token(), {
    httpOnly: true,
    secure: isHttps(),
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return true;
}

export function signOut(): void {
  deleteCookie(getContext(), COOKIE, { path: "/" });
}

/** Whether the app is configured at all (password set). */
export function isConfigured(): boolean {
  return Boolean(envVar("ADMIN_PASSWORD"));
}

/** Hash used for per-link passwords (never stores the plaintext). */
export function hashPassword(pw: string): string {
  return createHash("sha256").update(pw).digest("hex");
}
