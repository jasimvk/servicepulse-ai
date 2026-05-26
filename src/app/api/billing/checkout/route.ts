import { NextResponse } from "next/server";
import { readAccount } from "@/lib/account-store";
import {
  getCurrentSupabaseUser,
  getSupabaseConfigStatus
} from "@/lib/supabase-auth";
import {
  buildStripeCheckoutSessionParams,
  getAppUrl,
  getStripeBillingStatus,
  getStripeClient,
  resolveStripePlan,
  resolveStripePriceId
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
      "Sign in before starting checkout.",
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
      "Run the Supabase workspace migration before starting checkout.",
      503
    );
  }

  const plan = resolveStripePlan((await readPlan(request)) || account.plan);
  const billingStatus = getStripeBillingStatus();

  if (!billingStatus.isConfigured) {
    return billingError(
      request,
      "stripe_not_configured",
      "Stripe checkout needs STRIPE_SECRET_KEY and plan price ids.",
      503,
      billingStatus.missing
    );
  }

  const priceId = resolveStripePriceId(plan);
  const session = await getStripeClient().checkout.sessions.create(
    buildStripeCheckoutSessionParams({
      account,
      appUrl: getAppUrl(),
      plan,
      priceId
    })
  );

  if (!session.url) {
    return billingError(
      request,
      "stripe_checkout_url_missing",
      "Stripe did not return a checkout URL.",
      502
    );
  }

  return billingRedirect(request, session.url);
}

async function readPlan(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await request.json()) as { plan?: unknown };
      return payload.plan;
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const payload = await request.formData();
      return payload.get("plan");
    }
  } catch {
    return null;
  }

  return null;
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
