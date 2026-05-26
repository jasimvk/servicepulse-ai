import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseConfigStatus,
  getSupabaseLoginRedirect,
  isProtectedCustomerPath
} from "@/lib/supabase-auth";

export async function proxy(request: NextRequest) {
  const authStatus = getSupabaseConfigStatus();

  if (!isProtectedCustomerPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!authStatus.isConfigured) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "auth_not_configured", missing: authStatus.missing },
        { status: 503 }
      );
    }

    return NextResponse.next();
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request
          });
          cookiesToSet.forEach(({ name, options, value }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(
      new URL(getSupabaseLoginRedirect(request.nextUrl.pathname), request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/account/:path*",
    "/api/agent/:path*",
    "/api/billing/checkout/:path*",
    "/api/billing/portal/:path*",
    "/api/jobs/:path*",
    "/api/profile/:path*"
  ]
};
