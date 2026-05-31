"use client";

import { useEffect, useState } from "react";
import {
  Lock,
  Clock,
  Hash,
  MousePointerClick,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { linkStatus, type LinkWithMeta } from "@/lib/links";
import { CopyButton } from "./copy-button";
import { DeleteButton } from "./delete-button";
import { LinkForm } from "./link-form";

export function LinkRow({
  link,
  base,
  eventualConsistency = false,
}: {
  link: LinkWithMeta;
  base: string;
  eventualConsistency?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const status = linkStatus(link, link.clicks);
  const shortUrl = `${base}/${link.slug}`;
  const dead = status !== "active";

  // Hide immediately on delete. The row is keyed by slug, so this local state
  // survives the server action's revalidation even if KV still returns the link
  // for a few seconds — no "I deleted it but it's still there" flicker.
  if (deleted) return null;

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
                {status === "expired" ? "expired" : <LocalTime ms={link.expiresAt} />}
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
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            aria-expanded={editing}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
          >
            <Pencil size={14} aria-hidden /> Edit
          </button>
          <DeleteButton slug={link.slug} onDeleted={() => setDeleted(true)} />
        </div>
      </div>

      {editing && (
        <div className="mt-4 border-t border-border/60 pt-4 animate-rise">
          <LinkForm
            base={base}
            mode="edit"
            link={link}
            eventualConsistency={eventualConsistency}
            onDone={() => setEditing(false)}
          />
        </div>
      )}
    </li>
  );
}

function LocalTime({ ms }: { ms: number }) {
  // Format on the client in the browser's timezone. Render empty on first paint
  // (server + client agree) then fill after mount to avoid hydration mismatch.
  const [s, setS] = useState("");
  useEffect(() => {
    setS(
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(ms)),
    );
  }, [ms]);
  return (
    <span suppressHydrationWarning>{s || "…"}</span>
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
        tone === "danger" ? "bg-danger/10 text-danger" : "bg-surface-2 text-muted"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}
