import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getEvidenceDataDir, setFallbackDataDir } from "./evidence-store";
import { runKvCommand } from "./kv-store";

const JOB_FILE = "job-pipeline.json";
const KV_JOBS_KEY = "servicepulse:jobs";

export const jobStages = [
  "captured",
  "qualified",
  "quoted",
  "booked",
  "paid",
  "follow-up"
] as const;

export type JobStage = (typeof jobStages)[number];

export type JobRecord = {
  id: string;
  customerName: string;
  customerContact: string;
  businessName: string;
  channel: "whatsapp" | "web" | "email" | "phone" | "other";
  message: string;
  service: string;
  location: string;
  urgency: "today" | "this-week" | "flexible";
  stage: JobStage;
  quoteAmount: number;
  scheduledWindow: string;
  paymentUrl: string;
  evidenceUrl: string;
  invoiceNumber: string;
  invoiceStatus: "not-sent" | "sent" | "deposit-paid" | "paid" | "overdue";
  invoiceDueDate: string;
  amountPaid: number;
  nextAction: string;
  notes: string;
  updatedAt: string;
};

export type JobSummary = {
  total: number;
  stageCounts: Record<JobStage, number>;
  openJobs: number;
  bookedJobs: number;
  paidJobs: number;
  quotedValue: number;
  paidRevenue: number;
  invoicedValue: number;
  amountCollected: number;
  balanceDue: number;
  overdueJobs: number;
  nextActions: Array<Pick<
    JobRecord,
    "id" | "customerName" | "nextAction" | "stage" | "scheduledWindow"
  >>;
};

export async function readJobPipeline(
  dataDir = getEvidenceDataDir()
): Promise<JobRecord[]> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const data = await runKvCommand<string>(["GET", KV_JOBS_KEY]);
      if (data) {
        return normalizeJobList(JSON.parse(data));
      }
    } catch (kvError) {
      console.warn("KV job read failed, trying local file fallback:", kvError);
    }
  }

  try {
    const raw = await readFile(join(dataDir, JOB_FILE), "utf-8");
    return normalizeJobList(JSON.parse(raw));
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

export async function saveJobPipeline(
  jobs: JobRecord[],
  dataDir = getEvidenceDataDir()
): Promise<JobRecord[]> {
  const normalized = normalizeJobList(jobs);
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const result = await runKvCommand<string>([
        "SET",
        KV_JOBS_KEY,
        JSON.stringify(normalized)
      ]);
      if (result === "OK" || result === "ok") {
        return normalized;
      }
      console.warn("KV job save did not return OK, trying local file fallback.");
    } catch (kvError) {
      console.warn("KV job save failed, trying local file fallback:", kvError);
    }
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, JOB_FILE),
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
      console.warn("Read-only filesystem detected. Falling back to OS temporary directory for job store.");
      const fallbackDir = join(tmpdir(), "servicepulse-data");
      setFallbackDataDir(fallbackDir);

      await mkdir(fallbackDir, { recursive: true });
      await writeFile(
        join(fallbackDir, JOB_FILE),
        `${JSON.stringify(normalized, null, 2)}\n`,
        "utf-8"
      );
      return normalized;
    }

    throw error;
  }

  return normalized;
}

export async function upsertJobRecord(
  job: JobRecord,
  dataDir = getEvidenceDataDir()
): Promise<JobRecord[]> {
  const normalizedJob = normalizeJobRecord(job);
  const stored = await readJobPipeline(dataDir);
  const nextJobs = [
    normalizedJob,
    ...stored.filter((item) => item.id !== normalizedJob.id)
  ];

  return saveJobPipeline(nextJobs, dataDir);
}

export function getJobSummary(jobs: JobRecord[]): JobSummary {
  const normalized = normalizeJobList(jobs);
  const stageCounts = Object.fromEntries(
    jobStages.map((stage) => [stage, 0])
  ) as Record<JobStage, number>;

  let bookedJobs = 0;
  let paidJobs = 0;
  let quotedValue = 0;
  let paidRevenue = 0;
  let invoicedValue = 0;
  let amountCollected = 0;
  let balanceDue = 0;
  let overdueJobs = 0;

  for (const job of normalized) {
    stageCounts[job.stage] += 1;

    if (job.stage === "quoted" || job.stage === "booked" || job.stage === "paid" || job.stage === "follow-up") {
      quotedValue += job.quoteAmount;
    }

    if (job.stage === "booked" || job.stage === "paid" || job.stage === "follow-up") {
      bookedJobs += 1;
    }

    if (job.stage === "paid" || job.stage === "follow-up") {
      paidJobs += 1;
      paidRevenue += job.quoteAmount;
    }

    if (job.invoiceStatus !== "not-sent") {
      invoicedValue += job.quoteAmount;
      amountCollected += job.amountPaid;
      balanceDue += Math.max(job.quoteAmount - job.amountPaid, 0);
    }

    if (job.invoiceStatus === "overdue") {
      overdueJobs += 1;
    }
  }

  return {
    total: normalized.length,
    stageCounts,
    openJobs: normalized.length - paidJobs,
    bookedJobs,
    paidJobs,
    quotedValue,
    paidRevenue,
    invoicedValue,
    amountCollected,
    balanceDue,
    overdueJobs,
    nextActions: normalized
      .filter((job) => job.nextAction)
      .slice(0, 5)
      .map((job) => ({
        id: job.id,
        customerName: job.customerName,
        nextAction: job.nextAction,
        stage: job.stage,
        scheduledWindow: job.scheduledWindow
      }))
  };
}

function normalizeJobList(value: unknown): JobRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const byId = new Map<string, JobRecord>();
  for (const item of value) {
    const job = normalizeJobRecord(item);
    byId.set(job.id, job);
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

function normalizeJobRecord(value: unknown): JobRecord {
  const record = isRecord(value) ? value : {};
  const customerName = stringOrDefault(record.customerName, "Unnamed customer");
  const id = stringOrDefault(record.id, slugify(customerName));

  return {
    id,
    customerName,
    customerContact: stringOrDefault(record.customerContact, ""),
    businessName: stringOrDefault(record.businessName, "Service business"),
    channel: normalizeChannel(record.channel),
    message: stringOrDefault(record.message, ""),
    service: stringOrDefault(record.service, "Service request"),
    location: stringOrDefault(record.location, "Dubai"),
    urgency: normalizeUrgency(record.urgency),
    stage: normalizeStage(record.stage),
    quoteAmount: positiveNumberOrZero(record.quoteAmount),
    scheduledWindow: stringOrDefault(record.scheduledWindow, "Unscheduled"),
    paymentUrl: stringOrDefault(record.paymentUrl, ""),
    evidenceUrl: stringOrDefault(record.evidenceUrl, ""),
    invoiceNumber: stringOrDefault(record.invoiceNumber, ""),
    invoiceStatus: normalizeInvoiceStatus(record.invoiceStatus),
    invoiceDueDate: stringOrDefault(record.invoiceDueDate, ""),
    amountPaid: positiveNumberOrZero(record.amountPaid),
    nextAction: stringOrDefault(record.nextAction, "Qualify request"),
    notes: stringOrDefault(record.notes, ""),
    updatedAt: stringOrDefault(record.updatedAt, new Date().toISOString())
  };
}

function normalizeInvoiceStatus(value: unknown): JobRecord["invoiceStatus"] {
  const statuses: JobRecord["invoiceStatus"][] = [
    "not-sent",
    "sent",
    "deposit-paid",
    "paid",
    "overdue"
  ];

  return typeof value === "string" &&
    statuses.includes(value as JobRecord["invoiceStatus"])
    ? (value as JobRecord["invoiceStatus"])
    : "not-sent";
}

function normalizeStage(value: unknown): JobStage {
  return typeof value === "string" && jobStages.includes(value as JobStage)
    ? (value as JobStage)
    : "captured";
}

function normalizeChannel(value: unknown): JobRecord["channel"] {
  const channels: JobRecord["channel"][] = [
    "whatsapp",
    "web",
    "email",
    "phone",
    "other"
  ];

  return typeof value === "string" &&
    channels.includes(value as JobRecord["channel"])
    ? (value as JobRecord["channel"])
    : "other";
}

function normalizeUrgency(value: unknown): JobRecord["urgency"] {
  return value === "today" || value === "this-week" || value === "flexible"
    ? value
    : "flexible";
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

  return slug || "job";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
