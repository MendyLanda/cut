import type { Child } from "hono/jsx";
import {
  ArrowUpDown,
  Lock,
  Clock,
  Hash,
  MousePointerClick,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
} from "./icons.js";
import { linkStatus, type LinkWithMeta, type LinkStatus } from "../../lib/links.js";

export type Filter = "all" | LinkStatus;
export type Sort = "newest" | "oldest" | "clicks";

const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  clicks: "Most clicks",
};

// Format an absolute time in UTC as a server-side fallback; public/app.js
// replaces [data-time] spans with the same instant in the browser's timezone.
function fmtUtc(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(ms));
}

export function LinkList({
  links,
  base,
  filter,
  sort,
}: {
  links: LinkWithMeta[];
  base: string;
  filter: Filter;
  sort: Sort;
}) {
  const counts = { all: links.length, active: 0, expired: 0, maxed: 0 };
  for (const l of links) counts[linkStatus(l, l.clicks)]++;

  const visible = (filter === "all" ? links : links.filter((l) => linkStatus(l, l.clicks) === filter))
    .slice()
    .sort((a, b) => {
      if (sort === "clicks") return b.clicks - a.clicks;
      if (sort === "oldest") return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

  // Always offer All + Active; surface Expired/Maxed only once they exist.
  const tabs: Filter[] = ["all", "active"];
  if (counts.expired) tabs.push("expired");
  if (counts.maxed) tabs.push("maxed");

  return (
    <div>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter links" class="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <a
              role="tab"
              aria-selected={filter === t ? "true" : "false"}
              href={`/admin?filter=${t}&sort=${sort}`}
              class={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === t
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {t}
              <span class="font-mono tabular-nums opacity-70">{counts[t]}</span>
            </a>
          ))}
        </div>

        <form method="get" action="/admin" class="inline-flex items-center gap-1.5 text-xs text-muted">
          <input type="hidden" name="filter" value={filter} />
          <ArrowUpDown size={13} />
          <label class="sr-only" for="sort">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            data-autosubmit
            class="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <option value={s} selected={sort === s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </form>
      </div>

      {visible.length === 0 ? (
        <div class="rounded-2xl border border-dashed border-border p-10 text-center">
          <p class="text-sm text-muted">No {filter === "all" ? "" : filter} links.</p>
        </div>
      ) : (
        <ul class="space-y-3">
          {visible.map((link) => (
            <LinkRow link={link} base={base} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LinkRow({ link, base }: { link: LinkWithMeta; base: string }) {
  const status = linkStatus(link, link.clicks);
  const shortUrl = `${base}/${link.slug}`;
  const dead = status !== "active";

  return (
    <li class="rounded-xl border border-border bg-surface/60 p-4 backdrop-blur-sm transition-colors hover:border-muted/40">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <a
              href={`/${link.slug}`}
              target="_blank"
              rel="noreferrer"
              class={`inline-flex items-center gap-1 font-mono text-sm font-semibold hover:text-accent ${
                dead ? "text-muted line-through" : ""
              }`}
            >
              /{link.slug}
              <ExternalLink size={12} class="opacity-50" />
            </a>
            {link.passwordHash ? <Badge icon={<Lock size={11} />}>password</Badge> : null}
            {link.expiresAt ? (
              <Badge icon={<Clock size={11} />} tone={status === "expired" ? "danger" : "default"}>
                {status === "expired" ? (
                  "expired"
                ) : (
                  <span data-time={String(link.expiresAt)}>{fmtUtc(link.expiresAt)}</span>
                )}
              </Badge>
            ) : null}
            {link.maxClicks ? (
              <Badge icon={<Hash size={11} />} tone={status === "maxed" ? "danger" : "default"}>
                {link.clicks}/{link.maxClicks}
              </Badge>
            ) : null}
          </div>
          <p class="mt-1.5 truncate font-mono text-xs text-muted" title={link.url}>
            {link.url}
          </p>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
        <span class="inline-flex items-center gap-1.5 text-xs text-muted">
          <MousePointerClick size={13} />
          <span class="font-mono tabular-nums">{link.clicks}</span>
          {link.clicks === 1 ? "click" : "clicks"}
        </span>
        <div class="flex items-center gap-1">
          <button
            type="button"
            data-copy={shortUrl}
            aria-label="Copy link"
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors duration-150 cursor-pointer hover:bg-surface-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Copy size={14} /> Copy
          </button>
          <a
            href={`/admin/links/${link.slug}/edit`}
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Pencil size={14} /> Edit
          </a>
          <form
            method="post"
            action={`/admin/links/${link.slug}/delete`}
            data-confirm={`Delete /${link.slug}? This can't be undone.`}
            class="inline-flex"
          >
            <button
              type="submit"
              aria-label={`Delete /${link.slug}`}
              class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
            >
              <Trash2 size={14} /> Delete
            </button>
          </form>
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
  icon: Child;
  children: Child;
  tone?: "default" | "danger";
}) {
  return (
    <span
      class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        tone === "danger" ? "bg-danger/10 text-danger" : "bg-surface-2 text-muted"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}
