import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";

type AuthPanelProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  isConfigured: boolean;
  mode: "login" | "signup";
  next?: string;
};

export function AuthPanel({
  action,
  error,
  isConfigured,
  mode,
  next = "/dashboard"
}: AuthPanelProps) {
  const isSignup = mode === "signup";
  const title = isSignup ? "Create workspace" : "Sign in";
  const buttonLabel = isSignup ? "Create account" : "Sign in";

  return (
    <main className="min-h-screen bg-[#f6f6f1] text-[#141414]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <Link className="mb-8 flex items-center gap-3" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg border border-black/10 bg-white">
            <LockKeyhole size={17} />
          </span>
          <span className="text-sm font-semibold">ServicePulse</span>
        </Link>

        <section className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                Account access
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                {title}
              </h1>
            </div>
            <ShieldCheck size={18} />
          </div>

          {!isConfigured ? (
            <AuthSetupRequired
              missing={[
                "NEXT_PUBLIC_SUPABASE_URL",
                "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
              ]}
              title="Authentication setup required"
            />
          ) : (
            <form action={action} className="mt-5 space-y-4">
              <input name="next" type="hidden" value={next} />
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Email
                <input
                  className="mt-1.5 w-full rounded-lg border border-black/10 bg-[#fbfbf8] px-3 py-3 text-sm text-black outline-none transition focus:border-black/30"
                  name="email"
                  required
                  type="email"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
                Password
                <input
                  className="mt-1.5 w-full rounded-lg border border-black/10 bg-[#fbfbf8] px-3 py-3 text-sm text-black outline-none transition focus:border-black/30"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </label>
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#141414] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black">
                {buttonLabel}
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          <div className="mt-5 border-t border-black/10 pt-4 text-sm text-black/58">
            {isSignup ? (
              <Link className="font-semibold text-black" href="/login">
                Sign in instead
              </Link>
            ) : (
              <Link className="font-semibold text-black" href="/signup">
                Create workspace
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export function AuthSetupRequired({
  missing,
  title
}: {
  missing: string[];
  title: string;
}) {
  return (
    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">
        {missing.map((key) => (
          <div
            className="rounded border border-amber-200 bg-white/70 px-3 py-2 font-mono text-xs"
            key={key}
          >
            {key}
          </div>
        ))}
      </div>
    </div>
  );
}
