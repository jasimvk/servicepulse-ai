import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultAccount,
  getAccountSummary,
  type AccountPlan,
  type AccountSettings,
  type SubscriptionStatus
} from "./account-store";
import {
  getSupabaseAdminClient,
  getSupabaseAdminConfigStatus,
  getSupabaseServerClient,
  type ServicePulseUser
} from "./supabase-auth";
import {
  resolveStripePlan,
  type StripeCheckoutSessionLike
} from "./stripe-billing";

export type WorkspaceRow = {
  billing_cycle?: null | string;
  data_region?: null | string;
  id?: string;
  monthly_price?: null | number;
  name?: null | string;
  owner_email?: null | string;
  owner_id?: null | string;
  plan?: null | string;
  seats_included?: null | number;
  seats_used?: null | number;
  slug?: null | string;
  stripe_customer_id?: null | string;
  stripe_subscription_id?: null | string;
  subscription_status?: null | string;
  trial_ends_at?: null | string;
  updated_at?: null | string;
};

export type StripeSubscriptionLike = {
  customer?: null | string | { id?: string | null };
  id?: null | string;
  metadata?: null | Record<string, string>;
};

export type WorkspaceStripeUpdate = {
  customerId: string;
  slug: string;
  subscriptionId: string;
  update: Partial<WorkspaceRow>;
};

export function workspaceInsertFromAccount(
  account: AccountSettings,
  ownerId: string
) {
  return {
    billing_cycle: account.billingCycle,
    data_region: account.dataRegion,
    monthly_price: account.monthlyPrice,
    name: account.workspaceName,
    owner_email: account.ownerEmail,
    owner_id: ownerId,
    plan: account.plan,
    seats_included: account.seatsIncluded,
    seats_used: account.seatsUsed,
    slug: account.workspaceSlug,
    stripe_customer_id: account.stripeCustomerId || null,
    stripe_subscription_id: account.stripeSubscriptionId || null,
    subscription_status: account.subscriptionStatus,
    trial_ends_at: account.trialEndsAt,
    updated_at: account.updatedAt
  };
}

export function accountFromWorkspaceRow(row: WorkspaceRow): AccountSettings {
  return {
    ...defaultAccount,
    workspaceName: row.name || defaultAccount.workspaceName,
    workspaceSlug: row.slug || defaultAccount.workspaceSlug,
    ownerEmail: row.owner_email || "",
    plan: normalizePlan(row.plan),
    subscriptionStatus: normalizeStatus(row.subscription_status),
    billingCycle: row.billing_cycle === "annual" ? "annual" : "monthly",
    monthlyPrice: positiveNumberOrDefault(
      row.monthly_price,
      defaultAccount.monthlyPrice
    ),
    seatsIncluded: positiveNumberOrDefault(
      row.seats_included,
      defaultAccount.seatsIncluded
    ),
    seatsUsed: positiveNumberOrZero(row.seats_used),
    trialEndsAt: row.trial_ends_at || defaultAccount.trialEndsAt,
    checkoutUrl: "/api/billing/checkout",
    customerPortalUrl: "/api/billing/portal",
    dataRegion:
      row.data_region === "eu" || row.data_region === "uae"
        ? row.data_region
        : "us",
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || undefined,
    updatedAt: row.updated_at || defaultAccount.updatedAt
  };
}

export async function readWorkspaceAccountForUser(
  user: ServicePulseUser,
  supabaseClient?: SupabaseClient
): Promise<AccountSettings> {
  const supabase = supabaseClient || (await getSupabaseServerClient());
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return accountFromWorkspaceRow(data as WorkspaceRow);
  }

  const account = {
    ...defaultAccount,
    ownerEmail: user.email,
    workspaceSlug: slugify(user.email || user.id),
    workspaceName: user.email ? `${user.email.split("@")[0]} Workspace` : "ServicePulse Workspace",
    updatedAt: new Date().toISOString()
  };

  const { data: created, error: createError } = await supabase
    .from("workspaces")
    .insert(workspaceInsertFromAccount(account, user.id))
    .select("*")
    .single();

  if (createError) {
    throw createError;
  }

  return accountFromWorkspaceRow(created as WorkspaceRow);
}

export async function saveWorkspaceAccountForUser(
  account: AccountSettings,
  user: ServicePulseUser,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || (await getSupabaseServerClient());
  const normalized = {
    ...account,
    updatedAt: new Date().toISOString()
  };
  const payload = workspaceInsertFromAccount(normalized, user.id);
  const { data, error } = await supabase
    .from("workspaces")
    .upsert(payload, { onConflict: "owner_id,slug" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const savedAccount = accountFromWorkspaceRow(data as WorkspaceRow);

  return {
    account: savedAccount,
    summary: getAccountSummary(savedAccount)
  };
}

export function workspaceStripeCheckoutUpdateFromSession(
  session: StripeCheckoutSessionLike
): WorkspaceStripeUpdate {
  const customerId = getStripeEntityId(session.customer);
  const subscriptionId = getStripeEntityId(session.subscription);
  const slug = session.metadata?.workspaceSlug || "";

  return {
    customerId,
    slug,
    subscriptionId,
    update: removeUndefined({
      owner_email: session.customer_email || undefined,
      plan: resolveStripePlan(session.metadata?.plan),
      stripe_customer_id: customerId || undefined,
      stripe_subscription_id: subscriptionId || undefined,
      subscription_status: "active",
      updated_at: new Date().toISOString()
    })
  };
}

export function workspaceStripeDeletedUpdateFromSubscription(
  subscription: StripeSubscriptionLike
): WorkspaceStripeUpdate {
  return {
    customerId: getStripeEntityId(subscription.customer),
    slug: subscription.metadata?.workspaceSlug || "",
    subscriptionId: subscription.id || "",
    update: {
      subscription_status: "canceled",
      updated_at: new Date().toISOString()
    }
  };
}

export async function saveWorkspaceStripeCheckoutSession(
  session: StripeCheckoutSessionLike,
  supabaseClient?: SupabaseClient
) {
  if (!supabaseClient && !getSupabaseAdminConfigStatus().isConfigured) {
    return false;
  }

  const supabase = supabaseClient || getSupabaseAdminClient();
  const stripeUpdate = workspaceStripeCheckoutUpdateFromSession(session);
  const workspace =
    (stripeUpdate.slug
      ? await updateWorkspaceByMatch(supabase, stripeUpdate.update, {
          column: "slug",
          value: stripeUpdate.slug
        })
      : null) ||
    (stripeUpdate.customerId
      ? await updateWorkspaceByMatch(supabase, stripeUpdate.update, {
          column: "stripe_customer_id",
          value: stripeUpdate.customerId
        })
      : null);

  if (!workspace) {
    return false;
  }

  await upsertBillingAccount(supabase, workspace.id, stripeUpdate, "active");

  return true;
}

export async function saveWorkspaceStripeSubscriptionDeleted(
  subscription: StripeSubscriptionLike,
  supabaseClient?: SupabaseClient
) {
  if (!supabaseClient && !getSupabaseAdminConfigStatus().isConfigured) {
    return false;
  }

  const supabase = supabaseClient || getSupabaseAdminClient();
  const stripeUpdate = workspaceStripeDeletedUpdateFromSubscription(subscription);
  const workspace =
    (stripeUpdate.subscriptionId
      ? await updateWorkspaceByMatch(supabase, stripeUpdate.update, {
          column: "stripe_subscription_id",
          value: stripeUpdate.subscriptionId
        })
      : null) ||
    (stripeUpdate.customerId
      ? await updateWorkspaceByMatch(supabase, stripeUpdate.update, {
          column: "stripe_customer_id",
          value: stripeUpdate.customerId
        })
      : null) ||
    (stripeUpdate.slug
      ? await updateWorkspaceByMatch(supabase, stripeUpdate.update, {
          column: "slug",
          value: stripeUpdate.slug
        })
      : null);

  if (!workspace) {
    return false;
  }

  await upsertBillingAccount(supabase, workspace.id, stripeUpdate, "canceled");

  return true;
}

function normalizePlan(value: unknown): AccountPlan {
  return value === "growth" || value === "pro" ? value : "starter";
}

function normalizeStatus(value: unknown): SubscriptionStatus {
  return value === "active" || value === "past-due" || value === "canceled"
    ? value
    : "trialing";
}

function positiveNumberOrDefault(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function positiveNumberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || defaultAccount.workspaceSlug;
}

function getStripeEntityId(
  value: StripeCheckoutSessionLike["customer"] | StripeSubscriptionLike["customer"]
) {
  if (!value) {
    return "";
  }

  return typeof value === "string" ? value : value.id || "";
}

function removeUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as Partial<T>;
}

async function updateWorkspaceByMatch(
  supabase: SupabaseClient,
  update: Partial<WorkspaceRow>,
  match: { column: string; value: string }
) {
  const { data, error } = await supabase
    .from("workspaces")
    .update(update)
    .eq(match.column, match.value)
    .select("id")
    .limit(1);

  if (error) {
    throw error;
  }

  return ((data || []) as Array<{ id: string }>)[0] || null;
}

async function upsertBillingAccount(
  supabase: SupabaseClient,
  workspaceId: string,
  stripeUpdate: WorkspaceStripeUpdate,
  status: "active" | "canceled"
) {
  const { error } = await supabase.from("billing_accounts").upsert(
    removeUndefined({
      current_period_end: null,
      status,
      stripe_customer_id: stripeUpdate.customerId || undefined,
      stripe_subscription_id: stripeUpdate.subscriptionId || undefined,
      updated_at: new Date().toISOString(),
      workspace_id: workspaceId
    }),
    { onConflict: "workspace_id" }
  );

  if (error) {
    throw error;
  }
}
