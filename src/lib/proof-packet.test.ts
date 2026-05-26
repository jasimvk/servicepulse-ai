import { describe, expect, it } from "vitest";
import { getSeedEvidenceLedger } from "./evidence-ledger";
import {
  buildProofPacket,
  getDefaultFinancialReport
} from "./proof-packet";
import { getPilotSummary, type PilotRecord } from "./pilot-store";
import { getJobSummary, type JobRecord } from "./job-store";
import { getAccountSummary, type AccountSettings } from "./account-store";

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

const paidJob: JobRecord = {
  id: "maya-khan-ac-leak",
  customerName: "Maya Khan",
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

const activeAccount: AccountSettings = {
  workspaceName: "CoolFix AC",
  workspaceSlug: "coolfix-ac",
  ownerEmail: "owner@coolfix.example",
  plan: "growth",
  subscriptionStatus: "active",
  billingCycle: "monthly",
  monthlyPrice: 199,
  seatsIncluded: 5,
  seatsUsed: 3,
  trialEndsAt: "2026-06-05",
  checkoutUrl: "https://buy.stripe.com/test",
  customerPortalUrl: "https://billing.stripe.com/test",
  dataRegion: "us",
  usage: {
    agentRunsThisMonth: 120,
    jobsThisMonth: 18,
    pilotsThisMonth: 4
  },
  teamMembers: [
    {
      id: "owner",
      name: "Nadia Owner",
      email: "owner@coolfix.example",
      role: "owner",
      status: "active",
      updatedAt: "2026-05-26T07:00:00.000Z"
    },
    {
      id: "dispatcher",
      name: "Sam Dispatcher",
      email: "sam@coolfix.example",
      role: "operator",
      status: "invited",
      updatedAt: "2026-05-26T07:00:00.000Z"
    }
  ],
  updatedAt: "2026-05-26T07:00:00.000Z"
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

  it("includes saved customer job metrics when owners track work", () => {
    const packet = buildProofPacket({
      ledger: getSeedEvidenceLedger(),
      financialReport: getDefaultFinancialReport(),
      jobSummary: getJobSummary([paidJob]),
      repositoryUrl: "https://github.com/jasimvk/servicepulse-ai",
      startDate: "05-21-26"
    });

    expect(packet.metrics.customerJobs).toBe(1);
    expect(packet.metrics.bookedJobs).toBe(1);
    expect(packet.metrics.paidJobs).toBe(1);
    expect(packet.metrics.jobQuotedValue).toBe(420);
    expect(packet.metrics.jobPaidRevenue).toBe(420);
    expect(packet.metrics.invoiceCollected).toBe(420);
    expect(packet.metrics.invoiceBalanceDue).toBe(0);
    expect(packet.metrics.overdueInvoices).toBe(0);
    expect(
      packet.requiredItems.find((item) => item.id === "customer-job")?.status
    ).toBe("ready");
  });

  it("includes SaaS account readiness when billing settings are connected", () => {
    const packet = buildProofPacket({
      ledger: getSeedEvidenceLedger(),
      accountSummary: getAccountSummary(activeAccount),
      financialReport: getDefaultFinancialReport(),
      repositoryUrl: "https://github.com/jasimvk/servicepulse-ai",
      startDate: "05-21-26"
    });

    expect(packet.metrics.saasReady).toBe(true);
    expect(packet.metrics.saasLaunchScore).toBe(100);
    expect(packet.metrics.subscriptionRevenue).toBe(199);
    expect(packet.metrics.seatsUsed).toBe(2);
    expect(packet.metrics.seatsIncluded).toBe(5);
    expect(
      packet.requiredItems.find((item) => item.id === "billing-setup")?.status
    ).toBe("ready");
    expect(
      packet.requiredItems.find((item) => item.id === "saas-launch")?.status
    ).toBe("ready");
  });
});
