import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

type SupabaseEnv = Record<string, string | undefined>;

export type SupabaseConfigStatus = {
  isConfigured: boolean;
  missing: string[];
};

export type ServicePulseUser = {
  email: string;
  id: string;
};

const publicAuthKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as const;

const protectedCustomerPrefixes = [
  "/dashboard",
  "/api/account",
  "/api/agent",
  "/api/billing/checkout",
  "/api/billing/portal",
  "/api/jobs",
  "/api/profile"
] as const;

export function getSupabaseConfigStatus(
  env: SupabaseEnv = process.env
): SupabaseConfigStatus {
  const missing = publicAuthKeys.filter((key) => !env[key]);

  return {
    isConfigured: missing.length === 0,
    missing: [...missing]
  };
}

export function isProtectedCustomerPath(pathname: string) {
  return protectedCustomerPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getSupabaseLoginRedirect(nextPath = "/dashboard") {
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";

  return `/login?next=${encodeURIComponent(safeNext)}`;
}

export async function getSupabaseServerClient() {
  const status = getSupabaseConfigStatus();

  if (!status.isConfigured) {
    throw new Error(`Supabase is missing: ${status.missing.join(", ")}`);
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, options, value }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always write cookies. Auth routes can.
          }
        }
      }
    }
  );
}

export async function getCurrentSupabaseUser(): Promise<ServicePulseUser | null> {
  if (!getSupabaseConfigStatus().isConfigured) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return {
    email: data.user.email || "",
    id: data.user.id
  };
}
