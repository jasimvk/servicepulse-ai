"use server";

import { redirect } from "next/navigation";
import {
  getSupabaseConfigStatus,
  getSupabaseServerClient
} from "@/lib/supabase-auth";

export async function signInWithPassword(formData: FormData) {
  const next = getSafeNext(formData.get("next"));
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const status = getSupabaseConfigStatus();

  if (!status.isConfigured) {
    redirect("/login?error=auth_not_configured");
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=invalid_credentials&next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}

function getSafeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/dashboard";

  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
