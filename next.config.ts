import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) for the Docker image
  // used by the self-hosted Coolify/Dokploy templates. Gated behind a flag so it
  // never touches the Vercel or Cloudflare/OpenNext builds, which manage their
  // own output. The Dockerfile sets NEXT_OUTPUT_STANDALONE=1.
  output: process.env.NEXT_OUTPUT_STANDALONE ? "standalone" : undefined,
};

export default nextConfig;

// Lets `next dev` read the Cloudflare env/bindings from wrangler.jsonc. Gate it
// on development only — in a production build it would otherwise try to boot
// workerd/miniflare (which fails in a clean container, e.g. the Docker image).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
