import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendEvidenceEntry,
  getEvidenceLedger,
  readStoredEvidence
} from "./evidence-store";
import { buildEvidenceEntry } from "./evidence-ledger";
import { buildAgentRun, defaultBusinessProfile } from "./opspilot";

let dataDir = "";

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "opspilot-evidence-"));
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
});
