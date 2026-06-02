import { Hono } from "hono";
import { getStore } from "../../lib/store/index.js";
import { envVar } from "../../lib/env.js";

export const keepalive = new Hono();

/**
 * Keeps the storage backend warm. Upstash archives free databases after ~14
 * days of inactivity (a PING doesn't count), so we run a real write. On Vercel a
 * daily Cron hits this (see vercel.json); on Cloudflare the Worker's scheduled
 * handler calls runKeepalive() directly. Harmless on KV (it doesn't archive).
 */
keepalive.get("/api/keepalive", async (c) => {
  // When CRON_SECRET is set, the platform attaches it as a Bearer token to cron
  // requests. Require it if present; otherwise stay open (still harmless).
  const secret = envVar("CRON_SECRET");
  if (secret && c.req.header("authorization") !== `Bearer ${secret}`) {
    return c.text("Unauthorized", 401);
  }
  await (await getStore()).touch();
  return c.json({ ok: true });
});

/** Used by the Cloudflare `scheduled` handler, which has no HTTP context. */
export async function runKeepalive(env?: Record<string, unknown>): Promise<void> {
  await (await getStore(env)).touch();
}
