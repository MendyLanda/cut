import { Redis } from "@upstash/redis";

// The Upstash Redis integration from the Vercel Marketplace injects
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. We also fall back to the
// KV_REST_API_* names in case the store was connected under the legacy KV slug.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "",
});

// `links` holds slug -> LinkRecord (stored as JSON; @upstash/redis serializes
// objects automatically). `clicks` is a separate counter hash so we can
// HINCRBY atomically for click limits.
export const LINKS_KEY = "links";
export const CLICKS_KEY = "clicks";

export type LinkRecord = {
  url: string;
  createdAt: number; // epoch ms
  passwordHash?: string | null; // sha256 hex when the link is gated
  expiresAt?: number | null; // epoch ms; link dies after this time
  maxClicks?: number | null; // link dies after this many clicks
};

export type LinkWithMeta = LinkRecord & { slug: string; clicks: number };

export type LinkStatus = "active" | "expired" | "maxed";

function parseRecord(raw: LinkRecord | string): LinkRecord {
  // Older versions stored a bare URL string; treat those as un-gated links.
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as LinkRecord;
    } catch {
      return { url: raw, createdAt: 0 };
    }
  }
  return raw;
}

export async function getLink(slug: string): Promise<LinkRecord | null> {
  const raw = await redis.hget<LinkRecord | string>(LINKS_KEY, slug);
  return raw == null ? null : parseRecord(raw);
}

export async function getClicks(slug: string): Promise<number> {
  return Number((await redis.hget<number>(CLICKS_KEY, slug)) ?? 0);
}

export async function listLinks(): Promise<LinkWithMeta[]> {
  const [links, clicks] = await Promise.all([
    redis.hgetall<Record<string, LinkRecord | string>>(LINKS_KEY),
    redis.hgetall<Record<string, number>>(CLICKS_KEY),
  ]);
  if (!links) return [];
  return Object.entries(links)
    .map(([slug, raw]) => {
      const rec = parseRecord(raw);
      return { slug, clicks: Number(clicks?.[slug] ?? 0), ...rec };
    })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function linkStatus(rec: LinkRecord, clicks: number): LinkStatus {
  if (rec.expiresAt && Date.now() > rec.expiresAt) return "expired";
  if (rec.maxClicks && clicks >= rec.maxClicks) return "maxed";
  return "active";
}

/**
 * Atomically counts a click, rolling back if it would exceed the cap.
 * Returns true when the click is allowed (and now counted).
 */
export async function consumeClick(slug: string, rec: LinkRecord): Promise<boolean> {
  const newCount = await redis.hincrby(CLICKS_KEY, slug, 1);
  if (rec.maxClicks && newCount > rec.maxClicks) {
    await redis.hincrby(CLICKS_KEY, slug, -1);
    return false;
  }
  return true;
}
