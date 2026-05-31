"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteLinkAction } from "@/app/actions";

export function DeleteButton({ slug, onDeleted }: { slug: string; onDeleted?: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete /${slug}`}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
      >
        <Trash2 size={14} aria-hidden /> Delete
      </button>
    );
  }

  const confirm = () =>
    startTransition(async () => {
      await deleteLinkAction(slug);
      onDeleted?.(); // hide the row immediately, regardless of KV read lag
    });

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={confirm}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-danger px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
      >
        {pending && <Loader2 size={13} aria-hidden className="animate-spin" />}
        {pending ? "Deleting…" : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-foreground disabled:opacity-60 cursor-pointer"
      >
        Cancel
      </button>
    </span>
  );
}
