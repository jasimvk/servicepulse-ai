"use server";

import { redirect } from "next/navigation";
import {
  getSupabaseConfigStatus,
  getSupabaseServerClient
} from "@/lib/supabase-auth";

export async function signUpWithPassword(formData: FormData) {
  const next = getSafeNext(formData.get("next"));
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const status = getSupabaseConfigStatus();

  if (!status.isConfigured) {
    redirect("/signup?error=auth_not_configured");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next)}`
    }
  });

  if (error) {
    redirect(`/signup?error=signup_failed&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

function getAppUrl() {
  const rawUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  return /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
}

function getSafeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/dashboard";

  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
