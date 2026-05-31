"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { linkStatus, type LinkWithMeta, type LinkStatus } from "@/lib/links";
import { LinkRow } from "./link-row";

type Filter = "all" | LinkStatus;
type Sort = "newest" | "oldest" | "clicks";

const SORT_LABELS: Record<Sort, string> = {
  newest: "Newest",
  oldest: "Oldest",
  clicks: "Most clicks",
};

export function LinkList({
  links,
  base,
  eventualConsistency = false,
}: {
  links: LinkWithMeta[];
  base: string;
  eventualConsistency?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const counts = useMemo(() => {
    const c = { all: links.length, active: 0, expired: 0, maxed: 0 };
    for (const l of links) c[linkStatus(l, l.clicks)]++;
    return c;
  }, [links]);

  const visible = useMemo(() => {
    const arr = filter === "all" ? links : links.filter((l) => linkStatus(l, l.clicks) === filter);
    return [...arr].sort((a, b) => {
      if (sort === "clicks") return b.clicks - a.clicks;
      if (sort === "oldest") return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
  }, [links, filter, sort]);

  // Always offer All + Active; only surface Expired/Maxed once they exist.
  const tabs: Filter[] = ["all", "active"];
  if (counts.expired) tabs.push("expired");
  if (counts.maxed) tabs.push("maxed");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter links" className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={filter === t}
              onClick={() => setFilter(t)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                filter === t
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-2 text-muted hover:text-foreground"
              }`}
            >
              {t}
              <span className="font-mono tabular-nums opacity-70">{counts[t]}</span>
            </button>
          ))}
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs text-muted">
          <ArrowUpDown size={13} aria-hidden />
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted">No {filter === "all" ? "" : filter} links.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((link) => (
            <LinkRow
              key={link.slug}
              link={link}
              base={base}
              eventualConsistency={eventualConsistency}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
