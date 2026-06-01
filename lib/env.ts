import { getContext } from "hono/context-storage";

/**
 * Reads a string config value, abstracting over where each host keeps it:
 *   - Cloudflare Workers → request `env` bindings (secrets/vars live on `c.env`,
 *     NOT `process.env`).
 *   - Node / Vercel      → `process.env`.
 *
 * Used for values that must work on every host (ADMIN_PASSWORD, CRON_SECRET).
 * The store-backend env vars (REDIS_URL, UPSTASH_*) are only ever read on the
 * hosts where they live in `process.env`, so they don't need this.
 */
export function envVar(key: string): string | undefined {
  try {
    const v = (getContext().env as Record<string, unknown> | undefined)?.[key];
    if (typeof v === "string") return v;
  } catch {
    // Not inside a request with contextStorage() mounted — fall through.
  }
  return process.env[key];
}
