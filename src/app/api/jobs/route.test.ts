import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import type { JobRecord } from "@/lib/job-store";

let dataDir = "";

const job: JobRecord = {
  id: "maya-khan-ac-leak",
  customerName: "Maya Khan",
  customerContact: "+971500000000",
  businessName: "CoolFix AC",
  channel: "whatsapp",
  message: "My AC is leaking water and I need someone today after 4pm.",
  service: "AC leak repair",
  location: "Jumeirah",
  urgency: "today",
  stage: "quoted",
  quoteAmount: 420,
  scheduledWindow: "Today, 4:30 PM - 6:00 PM",
  paymentUrl: "",
  evidenceUrl: "",
  invoiceNumber: "INV-1001",
  invoiceStatus: "sent",
  invoiceDueDate: "2026-05-21",
  amountPaid: 0,
  nextAction: "Confirm technician slot",
  notes: "Owner approved quote.",
  updatedAt: "2026-05-21T12:00:00.000Z"
};

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-api-jobs-"));
  vi.stubEnv("SERVICEPULSE_DATA_DIR", dataDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("/api/jobs", () => {
  it("returns the current customer job inbox", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      jobs: [],
      summary: {
        total: 0,
        paidJobs: 0,
        quotedValue: 0
      }
    });
  });

  it("upserts a job and returns updated job metrics", async () => {
    const response = await POST(
      new Request("http://localhost/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ job })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.jobs).toHaveLength(1);
    expect(payload.jobs[0].customerName).toBe("Maya Khan");
    expect(payload.summary.stageCounts.quoted).toBe(1);
    expect(payload.summary.quotedValue).toBe(420);
  });
});
