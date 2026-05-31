// Pure link helpers + types — no Redis import, so client components can use
// these without pulling the server-only Redis client into the bundle.

export type LinkRecord = {
  url: string;
  createdAt: number; // epoch ms
  passwordHash?: string | null; // sha256 hex when the link is gated
  expiresAt?: number | null; // epoch ms (absolute); link dies after this time
  maxClicks?: number | null; // link dies after this many clicks
};

export type LinkWithMeta = LinkRecord & { slug: string; clicks: number };

export type LinkStatus = "active" | "expired" | "maxed";

export function linkStatus(rec: Pick<LinkRecord, "expiresAt" | "maxClicks">, clicks: number): LinkStatus {
  if (rec.expiresAt && Date.now() > rec.expiresAt) return "expired";
  if (rec.maxClicks && clicks >= rec.maxClicks) return "maxed";
  return "active";
}
