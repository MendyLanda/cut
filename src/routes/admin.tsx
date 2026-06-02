import { Hono } from "hono";
import type { Context } from "hono";
import { Layout } from "../views/layout.js";
import {
  AdminShell,
  NotConfiguredView,
  LoginView,
  DashboardView,
  EditView,
} from "../views/admin.js";
import type { Filter, Sort } from "../views/link-list.js";
import type { LinkFormValues } from "../views/link-form.js";
import { isAuthed, isConfigured, signIn, signOut, hashPassword } from "../../lib/auth.js";
import { getStore, getLink, type LinkRecord } from "../../lib/store/index.js";
import { allowLoginAttempt } from "../../lib/ratelimit.js";
import {
  isValidSlug,
  randomSlug,
  normalizeUrl,
  parseExpiry,
  parseMaxClicks,
  isErr,
} from "../../lib/validate.js";
import { clientIp, baseUrl } from "../util.js";

export const admin = new Hono();

type Body = Record<string, string | File>;

function str(body: Body, key: string): string {
  const v = body[key];
  return typeof v === "string" ? v : "";
}
function has(body: Body, key: string): boolean {
  return body[key] !== undefined;
}
function num(v: string): number | null {
  const n = Number(v);
  return v.trim() && Number.isFinite(n) ? n : null;
}

function parseFilter(v?: string): Filter {
  return v === "active" || v === "expired" || v === "maxed" ? v : "all";
}
function parseSort(v?: string): Sort {
  return v === "oldest" || v === "clicks" ? v : "newest";
}

// ─────────────────────────────── Auth ───────────────────────────────

admin.post("/admin/login", async (c) => {
  if (!(await allowLoginAttempt(clientIp(c)))) return c.redirect("/admin?error=ratelimited");
  const body = (await c.req.parseBody()) as Body;
  return c.redirect(signIn(str(body, "password")) ? "/admin" : "/admin?error=invalid");
});

admin.post("/admin/logout", (c) => {
  signOut();
  return c.redirect("/admin");
});

// ────────────────────────────── Dashboard ───────────────────────────

/** Render the full admin page (chrome + the right inner view). */
async function renderDashboard(
  c: Context,
  opts: { createError?: string; createValues?: LinkFormValues } = {},
) {
  const base = baseUrl(c);
  const store = await getStore();
  const links = await store.listLinks();
  return c.html(
    <Layout title="Admin — Cut">
      <AdminShell authed={true}>
        <DashboardView
          base={base}
          links={links}
          filter={parseFilter(c.req.query("filter"))}
          sort={parseSort(c.req.query("sort"))}
          eventualConsistency={store.kind === "cloudflare-kv"}
          created={c.req.query("created")}
          createError={opts.createError}
          createValues={opts.createValues}
        />
      </AdminShell>
    </Layout>,
  );
}

admin.get("/admin", async (c) => {
  if (!isConfigured()) {
    return c.html(
      <Layout title="Admin — Cut">
        <AdminShell authed={false}>
          <NotConfiguredView />
        </AdminShell>
      </Layout>,
    );
  }
  if (!isAuthed()) {
    return c.html(
      <Layout title="Admin — Cut">
        <AdminShell authed={false}>
          <LoginView error={c.req.query("error")} />
        </AdminShell>
      </Layout>,
    );
  }
  return renderDashboard(c);
});

// ──────────────────────────── Create link ───────────────────────────

admin.post("/admin/links", async (c) => {
  if (!isAuthed()) return c.redirect("/admin");
  const body = (await c.req.parseBody()) as Body;

  // Echo what was typed back into the form if validation fails.
  const values: LinkFormValues = {
    url: str(body, "url"),
    slug: str(body, "slug"),
    expiresAt: num(str(body, "expiresAt")),
    maxClicks: num(str(body, "maxClicks")),
  };
  const fail = (error: string) => renderDashboard(c, { createError: error, createValues: values });

  const url = normalizeUrl(str(body, "url"));
  if (isErr(url)) return fail(url.error);

  const store = await getStore();
  let slug = str(body, "slug").trim().toLowerCase();
  if (slug) {
    if (!isValidSlug(slug)) {
      return fail("Slug can only contain letters, numbers and dashes.");
    }
    if (await store.hasLink(slug)) return fail(`"${slug}" is already taken.`);
  } else {
    do {
      slug = randomSlug();
    } while (await store.hasLink(slug));
  }

  const expiry = parseExpiry(str(body, "expiresAt"));
  if (isErr(expiry)) return fail(expiry.error);
  const limit = parseMaxClicks(str(body, "maxClicks"));
  if (isErr(limit)) return fail(limit.error);

  const password = str(body, "password").trim();
  const record: LinkRecord = {
    url: url.value,
    createdAt: Date.now(),
    passwordHash: password ? hashPassword(password) : null,
    expiresAt: expiry.value,
    maxClicks: limit.value,
  };
  await store.putLink(slug, record);
  return c.redirect(`/admin?created=${slug}`);
});

// ───────────────────────────── Edit link ────────────────────────────

admin.get("/admin/links/:slug/edit", async (c) => {
  if (!isAuthed()) return c.redirect("/admin");
  const slug = c.req.param("slug");
  const store = await getStore();
  const rec = await getLink(slug);
  if (!rec) return c.redirect("/admin");
  const clicks = await store.getClicks(slug);

  return c.html(
    <Layout title={`Edit /${slug} — Cut`}>
      <AdminShell authed={true}>
        <EditView
          base={baseUrl(c)}
          slug={slug}
          values={{
            url: rec.url,
            slug,
            expiresAt: rec.expiresAt ?? null,
            maxClicks: rec.maxClicks ?? null,
          }}
          hasPassword={Boolean(rec.passwordHash)}
          clicks={clicks}
          eventualConsistency={store.kind === "cloudflare-kv"}
        />
      </AdminShell>
    </Layout>,
  );
});

admin.post("/admin/links/:slug", async (c) => {
  if (!isAuthed()) return c.redirect("/admin");
  const originalSlug = c.req.param("slug");
  const store = await getStore();
  const rec = await getLink(originalSlug);
  if (!rec) return c.redirect("/admin");

  const body = (await c.req.parseBody()) as Body;
  const clicks = await store.getClicks(originalSlug);
  const values: LinkFormValues = {
    url: str(body, "url"),
    slug: str(body, "slug"),
    expiresAt: num(str(body, "expiresAt")),
    maxClicks: num(str(body, "maxClicks")),
  };
  const fail = (error: string) =>
    c.html(
      <Layout title={`Edit /${originalSlug} — Cut`}>
        <AdminShell authed={true}>
          <EditView
            base={baseUrl(c)}
            slug={originalSlug}
            values={values}
            hasPassword={Boolean(rec.passwordHash)}
            clicks={clicks}
            error={error}
            eventualConsistency={store.kind === "cloudflare-kv"}
          />
        </AdminShell>
      </Layout>,
    );

  const url = normalizeUrl(str(body, "url"));
  if (isErr(url)) return fail(url.error);

  const slug = str(body, "slug").trim().toLowerCase();
  if (!slug) return fail("Slug can't be empty.");
  if (!isValidSlug(slug)) return fail("Slug can only contain letters, numbers and dashes.");

  const renamed = slug !== originalSlug;
  if (renamed && (await store.hasLink(slug))) return fail(`"${slug}" is already taken.`);

  const expiry = parseExpiry(str(body, "expiresAt"));
  if (isErr(expiry)) return fail(expiry.error);
  const limit = parseMaxClicks(str(body, "maxClicks"));
  if (isErr(limit)) return fail(limit.error);

  // Password: blank keeps the current one; "remove" clears it; otherwise set new.
  const password = str(body, "password").trim();
  let passwordHash = rec.passwordHash ?? null;
  if (has(body, "removePassword")) passwordHash = null;
  else if (password) passwordHash = hashPassword(password);

  const resetClicks = has(body, "resetClicks");
  const next: LinkRecord = {
    url: url.value,
    createdAt: rec.createdAt ?? Date.now(),
    passwordHash,
    expiresAt: expiry.value,
    maxClicks: limit.value,
  };

  await store.putLink(slug, next);
  if (renamed) {
    const carried = resetClicks ? 0 : await store.getClicks(originalSlug);
    await store.deleteLink(originalSlug); // removes old record + its clicks
    if (carried > 0) await store.setClicks(slug, carried);
  } else if (resetClicks) {
    await store.resetClicks(slug);
  }
  return c.redirect("/admin");
});

// ──────────────────────────── Delete link ───────────────────────────

admin.post("/admin/links/:slug/delete", async (c) => {
  if (!isAuthed()) return c.redirect("/admin");
  const slug = c.req.param("slug");
  if (slug) await (await getStore()).deleteLink(slug);
  return c.redirect("/admin");
});
