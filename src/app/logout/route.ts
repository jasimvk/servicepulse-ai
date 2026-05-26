import { NextResponse } from "next/server";
import {
  getSupabaseConfigStatus,
  getSupabaseServerClient
} from "@/lib/supabase-auth";

export async function POST(request: Request) {
  if (getSupabaseConfigStatus().isConfigured) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/login", request.url), 303);
}
