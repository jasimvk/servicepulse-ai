import Stripe from "stripe";
import type { AccountPlan, AccountSettings } from "./account-store";

type StripeEnv = Record<string, string | undefined>;

export type StripeBillingStatus = {
  isConfigured: boolean;
  webhookConfigured: boolean;
  missing: string[];
  priceIds: Record<AccountPlan, string>;
};

export type StripeCheckoutSessionLike = {
  customer?: null | string | { id?: string | null };
  customer_email?: null | string;
  metadata?: null | Record<string, string>;
  subscription?: null | string | { id?: string | null };
  url?: null | string;
};

const stripePriceEnvKeys: Record<AccountPlan, string> = {
  starter: "STRIPE_PRICE_STARTER",
  growth: "STRIPE_PRICE_GROWTH",
  pro: "STRIPE_PRICE_PRO"
};

let stripeClient: Stripe | null = null;

export class StripeBillingConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeBillingConfigurationError";
  }
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new StripeBillingConfigurationError("STRIPE_SECRET_KEY is required.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true
    });
  }

  return stripeClient;
}

export function getStripeBillingStatus(
  env: StripeEnv = process.env
): StripeBillingStatus {
  const priceIds = {
    starter: env.STRIPE_PRICE_STARTER || "",
    growth: env.STRIPE_PRICE_GROWTH || "",
    pro: env.STRIPE_PRICE_PRO || ""
  };
  const missing = [
    !env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY" : "",
    ...Object.entries(stripePriceEnvKeys).map(([plan, key]) =>
      priceIds[plan as AccountPlan] ? "" : key
    )
  ].filter(Boolean);

  return {
    isConfigured: missing.length === 0,
    webhookConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET),
    missing,
    priceIds
  };
}

export function getAppUrl(env: StripeEnv = process.env) {
  const rawUrl =
    env.NEXT_PUBLIC_APP_URL ||
    env.APP_URL ||
    env.VERCEL_PROJECT_PRODUCTION_URL ||
    env.VERCEL_URL ||
    "http://localhost:3000";
  const withProtocol = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;

  return withProtocol.replace(/\/+$/, "");
}

export function resolveStripePriceId(
  plan: AccountPlan,
  env: StripeEnv = process.env
) {
  const priceId = env[stripePriceEnvKeys[plan]];

  if (!priceId) {
    throw new StripeBillingConfigurationError(
      `${stripePriceEnvKeys[plan]} is required for the ${plan} plan.`
    );
  }

  return priceId;
}

export function resolveStripePlan(value: unknown): AccountPlan {
  return value === "growth" || value === "pro" ? value : "starter";
}

export function buildStripeCheckoutSessionParams({
  account,
  appUrl,
  plan,
  priceId
}: {
  account: AccountSettings;
  appUrl: string;
  plan: AccountPlan;
  priceId: string;
}): Stripe.Checkout.SessionCreateParams {
  const metadata = {
    plan,
    workspaceSlug: account.workspaceSlug
  };
  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: account.workspaceSlug,
    metadata,
    subscription_data: {
      metadata
    },
    success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}#billing`,
    cancel_url: `${appUrl}/dashboard?checkout=cancelled#billing`
  };

  if (account.stripeCustomerId) {
    params.customer = account.stripeCustomerId;
  } else if (account.ownerEmail) {
    params.customer_email = account.ownerEmail;
  }

  return params;
}

export function buildStripePortalSessionParams(
  customerId: string,
  appUrl: string
): Stripe.BillingPortal.SessionCreateParams {
  return {
    customer: customerId,
    return_url: `${appUrl}/dashboard#billing`
  };
}

export function applyStripeCheckoutSession(
  account: AccountSettings,
  session: StripeCheckoutSessionLike
): AccountSettings {
  const plan = resolveStripePlan(session.metadata?.plan);
  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);

  return {
    ...account,
    ownerEmail: session.customer_email || account.ownerEmail,
    plan,
    subscriptionStatus: "active",
    checkoutUrl: "/api/billing/checkout",
    customerPortalUrl: "/api/billing/portal",
    ...(customerId ? { stripeCustomerId: customerId } : {}),
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    updatedAt: new Date().toISOString()
  };
}

export function applyStripeSubscriptionDeleted(
  account: AccountSettings
): AccountSettings {
  return {
    ...account,
    subscriptionStatus: "canceled",
    updatedAt: new Date().toISOString()
  };
}

function getStripeId(value: StripeCheckoutSessionLike["customer"]) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.id || "";
}
