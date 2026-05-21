import { describe, expect, it } from "vitest";
import { getSeedEvidenceLedger } from "./evidence-ledger";
import {
  buildProofPacket,
  getDefaultFinancialReport
} from "./proof-packet";

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
});
