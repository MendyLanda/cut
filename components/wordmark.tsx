import Link from "next/link";
import { Scissors } from "lucide-react";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Scissors size={16} aria-hidden />
      </span>
      <span className="font-display text-xl italic leading-none tracking-tight">Cut</span>
    </Link>
  );
}
