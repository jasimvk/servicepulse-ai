import { NextResponse } from "next/server";
import { readAccount } from "@/lib/account-store";
import {
  getCurrentSupabaseUser,
  getSupabaseConfigStatus
} from "@/lib/supabase-auth";
import {
  buildStripePortalSessionParams,
  getAppUrl,
  getStripeClient
} from "@/lib/stripe-billing";
import { readWorkspaceAccountForUser } from "@/lib/workspace-account-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authStatus = getSupabaseConfigStatus();
  const user = authStatus.isConfigured ? await getCurrentSupabaseUser() : null;

  if (authStatus.isConfigured && !user) {
    return billingError(
      request,
      "unauthorized",
      "Sign in before opening the billing portal.",
      401
    );
  }

  const account = user
    ? await readWorkspaceAccountForUser(user).catch(() => null)
    : await readAccount();

  if (!account) {
    return billingError(
      request,
      "database_workspace_not_ready",
      "Run the Supabase workspace migration before opening the billing portal.",
      503
    );
  }

  if (!account.stripeCustomerId) {
    return billingError(
      request,
      "stripe_customer_missing",
      "Create a Stripe checkout session before opening the billing portal.",
      409
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return billingError(
      request,
      "stripe_not_configured",
      "Stripe customer portal needs STRIPE_SECRET_KEY.",
      503,
      ["STRIPE_SECRET_KEY"]
    );
  }

  const session = await getStripeClient().billingPortal.sessions.create(
    buildStripePortalSessionParams(account.stripeCustomerId, getAppUrl())
  );

  return billingRedirect(request, session.url);
}

function billingRedirect(request: Request, url: string) {
  if (wantsJson(request)) {
    return NextResponse.json({ url });
  }

  return NextResponse.redirect(url, 303);
}

function billingError(
  request: Request,
  error: string,
  message: string,
  status: number,
  missing: string[] = []
) {
  if (wantsJson(request)) {
    return NextResponse.json({ error, message, missing }, { status });
  }

  return NextResponse.redirect(
    `${getAppUrl()}/dashboard?billing=${error}#billing`,
    303
  );
}

function wantsJson(request: Request) {
  return (
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("content-type")?.includes("application/json")
  );
}
