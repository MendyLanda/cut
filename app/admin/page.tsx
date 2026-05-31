import { headers } from "next/headers";
import {
  Lock,
  Clock,
  Hash,
  MousePointerClick,
  ExternalLink,
  ShieldAlert,
  LogOut,
  CircleAlert,
} from "lucide-react";
import { isAuthed, isConfigured } from "@/lib/auth";
import { listLinks, linkStatus, type LinkWithMeta } from "@/lib/redis";
import { loginAction, logoutAction } from "../actions";
import { Wordmark } from "@/components/wordmark";
import { CopyButton } from "@/components/copy-button";
import { DeleteButton } from "@/components/delete-button";
import { CreateLinkForm } from "@/components/create-link-form";
import { PasswordField } from "@/components/password-field";

export const dynamic = "force-dynamic";

const fmtDate = (ms: number) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = isConfigured();
  const authed = await isAuthed();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Wordmark />
        {authed && (
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer">
              <LogOut size={15} aria-hidden /> Sign out
            </button>
          </form>
        )}
      </header>

      <div className="mt-10">
        {!configured ? (
          <NotConfigured />
        ) : !authed ? (
          <Login error={error} />
        ) : (
          <Dashboard base={base} />
        )}
      </div>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="animate-rise rounded-2xl border border-warning/40 bg-warning/10 p-6">
      <div className="flex items-center gap-2 font-semibold text-warning">
        <ShieldAlert size={18} aria-hidden /> Not configured yet
      </div>
      <p className="mt-2 text-sm text-muted">
        Set the <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">ADMIN_PASSWORD</code>{" "}
        environment variable in your Vercel project, then redeploy.
      </p>
    </div>
  );
}

function Login({ error }: { error?: string }) {
  return (
    <div className="mx-auto max-w-sm animate-rise">
      <h1 className="font-display text-2xl italic tracking-tight">Owner sign-in</h1>
      <p className="mt-1 text-sm text-muted">Only you can create links.</p>

      {error && (
        <p
          role="alert"
          className="mt-5 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error === "ratelimited" ? <ShieldAlert size={15} /> : <CircleAlert size={15} />}
          {error === "ratelimited"
            ? "Too many attempts. Wait a minute and try again."
            : "Wrong password."}
        </p>
      )}

      <form action={loginAction} className="mt-5 space-y-4">
        <PasswordField name="password" label="Password" autoFocus required />
        <button className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 cursor-pointer">
          Sign in
        </button>
      </form>
    </div>
  );
}

async function Dashboard({ base }: { base: string }) {
  const links = await listLinks();

  return (
    <div className="animate-rise space-y-10">
      <section>
        <h1 className="font-display text-2xl italic tracking-tight">New link</h1>
        <p className="mb-4 mt-1 text-sm text-muted">
          Paste a URL. Add a password, expiry, or click limit if you need them.
        </p>
        <CreateLinkForm base={base} />
      </section>

      <section>
        <h2 className="mb-3 flex items-baseline gap-2 text-sm font-medium text-muted">
          Your links
          <span className="font-mono tabular-nums">({links.length})</span>
        </h2>
        {links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted">No links yet. Create your first one above.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => (
              <LinkRow key={link.slug} link={link} base={base} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LinkRow({ link, base }: { link: LinkWithMeta; base: string }) {
  const status = linkStatus(link, link.clicks);
  const shortUrl = `${base}/${link.slug}`;
  const dead = status !== "active";

  return (
    <li className="rounded-xl border border-border bg-surface/60 p-4 backdrop-blur-sm transition-colors hover:border-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/${link.slug}`}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-1 font-mono text-sm font-semibold hover:text-accent ${
                dead ? "text-muted line-through" : ""
              }`}
            >
              /{link.slug}
              <ExternalLink size={12} aria-hidden className="opacity-50" />
            </a>
            {link.passwordHash && <Badge icon={<Lock size={11} />}>password</Badge>}
            {link.expiresAt && (
              <Badge icon={<Clock size={11} />} tone={status === "expired" ? "danger" : "default"}>
                {status === "expired" ? "expired" : fmtDate(link.expiresAt)}
              </Badge>
            )}
            {link.maxClicks && (
              <Badge icon={<Hash size={11} />} tone={status === "maxed" ? "danger" : "default"}>
                {link.clicks}/{link.maxClicks}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 truncate font-mono text-xs text-muted" title={link.url}>
            {link.url}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <MousePointerClick size={13} aria-hidden />
          <span className="font-mono tabular-nums">{link.clicks}</span>
          {link.clicks === 1 ? "click" : "clicks"}
        </span>
        <div className="flex items-center gap-1">
          <CopyButton value={shortUrl} />
          <DeleteButton slug={link.slug} />
        </div>
      </div>
    </li>
  );
}

function Badge({
  icon,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        tone === "danger"
          ? "bg-danger/10 text-danger"
          : "bg-surface-2 text-muted"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}
