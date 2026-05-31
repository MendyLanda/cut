"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  redis,
  LINKS_KEY,
  CLICKS_KEY,
  getLink,
  getClicks,
  linkStatus,
  consumeClick,
  type LinkRecord,
} from "@/lib/redis";
import { isAuthed, signIn, signOut, hashPassword } from "@/lib/auth";
import { allowLoginAttempt, allowUnlockAttempt } from "@/lib/ratelimit";

// Paths that must never be used as a slug (they are real routes).
const RESERVED = new Set(["admin", "api", "_next", "favicon.ico"]);

// Unambiguous base32-ish alphabet (no 0/1/o/l/i).
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

function randomSlug(len = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let slug = "";
  for (const b of bytes) slug += ALPHABET[b % ALPHABET.length];
  return slug;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "anonymous";
}

export async function loginAction(formData: FormData) {
  if (!(await allowLoginAttempt(await clientIp()))) redirect("/admin?error=ratelimited");
  const password = String(formData.get("password") ?? "");
  const ok = await signIn(password);
  redirect(ok ? "/admin" : "/admin?error=invalid");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin");
}

export type CreateState = {
  ok: boolean;
  slug?: string;
  error?: string;
};

export async function createLinkAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  if (!(await isAuthed())) return { ok: false, error: "Not signed in." };

  let url = String(formData.get("url") ?? "").trim();
  let slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();

  if (!url) return { ok: false, error: "Enter a destination URL." };
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (slug) {
    if (!/^[a-z0-9-]+$/.test(slug) || RESERVED.has(slug)) {
      return { ok: false, error: "Slug can only contain letters, numbers and dashes." };
    }
    if (await redis.hexists(LINKS_KEY, slug)) {
      return { ok: false, error: `"${slug}" is already taken.` };
    }
  } else {
    do {
      slug = randomSlug();
    } while (await redis.hexists(LINKS_KEY, slug));
  }

  const password = String(formData.get("password") ?? "").trim();
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const maxClicksRaw = String(formData.get("maxClicks") ?? "").trim();

  let expiresAt: number | null = null;
  if (expiresRaw) {
    const t = new Date(expiresRaw).getTime();
    if (Number.isNaN(t)) return { ok: false, error: "Invalid expiration date." };
    if (t <= Date.now()) return { ok: false, error: "Expiration must be in the future." };
    expiresAt = t;
  }

  let maxClicks: number | null = null;
  if (maxClicksRaw) {
    const n = Number(maxClicksRaw);
    if (!Number.isInteger(n) || n < 1) return { ok: false, error: "Click limit must be a positive whole number." };
    maxClicks = n;
  }

  const record: LinkRecord = {
    url,
    createdAt: Date.now(),
    passwordHash: password ? hashPassword(password) : null,
    expiresAt,
    maxClicks,
  };

  await redis.hset(LINKS_KEY, { [slug]: record });
  revalidatePath("/admin");
  return { ok: true, slug };
}

export async function deleteLinkAction(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin");
  const slug = String(formData.get("slug") ?? "");
  if (slug) {
    await redis.hdel(LINKS_KEY, slug);
    await redis.hdel(CLICKS_KEY, slug);
  }
  revalidatePath("/admin");
  redirect("/admin");
}

/** Verify a per-link password, then count the click and redirect. */
export async function unlockAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!(await allowUnlockAttempt(await clientIp(), slug))) {
    redirect(`/${slug}?error=ratelimited`);
  }

  const rec = await getLink(slug);
  if (!rec) redirect(`/${slug}`);

  if (linkStatus(rec, await getClicks(slug)) !== "active") redirect(`/${slug}`);

  if (!rec.passwordHash || rec.passwordHash !== hashPassword(password)) {
    redirect(`/${slug}?error=invalid`);
  }

  if (!(await consumeClick(slug, rec))) redirect(`/${slug}`);
  redirect(rec.url);
}
