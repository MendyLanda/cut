import { Unlink } from "./icons";
import { Wordmark } from "./wordmark";
import { REPO_LINK } from "@/lib/constants";

export function NotFoundPage() {
  return (
    <main class="flex flex-1 items-center justify-center px-6 py-16">
      <div class="w-full max-w-sm animate-rise">
        <div class="mb-8 flex justify-center">
          <Wordmark />
        </div>
        <div class="rounded-2xl border border-border bg-surface/60 p-8 text-center backdrop-blur-sm">
          <div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted">
            <Unlink size={22} />
          </div>
          <h1 class="text-lg font-semibold">Link not found</h1>
          <p class="mt-2 text-sm text-muted">
            This short link doesn&apos;t exist, or it was deleted.
          </p>
          <a
            href={REPO_LINK}
            class="mt-6 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            What is this?
          </a>
        </div>
      </div>
    </main>
  );
}
