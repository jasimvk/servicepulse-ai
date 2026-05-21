import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getEvidenceDataDir, setFallbackDataDir } from "./evidence-store";
import { runKvCommand } from "./kv-store";

const PILOT_FILE = "pilot-pipeline.json";
const KV_PILOTS_KEY = "servicepulse:pilots";

export const pilotStages = [
  "target",
  "contacted",
  "demo-booked",
  "pilot-paid",
  "evidence-collected"
] as const;

export type PilotStage = (typeof pilotStages)[number];

export type PilotPermissionStatus = "needed" | "granted" | "declined";

export type PilotRecord = {
  id: string;
  businessName: string;
  segment: string;
  ownerName: string;
  location: string;
  channel: "google-maps" | "referral" | "walk-in" | "website" | "other";
  stage: PilotStage;
  offer: string;
  setupFee: number;
  monthlyPrice: number;
  paymentUrl: string;
  testimonialUrl: string;
  evidenceUrl: string;
  permissionStatus: PilotPermissionStatus;
  nextAction: string;
  nextActionDue: string;
  notes: string;
  updatedAt: string;
};

export type PilotSummary = {
  total: number;
  stageCounts: Record<PilotStage, number>;
  paidPilots: number;
  evidenceReady: number;
  setupRevenue: number;
  monthlyCommitted: number;
  nextActions: Array<Pick<
    PilotRecord,
    "id" | "businessName" | "nextAction" | "nextActionDue" | "stage"
  >>;
};

export async function readPilotPipeline(
  dataDir = getEvidenceDataDir()
): Promise<PilotRecord[]> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const data = await runKvCommand<string>(["GET", KV_PILOTS_KEY]);
      if (data) {
        return normalizePilotList(JSON.parse(data));
      }
    } catch (kvError) {
      console.warn("KV pilot read failed, trying local file fallback:", kvError);
    }
  }

  try {
    const raw = await readFile(join(dataDir, PILOT_FILE), "utf-8");
    return normalizePilotList(JSON.parse(raw));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export async function savePilotPipeline(
  pilots: PilotRecord[],
  dataDir = getEvidenceDataDir()
): Promise<PilotRecord[]> {
  const normalized = normalizePilotList(pilots);
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const result = await runKvCommand<string>([
        "SET",
        KV_PILOTS_KEY,
        JSON.stringify(normalized)
      ]);
      if (result === "OK" || result === "ok") {
        return normalized;
      }
      console.warn("KV pilot save did not return OK, trying local file fallback.");
    } catch (kvError) {
      console.warn("KV pilot save failed, trying local file fallback:", kvError);
    }
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, PILOT_FILE),
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
      console.warn("Read-only filesystem detected. Falling back to OS temporary directory for pilot store.");
      const fallbackDir = join(tmpdir(), "servicepulse-data");
      setFallbackDataDir(fallbackDir);

      await mkdir(fallbackDir, { recursive: true });
      await writeFile(
        join(fallbackDir, PILOT_FILE),
        `${JSON.stringify(normalized, null, 2)}\n`,
        "utf-8"
      );
      return normalized;
    }

    throw error;
  }

  return normalized;
}

export async function upsertPilotRecord(
  pilot: PilotRecord,
  dataDir = getEvidenceDataDir()
): Promise<PilotRecord[]> {
  const normalizedPilot = normalizePilotRecord(pilot);
  const stored = await readPilotPipeline(dataDir);
  const nextPilots = [
    normalizedPilot,
    ...stored.filter((item) => item.id !== normalizedPilot.id)
  ];

  return savePilotPipeline(nextPilots, dataDir);
}

export function getPilotSummary(pilots: PilotRecord[]): PilotSummary {
  const normalized = normalizePilotList(pilots);
  const stageCounts = Object.fromEntries(
    pilotStages.map((stage) => [stage, 0])
  ) as Record<PilotStage, number>;

  let setupRevenue = 0;
  let monthlyCommitted = 0;
  let paidPilots = 0;
  let evidenceReady = 0;

  for (const pilot of normalized) {
    stageCounts[pilot.stage] += 1;

    if (pilot.stage === "pilot-paid" || pilot.stage === "evidence-collected") {
      paidPilots += 1;
      setupRevenue += pilot.setupFee;
      monthlyCommitted += pilot.monthlyPrice;
    }

    if (
      pilot.permissionStatus === "granted" &&
      (pilot.evidenceUrl || pilot.testimonialUrl)
    ) {
      evidenceReady += 1;
    }
  }

  return {
    total: normalized.length,
    stageCounts,
    paidPilots,
    evidenceReady,
    setupRevenue,
    monthlyCommitted,
    nextActions: normalized
      .filter((pilot) => pilot.nextAction)
      .slice(0, 4)
      .map((pilot) => ({
        id: pilot.id,
        businessName: pilot.businessName,
        nextAction: pilot.nextAction,
        nextActionDue: pilot.nextActionDue,
        stage: pilot.stage
      }))
  };
}

function normalizePilotList(value: unknown): PilotRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const byId = new Map<string, PilotRecord>();
  for (const item of value) {
    const pilot = normalizePilotRecord(item);
    byId.set(pilot.id, pilot);
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

function normalizePilotRecord(value: unknown): PilotRecord {
  const record = isRecord(value) ? value : {};
  const businessName = stringOrDefault(record.businessName, "Unnamed business");
  const id = stringOrDefault(record.id, slugify(businessName));

  return {
    id,
    businessName,
    segment: stringOrDefault(record.segment, "Local service"),
    ownerName: stringOrDefault(record.ownerName, "Owner"),
    location: stringOrDefault(record.location, "Dubai"),
    channel: normalizeChannel(record.channel),
    stage: normalizeStage(record.stage),
    offer: stringOrDefault(record.offer, "$49 setup + $199/month after 7 days"),
    setupFee: positiveNumberOrZero(record.setupFee),
    monthlyPrice: positiveNumberOrZero(record.monthlyPrice),
    paymentUrl: stringOrDefault(record.paymentUrl, ""),
    testimonialUrl: stringOrDefault(record.testimonialUrl, ""),
    evidenceUrl: stringOrDefault(record.evidenceUrl, ""),
    permissionStatus: normalizePermission(record.permissionStatus),
    nextAction: stringOrDefault(record.nextAction, "Contact owner"),
    nextActionDue: stringOrDefault(record.nextActionDue, "Today"),
    notes: stringOrDefault(record.notes, ""),
    updatedAt: stringOrDefault(record.updatedAt, new Date().toISOString())
  };
}

function normalizeStage(value: unknown): PilotStage {
  return typeof value === "string" &&
    pilotStages.includes(value as PilotStage)
    ? (value as PilotStage)
    : "target";
}

function normalizeChannel(value: unknown): PilotRecord["channel"] {
  const channels: PilotRecord["channel"][] = [
    "google-maps",
    "referral",
    "walk-in",
    "website",
    "other"
  ];

  return typeof value === "string" &&
    channels.includes(value as PilotRecord["channel"])
    ? (value as PilotRecord["channel"])
    : "other";
}

function normalizePermission(value: unknown): PilotPermissionStatus {
  return value === "granted" || value === "declined" ? value : "needed";
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

  return slug || "pilot";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
