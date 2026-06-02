import { Link2, Clock, Hash, Plus, Save, CircleAlert, RotateCcw } from "./icons.js";
import { PasswordField } from "./password-field.js";

export type LinkFormValues = {
  url?: string;
  slug?: string;
  expiresAt?: number | null; // epoch ms
  maxClicks?: number | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-ring/40";

/**
 * Create/edit form. Mutations are plain POSTs (no Server Actions):
 *   - create → POST /admin/links
 *   - edit   → POST /admin/links/:originalSlug
 * On validation failure the route re-renders this form with `values` + `error`
 * so typed input survives. `expiresAt` is submitted as an absolute epoch (ms)
 * via a hidden field that public/app.js keeps in sync with the datetime-local
 * input, computed in the browser's timezone (so it's correct on the UTC server).
 */
export function LinkForm({
  base,
  mode,
  action,
  values = {},
  hasPassword = false,
  clicks = 0,
  error,
  eventualConsistency = false,
}: {
  base: string;
  mode: "create" | "edit";
  action: string;
  values?: LinkFormValues;
  hasPassword?: boolean;
  clicks?: number;
  error?: string;
  eventualConsistency?: boolean;
}) {
  const isEdit = mode === "edit";
  const open = isEdit && Boolean(hasPassword || values.expiresAt || values.maxClicks);
  const host = base.replace(/^https?:\/\//, "");
  const urlId = `url-${mode}`;
  const expiresId = `expires-${mode}`;

  return (
    <form
      action={action}
      method="post"
      data-link-form
      data-eventual-consistency={eventualConsistency ? "1" : undefined}
      class={isEdit ? "" : "rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-sm"}
    >
      {/* Hidden epoch field, kept in sync by app.js from the datetime-local below. */}
      <input
        type="hidden"
        name="expiresAt"
        data-expires-epoch
        value={values.expiresAt ? String(values.expiresAt) : ""}
      />

      <label for={urlId} class="block text-sm font-medium">
        Destination URL
      </label>
      <div class="relative mt-1.5">
        <Link2
          size={16}
          class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          id={urlId}
          name="url"
          inputmode="url"
          value={values.url ?? ""}
          placeholder="https://example.com/a/very/long/link"
          required
          autofocus={!isEdit}
          class={`${inputClass} pl-9 font-mono`}
        />
      </div>

      <label for={`slug-${mode}`} class="mt-4 block text-sm font-medium">
        Custom slug {!isEdit ? <span class="font-normal text-muted">— optional</span> : null}
      </label>
      <div class="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/40">
        <span class="flex items-center whitespace-nowrap border-r border-border bg-surface-2 px-3 font-mono text-xs text-muted">
          {host}/
        </span>
        <input
          id={`slug-${mode}`}
          name="slug"
          value={values.slug ?? ""}
          placeholder={isEdit ? "" : "auto"}
          class="flex-1 bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
        />
      </div>

      <details class="mt-4 group" open={open}>
        <summary class="flex w-fit cursor-pointer items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          Protection &amp; limits
        </summary>

        <div class="mt-3 grid gap-4 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <PasswordField
              name="password"
              id={`password-${mode}`}
              label="Password"
              placeholder={
                isEdit && hasPassword ? "Leave blank to keep current" : "Leave blank for none"
              }
              hint="Visitors must enter this before being redirected."
            />
            {isEdit && hasPassword ? (
              <label class="mt-2 flex items-center gap-2 text-xs text-muted">
                <input type="checkbox" name="removePassword" value="1" class="accent-accent" />
                Remove password protection
              </label>
            ) : null}
          </div>
          <div>
            <label for={expiresId} class="flex items-center gap-1.5 text-sm font-medium">
              <Clock size={14} class="text-muted" /> Expires
            </label>
            <input
              id={expiresId}
              type="datetime-local"
              data-expires-input
              class={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label for={`maxClicks-${mode}`} class="flex items-center gap-1.5 text-sm font-medium">
              <Hash size={14} class="text-muted" /> Click limit
            </label>
            <input
              id={`maxClicks-${mode}`}
              name="maxClicks"
              type="number"
              min={1}
              inputmode="numeric"
              value={values.maxClicks ? String(values.maxClicks) : ""}
              placeholder="∞"
              class={`mt-1.5 ${inputClass}`}
            />
          </div>
          {isEdit ? (
            <label class="flex items-center gap-2 text-xs text-muted sm:col-span-2">
              <input type="checkbox" name="resetClicks" value="1" class="accent-accent" />
              <RotateCcw size={13} />
              Reset click count to 0 (currently {clicks})
            </label>
          ) : null}
        </div>
      </details>

      {error ? (
        <p
          role="alert"
          class="mt-4 flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          <CircleAlert size={15} /> {error}
        </p>
      ) : null}

      <div class="mt-6 flex items-center gap-2">
        <button
          type="submit"
          class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99] cursor-pointer sm:w-auto"
        >
          {isEdit ? <Save size={16} /> : <Plus size={16} />}
          {isEdit ? "Save changes" : "Create short link"}
        </button>
        {isEdit ? (
          <a
            href="/admin"
            class="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            Cancel
          </a>
        ) : null}
      </div>
    </form>
  );
}
