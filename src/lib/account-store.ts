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

export type AccountSettings = {
  workspaceName: string;
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
  dataRegion: "us" | "eu" | "uae";
  updatedAt: string;
};

export type AccountSummary = {
  planLabel: string;
  readyForBilling: boolean;
  seatsAvailable: number;
  seatsIncluded: number;
  seatsUsed: number;
  monthlyRecurringRevenue: number;
  needsPaymentSetup: boolean;
};

export const defaultAccount: AccountSettings = {
  workspaceName: "ServicePulse Workspace",
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

  return {
    planLabel: planLabels[normalized.plan],
    readyForBilling:
      Boolean(normalized.ownerEmail) &&
      Boolean(normalized.checkoutUrl) &&
      normalized.subscriptionStatus !== "canceled",
    seatsAvailable: Math.max(normalized.seatsIncluded - normalized.seatsUsed, 0),
    seatsIncluded: normalized.seatsIncluded,
    seatsUsed: normalized.seatsUsed,
    monthlyRecurringRevenue:
      normalized.subscriptionStatus === "active" ? normalized.monthlyPrice : 0,
    needsPaymentSetup: !normalized.checkoutUrl || !normalized.customerPortalUrl
  };
}

const planLabels: Record<AccountPlan, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro"
};

function normalizeAccount(value: unknown): AccountSettings {
  const record = isRecord(value) ? value : {};

  return {
    workspaceName: stringOrDefault(
      record.workspaceName,
      defaultAccount.workspaceName
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
    updatedAt: stringOrDefault(record.updatedAt, new Date().toISOString())
  };
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
