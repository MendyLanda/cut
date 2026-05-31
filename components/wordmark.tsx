import { Scissors } from "lucide-react";
import { REPO_LINK } from "@/lib/constants";

// Links out to REPO_LINK by default (not the app's own home/admin) so the mark
// never funnels a random visitor toward the owner's admin surface.
export function Wordmark({ href = REPO_LINK }: { href?: string }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Scissors size={16} aria-hidden />
      </span>
      <span className="font-display text-xl italic leading-none tracking-tight">Cut</span>
    </a>
  );
}
