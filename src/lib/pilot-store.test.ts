import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPilotSummary,
  readPilotPipeline,
  savePilotPipeline,
  upsertPilotRecord,
  type PilotRecord
} from "./pilot-store";
import { runKvCommand } from "./kv-store";

vi.mock("./kv-store", () => ({
  runKvCommand: vi.fn()
}));

let dataDir = "";

const paidPilot: PilotRecord = {
  id: "coolfix-ac",
  businessName: " CoolFix AC ",
  segment: "AC repair",
  ownerName: "Samir",
  location: "Jumeirah",
  channel: "google-maps",
  stage: "pilot-paid",
  offer: "$49 setup + $199/month after 7 days",
  setupFee: 49,
  monthlyPrice: 199,
  paymentUrl: "https://buy.stripe.com/test",
  testimonialUrl: "",
  evidenceUrl: "https://drive.google.com/proof",
  permissionStatus: "granted",
  nextAction: "Install missed-call workflow",
  nextActionDue: "2026-05-22",
  notes: "Owner accepted the paid pilot.",
  updatedAt: "2026-05-21T10:00:00.000Z"
};

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-pilots-"));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("pilot store", () => {
  it("starts with no real business pilots when no pipeline is saved", async () => {
    const pilots = await readPilotPipeline(dataDir);

    expect(pilots).toEqual([]);
    expect(getPilotSummary(pilots)).toMatchObject({
      total: 0,
      paidPilots: 0,
      evidenceReady: 0,
      setupRevenue: 0,
      monthlyCommitted: 0
    });
  });

  it("persists a paid pilot and summarizes committed revenue/evidence", async () => {
    const pilots = await upsertPilotRecord(paidPilot, dataDir);

    expect(pilots).toHaveLength(1);
    expect(pilots[0].businessName).toBe("CoolFix AC");

    const stored = await readPilotPipeline(dataDir);
    expect(stored[0]).toMatchObject({
      businessName: "CoolFix AC",
      stage: "pilot-paid",
      setupFee: 49,
      monthlyPrice: 199
    });
    expect(getPilotSummary(stored)).toMatchObject({
      total: 1,
      paidPilots: 1,
      evidenceReady: 1,
      setupRevenue: 49,
      monthlyCommitted: 199
    });
  });

  it("updates an existing pilot instead of duplicating it", async () => {
    await upsertPilotRecord(paidPilot, dataDir);
    await upsertPilotRecord(
      {
        ...paidPilot,
        stage: "evidence-collected",
        testimonialUrl: "https://example.com/testimonial",
        updatedAt: "2026-05-22T10:00:00.000Z"
      },
      dataDir
    );

    const stored = await readPilotPipeline(dataDir);
    expect(stored).toHaveLength(1);
    expect(stored[0].stage).toBe("evidence-collected");
    expect(getPilotSummary(stored).stageCounts["evidence-collected"]).toBe(1);
  });

  describe("with KV configuration", () => {
    beforeEach(() => {
      vi.stubEnv("KV_REST_API_URL", "https://mock-kv.upstash.io");
      vi.stubEnv("KV_REST_API_TOKEN", "mock-token");
      vi.mocked(runKvCommand).mockReset();
    });

    it("reads and saves pilot records through KV when configured", async () => {
      vi.mocked(runKvCommand).mockResolvedValueOnce(JSON.stringify([paidPilot]));

      const pilots = await readPilotPipeline(dataDir);
      expect(pilots[0].businessName).toBe("CoolFix AC");
      expect(runKvCommand).toHaveBeenCalledWith(["GET", "servicepulse:pilots"]);

      vi.mocked(runKvCommand).mockResolvedValueOnce("OK");
      await savePilotPipeline(pilots, dataDir);

      expect(runKvCommand).toHaveBeenLastCalledWith([
        "SET",
        "servicepulse:pilots",
        JSON.stringify(pilots)
      ]);
    });
  });
});
