import app from "./app.js";
import { runKeepalive } from "./routes/keepalive.js";

// Cloudflare Workers entry. Hono runs natively here — no OpenNext adapter. The
// KV namespace (CUT_KV) and ADMIN_PASSWORD arrive on `env` per request and are
// read via Hono's context storage (see lib/store, lib/env).
type ExecutionContextLike = { waitUntil(p: Promise<unknown>): void };

export default {
  fetch: app.fetch,

  // Optional cron (only fires if wrangler.jsonc declares triggers.crons).
  // Harmless on KV, which never archives; kept for parity with the Vercel cron.
  scheduled(_event: unknown, env: Record<string, unknown>, ctx: ExecutionContextLike) {
    ctx.waitUntil(runKeepalive(env));
  },
};
