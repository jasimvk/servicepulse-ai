import { describe, expect, it } from "vitest";
import { defaultAccount, type AccountSettings } from "./account-store";
import {
  accountFromWorkspaceRow,
  workspaceInsertFromAccount,
  workspaceStripeCheckoutUpdateFromSession,
  workspaceStripeDeletedUpdateFromSubscription
} from "./workspace-account-store";

const account: AccountSettings = {
  ...defaultAccount,
  workspaceName: "CoolFix AC",
  workspaceSlug: "coolfix-ac",
  ownerEmail: "owner@coolfix.example",
  plan: "growth",
  subscriptionStatus: "active",
  monthlyPrice: 199,
  seatsIncluded: 5,
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_123",
  dataRegion: "uae"
};

describe("workspace account store mapping", () => {
  it("maps account settings into a Supabase workspace insert", () => {
    expect(workspaceInsertFromAccount(account, "user_123")).toMatchObject({
      owner_id: "user_123",
      name: "CoolFix AC",
      slug: "coolfix-ac",
      plan: "growth",
      subscription_status: "active",
      monthly_price: 199,
      seats_included: 5,
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      data_region: "uae"
    });
  });

  it("maps a Supabase workspace row back into account settings", () => {
    expect(
      accountFromWorkspaceRow({
        billing_cycle: "monthly",
        data_region: "uae",
        monthly_price: 199,
        name: "CoolFix AC",
        owner_email: "owner@coolfix.example",
        plan: "growth",
        seats_included: 5,
        slug: "coolfix-ac",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active",
        trial_ends_at: "2026-06-05",
        updated_at: "2026-05-26T08:00:00.000Z"
      })
    ).toMatchObject({
      ...account,
      checkoutUrl: "/api/billing/checkout",
      customerPortalUrl: "/api/billing/portal",
      updatedAt: "2026-05-26T08:00:00.000Z"
    });
  });

  it("maps Stripe checkout data into a workspace billing update", () => {
    const update = workspaceStripeCheckoutUpdateFromSession({
      customer: "cus_123",
      customer_email: "billing@coolfix.example",
      metadata: {
        plan: "pro",
        workspaceSlug: "coolfix-ac"
      },
      subscription: "sub_123"
    });

    expect(update).toMatchObject({
      customerId: "cus_123",
      slug: "coolfix-ac",
      subscriptionId: "sub_123",
      update: {
        owner_email: "billing@coolfix.example",
        plan: "pro",
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_123",
        subscription_status: "active"
      }
    });
  });

  it("maps Stripe subscription deletion into a cancel update", () => {
    expect(
      workspaceStripeDeletedUpdateFromSubscription({
        customer: "cus_123",
        id: "sub_123",
        metadata: {
          workspaceSlug: "coolfix-ac"
        }
      })
    ).toMatchObject({
      customerId: "cus_123",
      slug: "coolfix-ac",
      subscriptionId: "sub_123",
      update: {
        subscription_status: "canceled"
      }
    });
  });
});
