import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getJobSummary,
  readJobPipeline,
  saveJobPipeline,
  upsertJobRecord,
  type JobRecord
} from "./job-store";
import { runKvCommand } from "./kv-store";

vi.mock("./kv-store", () => ({
  runKvCommand: vi.fn()
}));

let dataDir = "";

const paidJob: JobRecord = {
  id: "maya-khan-ac-leak",
  customerName: " Maya Khan ",
  customerContact: "+971500000000",
  businessName: "CoolFix AC",
  channel: "whatsapp",
  message: "My AC is leaking water and I need someone today after 4pm.",
  service: "AC leak repair",
  location: "Jumeirah",
  urgency: "today",
  stage: "paid",
  quoteAmount: 420,
  scheduledWindow: "Today, 4:30 PM - 6:00 PM",
  paymentUrl: "https://pay.example.com/maya",
  evidenceUrl: "https://drive.google.com/job-proof",
  invoiceNumber: "INV-1001",
  invoiceStatus: "paid",
  invoiceDueDate: "2026-05-21",
  amountPaid: 420,
  nextAction: "Send review request",
  notes: "Deposit collected.",
  updatedAt: "2026-05-21T12:00:00.000Z"
};

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-jobs-"));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("job store", () => {
  it("starts with no saved customer jobs", async () => {
    const jobs = await readJobPipeline(dataDir);

    expect(jobs).toEqual([]);
    expect(getJobSummary(jobs)).toMatchObject({
      total: 0,
      bookedJobs: 0,
      paidJobs: 0,
      quotedValue: 0,
      paidRevenue: 0
    });
  });

  it("persists a paid job and summarizes owner revenue", async () => {
    const jobs = await upsertJobRecord(paidJob, dataDir);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].customerName).toBe("Maya Khan");

    const stored = await readJobPipeline(dataDir);
    expect(stored[0]).toMatchObject({
      customerName: "Maya Khan",
      stage: "paid",
      quoteAmount: 420
    });
    expect(getJobSummary(stored)).toMatchObject({
      total: 1,
      bookedJobs: 1,
      paidJobs: 1,
      quotedValue: 420,
      paidRevenue: 420,
      invoicedValue: 420,
      amountCollected: 420,
      balanceDue: 0
    });
  });

  it("tracks invoice balances and overdue jobs", async () => {
    const overdueJob = {
      ...paidJob,
      id: "maya-khan-overdue",
      stage: "booked",
      invoiceStatus: "overdue",
      amountPaid: 100,
      updatedAt: "2026-05-21T14:00:00.000Z"
    } as JobRecord;

    await upsertJobRecord(overdueJob, dataDir);

    const summary = getJobSummary(await readJobPipeline(dataDir));
    expect(summary).toMatchObject({
      invoicedValue: 420,
      amountCollected: 100,
      balanceDue: 320,
      overdueJobs: 1
    });
  });

  it("updates a saved job without duplicating it", async () => {
    await upsertJobRecord({ ...paidJob, stage: "quoted" }, dataDir);
    await upsertJobRecord(
      {
        ...paidJob,
        stage: "booked",
        updatedAt: "2026-05-21T13:00:00.000Z"
      },
      dataDir
    );

    const stored = await readJobPipeline(dataDir);
    expect(stored).toHaveLength(1);
    expect(stored[0].stage).toBe("booked");
    expect(getJobSummary(stored).stageCounts.booked).toBe(1);
  });

  describe("with KV configuration", () => {
    beforeEach(() => {
      vi.stubEnv("KV_REST_API_URL", "https://mock-kv.upstash.io");
      vi.stubEnv("KV_REST_API_TOKEN", "mock-token");
      vi.mocked(runKvCommand).mockReset();
    });

    it("reads and saves jobs through KV when configured", async () => {
      vi.mocked(runKvCommand).mockResolvedValueOnce(JSON.stringify([paidJob]));

      const jobs = await readJobPipeline(dataDir);
      expect(jobs[0].customerName).toBe("Maya Khan");
      expect(runKvCommand).toHaveBeenCalledWith(["GET", "servicepulse:jobs"]);

      vi.mocked(runKvCommand).mockResolvedValueOnce("OK");
      await saveJobPipeline(jobs, dataDir);

      expect(runKvCommand).toHaveBeenLastCalledWith([
        "SET",
        "servicepulse:jobs",
        JSON.stringify(jobs)
      ]);
    });
  });
});
