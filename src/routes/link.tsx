import { Hono } from "hono";
import { getLink, getClicks, linkStatus, consumeClick } from "../../lib/store/index.js";
import { hashPassword } from "../../lib/auth.js";
import { allowUnlockAttempt } from "../../lib/ratelimit.js";
import { clientIp } from "../util.js";
import { Layout } from "../views/layout.js";
import { ExpiredPage, MaxedPage, PasswordPage } from "../views/slug.js";
import { NotFoundPage } from "../views/not-found.js";

export const link = new Hono();

// GET /:slug — resolve a short link. Renders a status card when it can't
// redirect (missing / expired / maxed / password-gated), else 302s to the URL.
link.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const rec = await getLink(slug);
  if (!rec) {
    return c.html(
      <Layout title="Link not found — Cut">
        <NotFoundPage />
      </Layout>,
      404,
    );
  }

  const status = linkStatus(rec, await getClicks(slug));
  if (status === "expired") {
    return c.html(
      <Layout title="Link expired — Cut">
        <ExpiredPage />
      </Layout>,
    );
  }
  if (status === "maxed") {
    return c.html(
      <Layout title="Link inactive — Cut">
        <MaxedPage />
      </Layout>,
    );
  }

  // Password-gated: render the unlock form instead of redirecting.
  if (rec.passwordHash) {
    return c.html(
      <Layout title="Protected link — Cut">
        <PasswordPage slug={slug} error={c.req.query("error")} />
      </Layout>,
    );
  }

  // Open link: count the click and send them on their way.
  if (!(await consumeClick(slug, rec))) {
    return c.html(
      <Layout title="Link inactive — Cut">
        <MaxedPage />
      </Layout>,
    );
  }
  return c.redirect(rec.url);
});

// POST /:slug/unlock — verify a per-link password, count the click, redirect.
link.post("/:slug/unlock", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.parseBody();
  const password = String(body.password ?? "");

  if (!(await allowUnlockAttempt(clientIp(c), slug))) {
    return c.redirect(`/${slug}?error=ratelimited`);
  }

  const rec = await getLink(slug);
  if (!rec) return c.redirect(`/${slug}`);
  if (linkStatus(rec, await getClicks(slug)) !== "active") return c.redirect(`/${slug}`);
  if (!rec.passwordHash || rec.passwordHash !== hashPassword(password)) {
    return c.redirect(`/${slug}?error=invalid`);
  }
  if (!(await consumeClick(slug, rec))) return c.redirect(`/${slug}`);
  return c.redirect(rec.url);
});
