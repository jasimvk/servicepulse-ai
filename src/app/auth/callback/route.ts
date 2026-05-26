import { NextResponse } from "next/server";
import {
  getSupabaseConfigStatus,
  getSupabaseServerClient
} from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNext(url.searchParams.get("next"));

  if (!getSupabaseConfigStatus().isConfigured) {
    return NextResponse.redirect(new URL("/login?error=auth_not_configured", url));
  }

  if (code) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url));
}

function getSafeNext(value: string | null) {
  const next = value || "/dashboard";

  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
