import { describe, expect, it } from "vitest";
import type { AccountSettings } from "./account-store";
import {
  applyStripeCheckoutSession,
  buildStripeCheckoutSessionParams,
  buildStripePortalSessionParams,
  getStripeBillingStatus,
  resolveStripePriceId
} from "./stripe-billing";

const account: AccountSettings = {
  workspaceName: "CoolFix AC",
  workspaceSlug: "coolfix-ac",
  ownerEmail: "owner@coolfix.example",
  plan: "growth",
  subscriptionStatus: "trialing",
  billingCycle: "monthly",
  monthlyPrice: 199,
  seatsIncluded: 5,
  seatsUsed: 3,
  trialEndsAt: "2026-06-05",
  checkoutUrl: "",
  customerPortalUrl: "",
  dataRegion: "us",
  usage: {
    agentRunsThisMonth: 120,
    jobsThisMonth: 18,
    pilotsThisMonth: 4
  },
  teamMembers: [],
  updatedAt: "2026-05-26T07:00:00.000Z"
};

const env = {
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "whsec_123",
  STRIPE_PRICE_STARTER: "price_starter",
  STRIPE_PRICE_GROWTH: "price_growth",
  STRIPE_PRICE_PRO: "price_pro",
  NEXT_PUBLIC_APP_URL: "https://servicepulse.example"
};

describe("stripe billing helpers", () => {
  it("reports missing Stripe billing configuration", () => {
    expect(getStripeBillingStatus({})).toMatchObject({
      isConfigured: false,
      missing: [
        "STRIPE_SECRET_KEY",
        "STRIPE_PRICE_STARTER",
        "STRIPE_PRICE_GROWTH",
        "STRIPE_PRICE_PRO"
      ]
    });
  });

  it("resolves configured Stripe price ids by account plan", () => {
    expect(resolveStripePriceId("growth", env)).toBe("price_growth");
  });

  it("builds subscription checkout session params for a new customer", () => {
    const params = buildStripeCheckoutSessionParams({
      account,
      appUrl: "https://servicepulse.example",
      plan: "growth",
      priceId: "price_growth"
    });

    expect(params).toMatchObject({
      mode: "subscription",
      customer_email: "owner@coolfix.example",
      client_reference_id: "coolfix-ac",
      line_items: [{ price: "price_growth", quantity: 1 }],
      metadata: {
        plan: "growth",
        workspaceSlug: "coolfix-ac"
      },
      subscription_data: {
        metadata: {
          plan: "growth",
          workspaceSlug: "coolfix-ac"
        }
      },
      success_url:
        "https://servicepulse.example/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}#billing",
      cancel_url:
        "https://servicepulse.example/dashboard?checkout=cancelled#billing"
    });
    expect("customer" in params).toBe(false);
  });

  it("uses an existing Stripe customer for checkout and portal sessions", () => {
    const params = buildStripeCheckoutSessionParams({
      account: {
        ...account,
        stripeCustomerId: "cus_123"
      },
      appUrl: "https://servicepulse.example",
      plan: "pro",
      priceId: "price_pro"
    });

    expect(params.customer).toBe("cus_123");
    expect("customer_email" in params).toBe(false);
    expect(buildStripePortalSessionParams("cus_123", "https://servicepulse.example")).toEqual({
      customer: "cus_123",
      return_url: "https://servicepulse.example/dashboard#billing"
    });
  });

  it("applies a completed checkout session to the saved account", () => {
    const updated = applyStripeCheckoutSession(account, {
      customer: "cus_123",
      customer_email: "billing@coolfix.example",
      metadata: {
        plan: "pro",
        workspaceSlug: "coolfix-ac"
      },
      subscription: "sub_123",
      url: "https://checkout.stripe.com/c/pay/cs_test_123"
    });

    expect(updated).toMatchObject({
      ownerEmail: "billing@coolfix.example",
      plan: "pro",
      subscriptionStatus: "active",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      checkoutUrl: "/api/billing/checkout",
      customerPortalUrl: "/api/billing/portal"
    });
  });
});
