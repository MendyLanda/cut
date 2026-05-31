"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyButton({
  value,
  label = "Copy link",
  className = "",
  autoFocus = false,
}: {
  value: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (await copyText(value)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      autoFocus={autoFocus}
      aria-label={copied ? "Copied" : label}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        copied
          ? "text-accent"
          : "text-muted hover:text-foreground hover:bg-surface-2"
      } ${className}`}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
