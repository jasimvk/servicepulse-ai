import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { readAccount, saveAccount } from "@/lib/account-store";
import {
  applyStripeCheckoutSession,
  applyStripeSubscriptionDeleted,
  getStripeClient
} from "@/lib/stripe-billing";
import {
  saveWorkspaceStripeCheckoutSession,
  saveWorkspaceStripeSubscriptionDeleted
} from "@/lib/workspace-account-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json(
      {
        error: "stripe_webhook_not_configured",
        message: "Stripe webhook handling needs STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET."
      },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "stripe_signature_missing" },
      { status: 400 }
    );
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json(
      { error: "stripe_signature_invalid" },
      { status: 400 }
    );
  }

  try {
    await handleStripeEvent(event);
  } catch {
    return NextResponse.json(
      { error: "stripe_webhook_sync_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const syncedToWorkspace = await saveWorkspaceStripeCheckoutSession(session);

    if (!syncedToWorkspace) {
      const account = await readAccount();
      await saveAccount(applyStripeCheckoutSession(account, session));
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const syncedToWorkspace =
      await saveWorkspaceStripeSubscriptionDeleted(subscription);

    if (!syncedToWorkspace) {
      const account = await readAccount();
      await saveAccount(applyStripeSubscriptionDeleted(account));
    }
  }
}
