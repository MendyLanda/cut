import { raw } from "hono/html";
import type { Child } from "hono/jsx";

const DEFAULT_TITLE = "Cut — a tiny, self-hosted URL shortener";
const DEFAULT_DESCRIPTION =
  "A tiny URL shortener you run yourself. Owner-only admin, with per-link passwords, expiries, and click limits. Deploy it anywhere — Vercel, Cloudflare, Railway, Render, Coolify, Dokploy, or Docker.";

// Geist (sans), Geist Mono, and Fraunces (display serif, italic + optical size)
// — the fonts the design uses, loaded from Google Fonts. The CSS variables they
// back (--font-geist-sans etc.) are declared in globals.css.
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap";

export function Layout({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: Child;
}) {
  return (
    <>
      {raw("<!DOCTYPE html>")}
      <html lang="en" class="h-full antialiased">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title ?? DEFAULT_TITLE}</title>
          <meta name="description" content={description ?? DEFAULT_DESCRIPTION} />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
          <link rel="stylesheet" href={FONTS_HREF} />
          <link rel="stylesheet" href="/assets/styles.css" />
          <script src="/app.js" defer></script>
        </head>
        <body class="min-h-dvh flex flex-col">{children}</body>
      </html>
    </>
  );
}
