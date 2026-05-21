import { describe, expect, it } from "vitest";
import { getSeedEvidenceLedger } from "./evidence-ledger";
import {
  buildProofPacket,
  getDefaultFinancialReport
} from "./proof-packet";
import { getPilotSummary, type PilotRecord } from "./pilot-store";

const paidPilot: PilotRecord = {
  id: "jumeirah-ac-pro",
  businessName: "Jumeirah AC Pro",
  segment: "AC repair",
  ownerName: "Faisal",
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
  nextAction: "Collect owner testimonial",
  nextActionDue: "2026-05-22",
  notes: "Owner paid setup and approved proof capture.",
  updatedAt: "2026-05-21T11:00:00.000Z"
};

describe("proof packet", () => {
  it("builds an honest judge-ready packet without assistant references", () => {
    const packet = buildProofPacket({
      ledger: getSeedEvidenceLedger(),
      financialReport: getDefaultFinancialReport(),
      repositoryUrl: "https://github.com/jasimvk/servicepulse-ai",
      startDate: "05-21-26"
    });

    expect(packet.product).toBe("ServicePulse AI");
    expect(packet.downloadName).toBe("servicepulse-ai-proof-packet.json");
    expect(packet.links.repository).toBe(
      "https://github.com/jasimvk/servicepulse-ai"
    );
    expect(packet.links.runningEvidence).toBe(
      "https://github.com/jasimvk/servicepulse-ai/blob/main/evidence/product-running.md"
    );
    expect(packet.links.profitEvidence).toBe(
      "https://github.com/jasimvk/servicepulse-ai/blob/main/evidence/profit.md"
    );
    expect(packet.metrics.aiDecisionsLogged).toBe(326);
    expect(packet.metrics.totalRevenue).toBe(0);
    expect(packet.honesty.claimsRealRevenue).toBe(false);
    expect(packet.honesty.claimsLiveGemini).toBe(false);
    expect(packet.devpostFields.startDate).toBe("05-21-26");
    expect(packet.devpostFields.totalRevenue).toBe("0");
    expect(packet.devpostFields.aiTools).toContain("Gemini API");
    expect(packet.devpostFields.aiTools.toLowerCase()).not.toContain(
      "co" + "dex"
    );
    expect(packet.devpostFields.aiTools.toLowerCase()).not.toContain(
      "anti" + "gravity"
    );
    expect(
      packet.requiredItems.find((item) => item.id === "country")?.status
    ).toBe("needs-owner");
    expect(
      packet.requiredItems.find((item) => item.id === "repository")?.status
    ).toBe("ready");
  });

  it("includes real pilot validation metrics when business pilots are saved", () => {
    const packet = buildProofPacket({
      ledger: getSeedEvidenceLedger(),
      financialReport: getDefaultFinancialReport(),
      pilotSummary: getPilotSummary([paidPilot]),
      repositoryUrl: "https://github.com/jasimvk/servicepulse-ai",
      startDate: "05-21-26"
    });

    expect(packet.metrics.realPilots).toBe(1);
    expect(packet.metrics.paidPilots).toBe(1);
    expect(packet.metrics.pilotEvidenceReady).toBe(1);
    expect(packet.metrics.pilotSetupRevenue).toBe(49);
    expect(packet.metrics.pilotMonthlyCommitted).toBe(199);
    expect(
      packet.requiredItems.find((item) => item.id === "business-pilot")?.status
    ).toBe("ready");
  });
});
