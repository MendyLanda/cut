import Link from "next/link";
import { Unlink } from "lucide-react";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted">
            <Unlink size={22} aria-hidden />
          </div>
          <h1 className="text-lg font-semibold">Link not found</h1>
          <p className="mt-2 text-sm text-muted">
            This short link doesn&apos;t exist, or it was deleted.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
