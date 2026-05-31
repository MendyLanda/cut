"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, RefreshCw, X } from "lucide-react";

/**
 * Cloudflare KV is eventually consistent: a write is saved immediately, but a
 * read right after can still return the old value, so a freshly created/edited
 * link may not show up in the list for a few seconds. This hook lets a mutation
 * schedule a single refresh once KV has likely caught up, and also exposes a
 * manual "refresh now". On other backends (`enabled = false`) it's inert.
 */
export function useDelayedRefresh(enabled: boolean, delayMs = 2500) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshNow = useCallback(() => {
    startTransition(() => router.refresh());
  }, [router]);

  const scheduleRefresh = useCallback(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => startTransition(() => router.refresh()), delayMs);
  }, [enabled, delayMs, router]);

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  return { scheduleRefresh, refreshNow, refreshing };
}

/**
 * A dismissible heads-up shown on the dashboard only when the active store is
 * eventually consistent (Cloudflare KV). Sets the expectation up front so an
 * un-updated list after a change doesn't read as "nothing happened".
 */
export function ConsistencyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { refreshNow, refreshing } = useDelayedRefresh(true);

  if (dismissed) return null;

  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm animate-rise"
    >
      <Info size={16} aria-hidden className="shrink-0 text-warning" />
      <p className="min-w-0 flex-1 text-foreground/90">
        This deployment uses <span className="font-medium">Cloudflare KV</span>, which is{" "}
        <span className="font-medium">eventually consistent</span>: changes save instantly, but
        the list below can take a few seconds to catch up.
      </p>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={refreshNow}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-warning transition-colors hover:bg-warning/10 disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw size={13} aria-hidden className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
