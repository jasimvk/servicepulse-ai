import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import type { PilotRecord } from "@/lib/pilot-store";

let dataDir = "";

const pilot: PilotRecord = {
  id: "jumeirah-ac-pro",
  businessName: "Jumeirah AC Pro",
  segment: "AC repair",
  ownerName: "Faisal",
  location: "Jumeirah",
  channel: "google-maps",
  stage: "contacted",
  offer: "$49 setup + $199/month after 7 days",
  setupFee: 49,
  monthlyPrice: 199,
  paymentUrl: "",
  testimonialUrl: "",
  evidenceUrl: "",
  permissionStatus: "needed",
  nextAction: "Send 7-day pilot offer",
  nextActionDue: "2026-05-22",
  notes: "Owner asked for WhatsApp demo.",
  updatedAt: "2026-05-21T11:00:00.000Z"
};

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-api-pilots-"));
  vi.stubEnv("SERVICEPULSE_DATA_DIR", dataDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("/api/pilots", () => {
  it("returns the current real-business pilot pipeline", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      pilots: [],
      summary: {
        total: 0,
        paidPilots: 0,
        evidenceReady: 0
      }
    });
  });

  it("upserts a pilot and returns the updated summary", async () => {
    const response = await POST(
      new Request("http://localhost/api/pilots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pilot })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.pilots).toHaveLength(1);
    expect(payload.pilots[0].businessName).toBe("Jumeirah AC Pro");
    expect(payload.summary.stageCounts.contacted).toBe(1);
  });
});
