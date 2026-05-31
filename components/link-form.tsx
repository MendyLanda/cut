"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Link2,
  ChevronDown,
  Clock,
  Hash,
  Plus,
  Save,
  CircleAlert,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { createLinkAction, editLinkAction, type CreateState } from "@/app/actions";
import { CopyButton, copyText } from "./copy-button";
import { PasswordField } from "./password-field";
import type { LinkWithMeta } from "@/lib/links";

const initial: CreateState = { ok: false };

// epoch ms -> value for <input type="datetime-local"> in the BROWSER's local
// timezone. Using the local getters is what makes the stored time correct.
function toLocalInput(ms?: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-ring/40";

export function LinkForm({
  base,
  mode,
  link,
  onDone,
}: {
  base: string;
  mode: "create" | "edit";
  link?: LinkWithMeta;
  onDone?: () => void;
}) {
  const action = mode === "create" ? createLinkAction : editLinkAction;
  const [state, formAction, pending] = useActionState(action, initial);

  // Fully controlled so values survive a failed submit (React resets
  // uncontrolled fields after an action; controlled state is preserved).
  const [url, setUrl] = useState(link?.url ?? "");
  const [slug, setSlug] = useState(link?.slug ?? "");
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [expiresLocal, setExpiresLocal] = useState(toLocalInput(link?.expiresAt));
  const [maxClicks, setMaxClicks] = useState(link?.maxClicks ? String(link.maxClicks) : "");
  const [resetClicks, setResetClicks] = useState(false);
  const [open, setOpen] = useState(
    mode === "edit" && Boolean(link?.passwordHash || link?.expiresAt || link?.maxClicks),
  );
  const [created, setCreated] = useState<{ url: string; autoCopied: boolean } | null>(null);

  useEffect(() => {
    if (!state.ok) return;
    if (mode === "create" && state.slug) {
      const u = `${base}/${state.slug}`;
      setUrl("");
      setSlug("");
      setPassword("");
      setExpiresLocal("");
      setMaxClicks("");
      setOpen(false);
      copyText(u).then((autoCopied) => setCreated({ url: u, autoCopied }));
    } else if (mode === "edit") {
      onDone?.();
    }
    // Only react to a completed action (new `state` reference).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Local wall-clock -> absolute epoch ms, computed in the browser so it's
  // correct regardless of the (UTC) server timezone.
  const expiresAtEpoch = expiresLocal ? String(new Date(expiresLocal).getTime()) : "";
  const isEdit = mode === "edit";
  const hasPassword = Boolean(link?.passwordHash);

  return (
    <div className="space-y-4">
      {created && (
        <CreatedBanner
          url={created.url}
          autoCopied={created.autoCopied}
          onDismiss={() => setCreated(null)}
        />
      )}

      <form
        action={formAction}
        className={
          isEdit
            ? ""
            : "rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm"
        }
      >
        {isEdit && <input type="hidden" name="originalSlug" value={link!.slug} />}
        <input type="hidden" name="expiresAt" value={expiresAtEpoch} />

        <label htmlFor={`url-${mode}-${link?.slug ?? "new"}`} className="block text-sm font-medium">
          Destination URL
        </label>
        <div className="relative mt-1.5">
          <Link2
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id={`url-${mode}-${link?.slug ?? "new"}`}
            name="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/a/very/long/link"
            required
            autoFocus={!isEdit}
            className={`${inputClass} pl-9 font-mono`}
          />
        </div>

        <label className="mt-4 block text-sm font-medium">
          Custom slug {!isEdit && <span className="font-normal text-muted">— optional</span>}
        </label>
        <div className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/40">
          <span className="flex items-center whitespace-nowrap border-r border-border bg-surface-2 px-3 font-mono text-xs text-muted">
            {base.replace(/^https?:\/\//, "")}/
          </span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={isEdit ? "" : "auto"}
            className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
        >
          <ChevronDown
            size={14}
            aria-hidden
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
          Protection &amp; limits
        </button>

        {open && (
          <div className="mt-3 grid gap-4 rounded-xl border border-dashed border-border p-4 animate-rise sm:grid-cols-2">
            <div className="sm:col-span-2">
              <PasswordField
                name="password"
                label="Password"
                value={removePassword ? "" : password}
                onChange={setPassword}
                placeholder={
                  isEdit && hasPassword ? "Leave blank to keep current" : "Leave blank for none"
                }
                hint="Visitors must enter this before being redirected."
              />
              {isEdit && hasPassword && (
                <label className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    name="removePassword"
                    checked={removePassword}
                    onChange={(e) => setRemovePassword(e.target.checked)}
                    className="accent-accent"
                  />
                  Remove password protection
                </label>
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Clock size={14} aria-hidden className="text-muted" /> Expires
              </label>
              <input
                type="datetime-local"
                value={expiresLocal}
                onChange={(e) => setExpiresLocal(e.target.value)}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Hash size={14} aria-hidden className="text-muted" /> Click limit
              </label>
              <input
                name="maxClicks"
                type="number"
                min={1}
                inputMode="numeric"
                value={maxClicks}
                onChange={(e) => setMaxClicks(e.target.value)}
                placeholder="∞"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            {isEdit && (
              <label className="flex items-center gap-2 text-xs text-muted sm:col-span-2">
                <input
                  type="checkbox"
                  name="resetClicks"
                  checked={resetClicks}
                  onChange={(e) => setResetClicks(e.target.checked)}
                  className="accent-accent"
                />
                <RotateCcw size={13} aria-hidden />
                Reset click count to 0 (currently {link?.clicks ?? 0})
              </label>
            )}
          </div>
        )}

        {state.error && (
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            <CircleAlert size={15} aria-hidden /> {state.error}
          </p>
        )}

        {/* Bottom-left, with clear separation from "Protection & limits". */}
        <div className="mt-6 flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 cursor-pointer sm:w-auto"
          >
            {pending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
            ) : isEdit ? (
              <Save size={16} aria-hidden />
            ) : (
              <Plus size={16} aria-hidden />
            )}
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create short link"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function CreatedBanner({
  url,
  autoCopied,
  onDismiss,
}: {
  url: string;
  autoCopied: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 animate-rise"
    >
      <CheckCircle2 size={18} aria-hidden className="text-accent" />
      <span className="text-sm font-medium">
        {autoCopied ? "Created & copied to clipboard" : "Short link created"}
      </span>
      <code className="rounded bg-surface/70 px-2 py-1 font-mono text-xs">{url}</code>
      <div className="ml-auto flex items-center gap-1">
        {!autoCopied && <CopyButton value={url} autoFocus />}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-xs text-muted hover:text-foreground cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
