import { Eye, EyeOff } from "./icons.js";

/**
 * Password input with a show/hide toggle. The toggle is progressive enhancement:
 * `public/app.js` flips the input type and swaps the eye icon. Without JS it's a
 * plain password field.
 */
export function PasswordField({
  name,
  label,
  id,
  placeholder,
  autofocus = false,
  required = false,
  hint,
  value,
}: {
  name: string;
  label: string;
  id?: string;
  placeholder?: string;
  autofocus?: boolean;
  required?: boolean;
  hint?: string;
  value?: string;
}) {
  const fieldId = id ?? name;
  return (
    <div>
      <label for={fieldId} class="block text-sm font-medium">
        {label}
      </label>
      <div class="relative mt-1.5" data-password-field>
        <input
          id={fieldId}
          name={name}
          type="password"
          placeholder={placeholder}
          autofocus={autofocus}
          required={required}
          autocomplete="off"
          value={value ?? ""}
          class="w-full rounded-lg border border-border bg-surface px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          data-toggle-password
          aria-label="Show password"
          class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-foreground cursor-pointer"
        >
          <span data-eye>
            <Eye size={16} />
          </span>
          <span data-eye-off hidden={true}>
            <EyeOff size={16} />
          </span>
        </button>
      </div>
      {hint ? <p class="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
