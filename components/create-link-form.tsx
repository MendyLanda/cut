"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Link2,
  ChevronDown,
  Lock,
  Clock,
  Hash,
  Plus,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";
import { createLinkAction, type CreateState } from "@/app/actions";
import { CopyButton, copyText } from "./copy-button";
import { PasswordField } from "./password-field";

const initial: CreateState = { ok: false };

export function CreateLinkForm({ base }: { base: string }) {
  const [state, formAction, pending] = useActionState(createLinkAction, initial);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ slug: string; autoCopied: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // On success: reset the form and best-effort copy the new short link.
  useEffect(() => {
    if (!state.ok || !state.slug) return;
    const url = `${base}/${state.slug}`;
    formRef.current?.reset();
    setOpen(false);
    copyText(url).then((autoCopied) => setCreated({ slug: state.slug!, autoCopied }));
  }, [state, base]);

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <div className="space-y-4">
      {created && (
        <CreatedBanner
          url={`${base}/${created.slug}`}
          autoCopied={created.autoCopied}
          onDismiss={() => setCreated(null)}
        />
      )}

      <form
        ref={formRef}
        action={formAction}
        className="rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm"
      >
        <label htmlFor="url" className="block text-sm font-medium">
          Destination URL
        </label>
        <div className="relative mt-1.5">
          <Link2
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="url"
            name="url"
            inputMode="url"
            placeholder="https://example.com/a/very/long/link"
            required
            autoFocus
            className={`${inputClass} pl-9 font-mono`}
          />
        </div>

        <label htmlFor="slug" className="mt-4 block text-sm font-medium">
          Custom slug <span className="font-normal text-muted">— optional</span>
        </label>
        <div className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/40">
          <span className="flex items-center whitespace-nowrap border-r border-border bg-surface-2 px-3 font-mono text-xs text-muted">
            {base.replace(/^https?:\/\//, "")}/
          </span>
          <input
            id="slug"
            name="slug"
            placeholder="auto"
            className="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
          />
        </div>

        {/* Progressive disclosure for the power-user options. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground cursor-pointer"
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
                placeholder="Leave blank for none"
                hint="Visitors must enter this before being redirected."
              />
            </div>
            <div>
              <label htmlFor="expiresAt" className="flex items-center gap-1.5 text-sm font-medium">
                <Clock size={14} aria-hidden className="text-muted" /> Expires
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="datetime-local"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="maxClicks" className="flex items-center gap-1.5 text-sm font-medium">
                <Hash size={14} aria-hidden className="text-muted" /> Click limit
              </label>
              <input
                id="maxClicks"
                name="maxClicks"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="∞"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
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

        <button
          type="submit"
          disabled={pending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 cursor-pointer sm:w-auto"
        >
          {pending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
          ) : (
            <Plus size={16} aria-hidden />
          )}
          {pending ? "Creating…" : "Create short link"}
        </button>
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
