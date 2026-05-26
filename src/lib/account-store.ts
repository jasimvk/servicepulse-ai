import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getEvidenceDataDir, setFallbackDataDir } from "./evidence-store";
import { runKvCommand } from "./kv-store";

const ACCOUNT_FILE = "account-settings.json";
const KV_ACCOUNT_KEY = "servicepulse:account";

export type AccountPlan = "starter" | "growth" | "pro";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past-due"
  | "canceled";
export type TeamMemberRole = "owner" | "operator" | "technician";
export type TeamMemberStatus = "active" | "invited";

export type AccountUsage = {
  agentRunsThisMonth: number;
  jobsThisMonth: number;
  pilotsThisMonth: number;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  updatedAt: string;
};

export type AccountSettings = {
  workspaceName: string;
  workspaceSlug: string;
  ownerEmail: string;
  plan: AccountPlan;
  subscriptionStatus: SubscriptionStatus;
  billingCycle: "monthly" | "annual";
  monthlyPrice: number;
  seatsIncluded: number;
  seatsUsed: number;
  trialEndsAt: string;
  checkoutUrl: string;
  customerPortalUrl: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  dataRegion: "us" | "eu" | "uae";
  usage: AccountUsage;
  teamMembers: TeamMember[];
  updatedAt: string;
};

export type UsageMeter = {
  limit: number;
  used: number;
  remaining: number;
  percentUsed: number;
};

export type LaunchChecklistItem = {
  id: "workspace" | "owner" | "billing" | "team";
  label: string;
  ready: boolean;
};

export type AccountSummary = {
  planLabel: string;
  readyForBilling: boolean;
  seatsAvailable: number;
  seatsIncluded: number;
  seatsUsed: number;
  activeMembers: number;
  invitedMembers: number;
  monthlyRecurringRevenue: number;
  needsPaymentSetup: boolean;
  launchReady: boolean;
  goLiveScore: number;
  goLiveChecklist: LaunchChecklistItem[];
  usage: {
    agentRuns: UsageMeter;
    jobs: UsageMeter;
    pilots: UsageMeter;
  };
};

export const defaultAccount: AccountSettings = {
  workspaceName: "ServicePulse Workspace",
  workspaceSlug: "servicepulse-workspace",
  ownerEmail: "",
  plan: "starter",
  subscriptionStatus: "trialing",
  billingCycle: "monthly",
  monthlyPrice: 99,
  seatsIncluded: 1,
  seatsUsed: 0,
  trialEndsAt: "2026-06-05",
  checkoutUrl: "",
  customerPortalUrl: "",
  dataRegion: "us",
  usage: {
    agentRunsThisMonth: 0,
    jobsThisMonth: 0,
    pilotsThisMonth: 0
  },
  teamMembers: [],
  updatedAt: "2026-05-26T07:00:00.000Z"
};

export async function readAccount(
  dataDir = getEvidenceDataDir()
): Promise<AccountSettings> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const data = await runKvCommand<string>(["GET", KV_ACCOUNT_KEY]);
      if (data) {
        return normalizeAccount(JSON.parse(data));
      }
    } catch (kvError) {
      console.warn("KV account read failed, trying local file fallback:", kvError);
    }
  }

  try {
    const raw = await readFile(join(dataDir, ACCOUNT_FILE), "utf-8");
    return normalizeAccount(JSON.parse(raw));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return defaultAccount;
    }

    throw error;
  }
}

export async function saveAccount(
  account: AccountSettings,
  dataDir = getEvidenceDataDir()
): Promise<AccountSettings> {
  const normalized = normalizeAccount(account);
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const result = await runKvCommand<string>([
        "SET",
        KV_ACCOUNT_KEY,
        JSON.stringify(normalized)
      ]);
      if (result === "OK" || result === "ok") {
        return normalized;
      }
      console.warn("KV account save did not return OK, trying local file fallback.");
    } catch (kvError) {
      console.warn("KV account save failed, trying local file fallback:", kvError);
    }
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, ACCOUNT_FILE),
      `${JSON.stringify(normalized, null, 2)}\n`,
      "utf-8"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "EROFS" ||
        error.code === "EACCES" ||
        error.code === "EPERM" ||
        error.code === "ENOENT")
    ) {
      console.warn("Read-only filesystem detected. Falling back to OS temporary directory for account store.");
      const fallbackDir = join(tmpdir(), "servicepulse-data");
      setFallbackDataDir(fallbackDir);

      await mkdir(fallbackDir, { recursive: true });
      await writeFile(
        join(fallbackDir, ACCOUNT_FILE),
        `${JSON.stringify(normalized, null, 2)}\n`,
        "utf-8"
      );
      return normalized;
    }

    throw error;
  }

  return normalized;
}

export function getAccountSummary(account: AccountSettings): AccountSummary {
  const normalized = normalizeAccount(account);
  const entitlements = planEntitlements[normalized.plan];
  const activeMembers = normalized.teamMembers.filter(
    (member) => member.status === "active"
  ).length;
  const invitedMembers = normalized.teamMembers.filter(
    (member) => member.status === "invited"
  ).length;
  const seatsUsed = normalized.teamMembers.length || normalized.seatsUsed;
  const hasLegacyBillingLinks =
    Boolean(normalized.checkoutUrl) && Boolean(normalized.customerPortalUrl);
  const hasStripeBilling =
    Boolean(normalized.stripeCustomerId) ||
    Boolean(normalized.stripeSubscriptionId);
  const readyForBilling =
    Boolean(normalized.ownerEmail) &&
    (hasLegacyBillingLinks || hasStripeBilling) &&
    normalized.subscriptionStatus !== "canceled";
  const goLiveChecklist: LaunchChecklistItem[] = [
    {
      id: "workspace",
      label: "Workspace named",
      ready: Boolean(normalized.workspaceName)
    },
    {
      id: "owner",
      label: "Owner email set",
      ready: Boolean(normalized.ownerEmail)
    },
    {
      id: "billing",
      label: "Billing links set",
      ready: readyForBilling
    },
    {
      id: "team",
      label: "Team seat added",
      ready: normalized.teamMembers.length > 0
    }
  ];
  const readyItems = goLiveChecklist.filter((item) => item.ready).length;
  const goLiveScore = Math.round((readyItems / goLiveChecklist.length) * 100);

  return {
    planLabel: planLabels[normalized.plan],
    readyForBilling,
    seatsAvailable: Math.max(normalized.seatsIncluded - seatsUsed, 0),
    seatsIncluded: normalized.seatsIncluded,
    seatsUsed,
    activeMembers,
    invitedMembers,
    monthlyRecurringRevenue:
      normalized.subscriptionStatus === "active" ? normalized.monthlyPrice : 0,
    needsPaymentSetup: !hasLegacyBillingLinks && !hasStripeBilling,
    launchReady: goLiveScore === 100,
    goLiveScore,
    goLiveChecklist,
    usage: {
      agentRuns: buildUsageMeter(
        normalized.usage.agentRunsThisMonth,
        entitlements.agentRuns
      ),
      jobs: buildUsageMeter(normalized.usage.jobsThisMonth, entitlements.jobs),
      pilots: buildUsageMeter(
        normalized.usage.pilotsThisMonth,
        entitlements.pilots
      )
    }
  };
}

const planLabels: Record<AccountPlan, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro"
};

const planEntitlements: Record<
  AccountPlan,
  { agentRuns: number; jobs: number; pilots: number }
> = {
  starter: {
    agentRuns: 150,
    jobs: 25,
    pilots: 3
  },
  growth: {
    agentRuns: 750,
    jobs: 150,
    pilots: 15
  },
  pro: {
    agentRuns: 3000,
    jobs: 600,
    pilots: 50
  }
};

function normalizeAccount(value: unknown): AccountSettings {
  const record = isRecord(value) ? value : {};

  const normalized: AccountSettings = {
    workspaceName: stringOrDefault(
      record.workspaceName,
      defaultAccount.workspaceName
    ),
    workspaceSlug: stringOrDefault(
      record.workspaceSlug,
      slugify(stringOrDefault(record.workspaceName, defaultAccount.workspaceName))
    ),
    ownerEmail: stringOrDefault(record.ownerEmail, ""),
    plan: normalizePlan(record.plan),
    subscriptionStatus: normalizeStatus(record.subscriptionStatus),
    billingCycle: record.billingCycle === "annual" ? "annual" : "monthly",
    monthlyPrice: positiveNumberOrDefault(
      record.monthlyPrice,
      defaultAccount.monthlyPrice
    ),
    seatsIncluded: positiveNumberOrDefault(
      record.seatsIncluded,
      defaultAccount.seatsIncluded
    ),
    seatsUsed: positiveNumberOrZero(record.seatsUsed),
    trialEndsAt: stringOrDefault(record.trialEndsAt, defaultAccount.trialEndsAt),
    checkoutUrl: stringOrDefault(record.checkoutUrl, ""),
    customerPortalUrl: stringOrDefault(record.customerPortalUrl, ""),
    dataRegion: normalizeRegion(record.dataRegion),
    usage: normalizeUsage(record.usage),
    teamMembers: normalizeTeamMembers(record.teamMembers),
    updatedAt: stringOrDefault(record.updatedAt, new Date().toISOString())
  };

  const stripeCustomerId = stringOrDefault(record.stripeCustomerId, "");
  const stripeSubscriptionId = stringOrDefault(record.stripeSubscriptionId, "");

  if (stripeCustomerId) {
    normalized.stripeCustomerId = stripeCustomerId;
  }

  if (stripeSubscriptionId) {
    normalized.stripeSubscriptionId = stripeSubscriptionId;
  }

  return normalized;
}

function buildUsageMeter(usedValue: number, limit: number): UsageMeter {
  const used = Math.max(usedValue, 0);

  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    percentUsed: limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0
  };
}

function normalizeUsage(value: unknown): AccountUsage {
  const record = isRecord(value) ? value : {};

  return {
    agentRunsThisMonth: positiveNumberOrZero(record.agentRunsThisMonth),
    jobsThisMonth: positiveNumberOrZero(record.jobsThisMonth),
    pilotsThisMonth: positiveNumberOrZero(record.pilotsThisMonth)
  };
}

function normalizeTeamMembers(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((member, index): TeamMember => {
      const email = stringOrDefault(member.email, "");
      const name = stringOrDefault(member.name, email || `Team Member ${index + 1}`);

      return {
        id: stringOrDefault(member.id, slugify(email || name)),
        name,
        email,
        role: normalizeRole(member.role),
        status: normalizeTeamStatus(member.status),
        updatedAt: stringOrDefault(member.updatedAt, new Date().toISOString())
      };
    })
    .filter((member) => member.email);
}

function normalizeRole(value: unknown): TeamMemberRole {
  return value === "operator" || value === "technician" ? value : "owner";
}

function normalizeTeamStatus(value: unknown): TeamMemberStatus {
  return value === "invited" ? "invited" : "active";
}

function normalizePlan(value: unknown): AccountPlan {
  return value === "growth" || value === "pro" ? value : "starter";
}

function normalizeStatus(value: unknown): SubscriptionStatus {
  return value === "active" || value === "past-due" || value === "canceled"
    ? value
    : "trialing";
}

function normalizeRegion(value: unknown): AccountSettings["dataRegion"] {
  return value === "eu" || value === "uae" ? value : "us";
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

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || defaultAccount.workspaceSlug;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
