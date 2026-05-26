import { NextResponse } from "next/server";
import { readAccount } from "@/lib/account-store";
import {
  buildStripeCheckoutSessionParams,
  getAppUrl,
  getStripeBillingStatus,
  getStripeClient,
  resolveStripePlan,
  resolveStripePriceId
} from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const account = await readAccount();
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
