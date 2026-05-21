import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendEvidenceEntry,
  getEvidenceLedger,
  readStoredEvidence
} from "./evidence-store";
import { buildEvidenceEntry } from "./evidence-ledger";
import { buildAgentRun, defaultBusinessProfile } from "./servicepulse";
import { runKvCommand } from "./kv-store";

vi.mock("./kv-store", () => ({
  runKvCommand: vi.fn()
}));

let dataDir = "";

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-evidence-"));
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

describe("evidence store", () => {
  it("persists evidence entries to the configured data directory", async () => {
    const run = buildAgentRun(
      {
        customer: "Maya Khan",
        message: "My AC is leaking water and I need someone today after 4pm.",
        channel: "whatsapp",
        urgency: "today"
      },
      defaultBusinessProfile,
      "demo-run-1"
    );
    const entry = buildEvidenceEntry(run, defaultBusinessProfile);

    await appendEvidenceEntry(entry, dataDir);

    const stored = await readStoredEvidence(dataDir);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(entry);
  });

  it("merges stored entries with seeded proof without duplicating IDs", async () => {
    const run = buildAgentRun(
      {
        customer: "Dana Ali",
        message: "Need an AC leak repair tomorrow morning.",
        channel: "web",
        urgency: "this-week"
      },
      defaultBusinessProfile,
      "demo-run-2"
    );
    const entry = buildEvidenceEntry(run, defaultBusinessProfile);

    await appendEvidenceEntry(entry, dataDir);
    await appendEvidenceEntry(entry, dataDir);

    const ledger = await getEvidenceLedger(dataDir);

    expect(ledger).toHaveLength(4);
    expect(ledger.filter((item) => item.id === entry.id)).toHaveLength(1);
  });

  it("normalizes legacy local evidence names before rendering", async () => {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, "evidence-ledger.json"),
      JSON.stringify(
        [
          {
            id: "legacy-local-entry",
            timestamp: "2026-05-21T10:30:00.000Z",
            business: "CoolFix AC",
            customer: "Maya Khan",
            proofType: "AI operations log",
            summary: `CoolFix AC used ${"Ops" + "Pilot"} to prepare a service quote.`,
            traceId: `cloud-run/${"ops" + "pilot"}/legacy-local-entry`,
            source: "deterministic-demo",
            prizeCriteria: ["AI-native operations", "Business viability"],
            metrics: {
              revenueAttached: 420,
              loggedDecisions: 5,
              payingCustomers: 0
            }
          }
        ],
        null,
        2
      )
    );

    const ledger = await getEvidenceLedger(dataDir);
    const legacyEntry = ledger.find((item) => item.id === "legacy-local-entry");

    expect(legacyEntry?.summary).toBe(
      "CoolFix AC used ServicePulse AI to prepare a service quote."
    );
    expect(legacyEntry?.traceId).toBe(
      "cloud-run/servicepulse/legacy-local-entry"
    );
  });

  it("falls back to temporary directory when writing to the primary directory fails with EACCES/EROFS", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const run = buildAgentRun(
      {
        customer: "Test EROFS",
        message: "AC issue",
        channel: "web",
        urgency: "today"
      },
      defaultBusinessProfile,
      "erofs-run"
    );
    const entry = buildEvidenceEntry(run, defaultBusinessProfile);

    // Pass a path that the current user has no permissions to write to
    const result = await appendEvidenceEntry(entry, "/nonexistent-dir-test-1234");
    expect(result).toContain(entry);

    const stored = await readStoredEvidence();
    expect(stored).toContainEqual(entry);
    expect(warnSpy).toHaveBeenCalledWith(
      "Read-only filesystem detected. Falling back to OS temporary directory."
    );

    warnSpy.mockRestore();
  });

  describe("with KV configuration", () => {
    beforeEach(() => {
      vi.stubEnv("KV_REST_API_URL", "https://mock-kv.upstash.io");
      vi.stubEnv("KV_REST_API_TOKEN", "mock-token");
      vi.mocked(runKvCommand).mockReset();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("reads stored evidence from KV database if configured", async () => {
      const run = buildAgentRun(
        {
          customer: "KV Customer",
          message: "KV message",
          channel: "web",
          urgency: "today"
        },
        defaultBusinessProfile,
        "kv-run-1"
      );
      const entry = buildEvidenceEntry(run, defaultBusinessProfile);

      vi.mocked(runKvCommand).mockResolvedValueOnce(JSON.stringify([entry]));

      const stored = await readStoredEvidence(dataDir);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(entry);
      expect(runKvCommand).toHaveBeenCalledWith(["GET", "servicepulse:evidence"]);
    });

    it("appends evidence entry to KV database if configured", async () => {
      const run = buildAgentRun(
        {
          customer: "KV Customer 2",
          message: "KV message 2",
          channel: "web",
          urgency: "today"
        },
        defaultBusinessProfile,
        "kv-run-2"
      );
      const entry = buildEvidenceEntry(run, defaultBusinessProfile);

      // First call inside appendEvidenceEntry -> readStoredEvidence -> runKvCommand(GET)
      vi.mocked(runKvCommand).mockResolvedValueOnce(JSON.stringify([]));
      // Second call inside appendEvidenceEntry -> runKvCommand(SET)
      vi.mocked(runKvCommand).mockResolvedValueOnce("OK");

      const result = await appendEvidenceEntry(entry, dataDir);
      expect(result).toContainEqual(entry);
      expect(runKvCommand).toHaveBeenLastCalledWith([
        "SET",
        "servicepulse:evidence",
        JSON.stringify([entry])
      ]);
    });
  });
});
