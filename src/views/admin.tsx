import type { Child } from "hono/jsx";
import {
  ShieldAlert,
  LogOut,
  CircleAlert,
  CheckCircle2,
  Copy,
  Info,
  X,
} from "./icons.js";
import { Wordmark } from "./wordmark.js";
import { LinkForm, type LinkFormValues } from "./link-form.js";
import { LinkList, type Filter, type Sort } from "./link-list.js";
import { PasswordField } from "./password-field.js";
import type { LinkWithMeta } from "../../lib/links.js";

/** Outer chrome shared by every admin view: header + (when authed) sign-out. */
export function AdminShell({ authed, children }: { authed: boolean; children: Child }) {
  return (
    <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <header class="flex items-center justify-between">
        <Wordmark />
        {authed ? (
          <form action="/admin/logout" method="post">
            <button class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        ) : null}
      </header>
      <div class="mt-10">{children}</div>
    </div>
  );
}

export function NotConfiguredView() {
  return (
    <div class="animate-rise rounded-2xl border border-warning/40 bg-warning/10 p-6">
      <div class="flex items-center gap-2 font-semibold text-warning">
        <ShieldAlert size={18} /> Not configured yet
      </div>
      <p class="mt-2 text-sm text-muted">
        Set the{" "}
        <code class="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code>{" "}
        environment variable, then redeploy.
      </p>
    </div>
  );
}

export function LoginView({ error }: { error?: string }) {
  return (
    <div class="mx-auto max-w-sm animate-rise">
      <h1 class="font-display text-2xl italic tracking-tight">Owner sign-in</h1>
      <p class="mt-1 text-sm text-muted">Only you can create links.</p>

      {error ? (
        <p
          role="alert"
          class="mt-5 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error === "ratelimited" ? <ShieldAlert size={15} /> : <CircleAlert size={15} />}
          {error === "ratelimited"
            ? "Too many attempts. Slow down and try again later."
            : "Wrong password."}
        </p>
      ) : null}

      <form action="/admin/login" method="post" class="mt-5 space-y-4">
        <PasswordField name="password" label="Password" autofocus required />
        <button class="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 cursor-pointer">
          Sign in
        </button>
      </form>
    </div>
  );
}

export function DashboardView({
  base,
  links,
  filter,
  sort,
  eventualConsistency,
  created,
  createError,
  createValues,
}: {
  base: string;
  links: LinkWithMeta[];
  filter: Filter;
  sort: Sort;
  eventualConsistency: boolean;
  created?: string;
  createError?: string;
  createValues?: LinkFormValues;
}) {
  return (
    <div class="animate-rise space-y-10">
      {eventualConsistency ? <ConsistencyBanner /> : null}
      {created ? (
        <CreatedBanner url={`${base}/${created}`} eventualConsistency={eventualConsistency} />
      ) : null}

      <section>
        <h1 class="font-display text-2xl italic tracking-tight">New link</h1>
        <p class="mb-4 mt-1 text-sm text-muted">
          Paste a URL. Add a password, expiry, or click limit if you need them.
        </p>
        <LinkForm
          base={base}
          mode="create"
          action="/admin/links"
          values={createValues}
          error={createError}
          eventualConsistency={eventualConsistency}
        />
      </section>

      <section>
        <h2 class="mb-3 flex items-baseline gap-2 text-sm font-medium text-muted">
          Your links
          <span class="font-mono tabular-nums">({links.length})</span>
        </h2>
        {links.length === 0 ? (
          <div class="rounded-2xl border border-dashed border-border p-10 text-center">
            <p class="text-sm text-muted">No links yet. Create your first one above.</p>
          </div>
        ) : (
          <LinkList links={links} base={base} filter={filter} sort={sort} />
        )}
      </section>
    </div>
  );
}

/** Shown after a successful create. app.js auto-copies the URL on load. */
function CreatedBanner({ url, eventualConsistency }: { url: string; eventualConsistency: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-created-banner
      data-url={url}
      class="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 animate-rise"
    >
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <CheckCircle2 size={18} class="text-accent" />
        <span class="text-sm font-medium" data-created-label>
          Short link created
        </span>
        <code class="rounded bg-surface/70 px-2 py-1 font-mono text-xs">{url}</code>
        <div class="ml-auto flex items-center gap-1">
          <button
            type="button"
            data-copy={url}
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      </div>
      {eventualConsistency ? (
        <p class="mt-2 pl-[26px] text-xs text-muted">
          It may take a few seconds to appear in the list below (Cloudflare KV).
        </p>
      ) : null}
    </div>
  );
}

/**
 * One-time FYI shown only on eventually-consistent KV. app.js hides it after
 * the first view (localStorage) so it never nags, and the × dismisses it early.
 */
function ConsistencyBanner() {
  return (
    <div
      role="note"
      data-consistency-banner
      hidden
      class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm animate-rise"
    >
      <Info size={16} class="shrink-0 text-warning" />
      <p class="min-w-0 flex-1 text-foreground/90">
        This deployment uses <span class="font-medium">Cloudflare KV</span>, which is{" "}
        <span class="font-medium">eventually consistent</span>: changes save instantly, but the
        list below can take a few seconds to catch up.
      </p>
      <button
        type="button"
        data-dismiss-banner
        aria-label="Dismiss notice"
        class="ml-auto rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Dedicated edit page (replaces the React inline row-edit). */
export function EditView({
  base,
  slug,
  values,
  hasPassword,
  clicks,
  error,
  eventualConsistency,
}: {
  base: string;
  slug: string;
  values: LinkFormValues;
  hasPassword: boolean;
  clicks: number;
  error?: string;
  eventualConsistency: boolean;
}) {
  return (
    <div class="animate-rise">
      <h1 class="font-display text-2xl italic tracking-tight">
        Edit <span class="font-mono not-italic text-accent">/{slug}</span>
      </h1>
      <p class="mb-5 mt-1 text-sm text-muted">Change the destination, slug, or protection.</p>
      <LinkForm
        base={base}
        mode="edit"
        action={`/admin/links/${slug}`}
        values={values}
        hasPassword={hasPassword}
        clicks={clicks}
        error={error}
        eventualConsistency={eventualConsistency}
      />
    </div>
  );
}
