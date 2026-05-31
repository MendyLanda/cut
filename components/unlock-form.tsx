"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { unlockAction } from "@/app/actions";
import { PasswordField } from "./password-field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground" />
      ) : (
        <ArrowRight size={16} aria-hidden />
      )}
      {pending ? "Checking…" : "Continue"}
    </button>
  );
}

export function UnlockForm({ slug }: { slug: string }) {
  return (
    <form action={unlockAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <PasswordField name="password" label="Password" autoFocus required />
      <SubmitButton />
    </form>
  );
}
