"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteLinkAction } from "@/app/actions";

export function DeleteButton({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);

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

  return (
    <form action={deleteLinkAction} className="inline-flex items-center gap-1">
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        className="rounded-md bg-danger px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
      >
        Confirm delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-foreground cursor-pointer"
      >
        Cancel
      </button>
    </form>
  );
}
