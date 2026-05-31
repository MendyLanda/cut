"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  name,
  label,
  placeholder,
  autoFocus = false,
  required = false,
  hint,
  value,
  onChange,
}: {
  name: string;
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  hint?: string;
  value?: string; // when provided, the field is controlled
  onChange?: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const id = useId();
  const controlled = value !== undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required={required}
          autoComplete="off"
          {...(controlled ? { value, onChange: (e) => onChange?.(e.target.value) } : {})}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground cursor-pointer"
        >
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
