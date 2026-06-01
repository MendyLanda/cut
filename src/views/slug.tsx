import type { Child } from "hono/jsx";
import { Lock, Clock, Ban, ShieldAlert, ArrowRight } from "./icons";
import { Wordmark } from "./wordmark";
import { PasswordField } from "./password-field";

function Centered({ children }: { children: Child }) {
  return (
    <main class="flex flex-1 items-center justify-center px-6 py-16">
      <div class="w-full max-w-sm animate-rise">
        <div class="mb-8 flex justify-center">
          <Wordmark />
        </div>
        {children}
      </div>
    </main>
  );
}

function Card({
  icon,
  tone,
  title,
  children,
}: {
  icon: Child;
  tone: "danger" | "warning" | "neutral";
  title: string;
  children?: Child;
}) {
  const ring =
    tone === "danger"
      ? "text-danger bg-danger/10"
      : tone === "warning"
        ? "text-warning bg-warning/10"
        : "text-accent bg-accent-soft";
  return (
    <div class="rounded-2xl border border-border bg-surface/60 p-8 text-center backdrop-blur-sm">
      <div class={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${ring}`}>
        {icon}
      </div>
      <h1 class="text-lg font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export function ExpiredPage() {
  return (
    <Centered>
      <Card icon={<Clock size={22} />} tone="warning" title="This link has expired">
        <p class="mt-2 text-sm text-muted">
          The owner set it to stop working after a certain date.
        </p>
      </Card>
    </Centered>
  );
}

export function MaxedPage() {
  return (
    <Centered>
      <Card icon={<Ban size={22} />} tone="danger" title="This link is no longer active">
        <p class="mt-2 text-sm text-muted">It reached its maximum number of clicks.</p>
      </Card>
    </Centered>
  );
}

export function PasswordPage({ slug, error }: { slug: string; error?: string }) {
  return (
    <Centered>
      <Card icon={<Lock size={22} />} tone="neutral" title="This link is protected">
        <p class="mb-5 mt-2 text-sm text-muted">
          Enter the password to continue to your destination.
        </p>
        {error === "ratelimited" ? (
          <p
            role="alert"
            class="mb-4 flex items-center justify-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            <ShieldAlert size={15} /> Too many attempts. Wait a minute.
          </p>
        ) : error === "invalid" ? (
          <p role="alert" class="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            Incorrect password. Try again.
          </p>
        ) : null}
        <form action={`/${slug}/unlock`} method="post" class="space-y-4">
          <PasswordField name="password" label="Password" autofocus required />
          <button
            type="submit"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.99]"
          >
            <ArrowRight size={16} /> Continue
          </button>
        </form>
      </Card>
    </Centered>
  );
}
