import { describe, expect, it } from "vitest";
import {
  buildEvidenceEntry,
  buildSubmissionBrief,
  getSeedEvidenceLedger
} from "./evidence-ledger";
import { buildAgentRun, defaultBusinessProfile } from "./opspilot";

describe("evidence ledger", () => {
  it("turns an agent run into traceable XPRIZE evidence", () => {
    const run = buildAgentRun({
      customer: "Maya Khan",
      message: "My AC is leaking water and I need someone today after 4pm.",
      channel: "whatsapp",
      urgency: "today"
    });

    const entry = buildEvidenceEntry(run, defaultBusinessProfile);

    expect(entry.traceId).toBe(run.evidence.traceId);
    expect(entry.business).toBe("CoolFix AC");
    expect(entry.proofType).toBe("AI operations log");
    expect(entry.prizeCriteria).toEqual([
      "AI-native operations",
      "Business viability"
    ]);
    expect(entry.metrics.revenueAttached).toBe(420);
    expect(entry.metrics.loggedDecisions).toBe(5);
  });

  it("summarizes seeded proof into a submission readiness brief", () => {
    const brief = buildSubmissionBrief(getSeedEvidenceLedger());

    expect(brief.totals.revenueAttached).toBe(420);
    expect(brief.totals.payingCustomers).toBe(0);
    expect(brief.totals.aiDecisionsLogged).toBe(326);
    expect(brief.criteria.businessViability).toBe("credible");
    expect(brief.criteria.aiNativeOperations).toBe("strong");
    expect(brief.criteria.categoryImpact).toBe("credible");
    expect(brief.nextEvidenceNeeded).toContain("Signed pilot invoices");
  });
});
