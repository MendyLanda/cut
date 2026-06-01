import { getContext } from "hono/context-storage";
import type { Store } from "./types";
import type { KVNamespaceLike } from "./cloudflare-kv";
import { KvStore } from "./cloudflare-kv";
import { UpstashStore } from "./upstash";

// Re-export the shared link types/helpers so callers get everything from one
// place: import { getLink, linkStatus, type LinkRecord } from "@/lib/store".
export * from "../links";
export type { Store, StoreKind } from "./types";

// The binding name declared in wrangler.jsonc (kv_namespaces[].binding).
const KV_BINDING = "CUT_KV";

// Singletons; each holds its Redis client lazily, so importing them is cheap
// even on hosts where they're never used.
const upstash = new UpstashStore();
let redis: Store | undefined;

/**
 * Picks the storage backend for the current host, in priority order:
 *   1. Cloudflare Workers  → native KV binding is present on the request `env`.
 *   2. `REDIS_URL` is set  → Redis over TCP (Railway / Render / Fly / a VPS).
 *   3. Otherwise           → Upstash Redis over REST (Vercel, local dev).
 *
 * On Cloudflare the KV namespace arrives as a binding on the per-request `env`
 * (read via Hono's context storage). `envOverride` lets callers without an HTTP
 * context — namely the Cloudflare `scheduled` cron — pass the Worker env in.
 */
export async function getStore(envOverride?: Record<string, unknown>): Promise<Store> {
  let env = envOverride;
  if (!env) {
    try {
      env = getContext().env as Record<string, unknown> | undefined;
    } catch {
      // Not inside a request (e.g. module init) — fall through to env vars.
    }
  }
  const kv = env?.[KV_BINDING];
  if (kv) return new KvStore(kv as KVNamespaceLike);

  if (process.env.REDIS_URL) {
    // Dynamic import so ioredis (a Node-only TCP client) is never pulled into the
    // Cloudflare Worker bundle, where REDIS_URL is unset and this branch is dead.
    const { RedisStore } = await import("./redis");
    return (redis ??= new RedisStore());
  }
  return upstash;
}

// Thin convenience wrappers so read-side callers stay terse.
export async function getLink(slug: string) {
  return (await getStore()).getLink(slug);
}
export async function getClicks(slug: string) {
  return (await getStore()).getClicks(slug);
}
export async function listLinks() {
  return (await getStore()).listLinks();
}
export async function consumeClick(
  ...args: Parameters<Store["consumeClick"]>
) {
  return (await getStore()).consumeClick(...args);
}
