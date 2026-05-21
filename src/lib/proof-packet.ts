import type { EvidenceEntry } from "./evidence-ledger";

type RequiredItemStatus = "ready" | "needs-owner" | "needs-live-evidence";

export type FinancialReport = {
  totalRevenue: number;
  revenueByMonth: {
    "May 2026": number;
    "June 2026": number;
    "July 2026": number;
    "August 2026": number;
  };
  relatedPartyRevenue: number;
  costOfGoodsSold: number;
  totalExpenses: number;
  marketingSpend: number;
  usersAcquired: number;
  payingUsers: number;
  additionalExpenses: string;
  marketingExplanation: string;
  customerTestimonialUrl?: string;
};

export type ProofPacket = {
  product: "ServicePulse AI";
  generatedAt: string;
  downloadName: "servicepulse-ai-proof-packet.json";
  links: {
    repository: string;
    runningEvidence: string;
    profitEvidence: string;
    playbookManifest: string;
  };
  metrics: {
    quotedValue: number;
    totalRevenue: number;
    relatedPartyRevenue: number;
    payingUsers: number;
    usersAcquired: number;
    aiDecisionsLogged: number;
    evidenceItems: number;
  };
  honesty: {
    claimsRealRevenue: boolean;
    claimsLiveGemini: boolean;
    evidenceMode: "prototype" | "live";
  };
  devpostFields: {
    startDate: string;
    category: "Small Business Services";
    learningLevel: "Significant";
    aiTools: string;
    runningEvidenceUrl: string;
    repositoryUrl: string;
    totalRevenue: string;
    revenueByMonth: string;
    relatedPartyRevenue: string;
    costOfGoodsSold: string;
    totalExpenses: string;
    marketingSpend: string;
    marketingExplanation: string;
    usersAcquired: string;
    additionalExpenses: string;
    profitEvidenceUrl: string;
    relatedPartyRevenueUsd: string;
    payingUsers: string;
  };
  requiredItems: Array<{
    id: string;
    label: string;
    status: RequiredItemStatus;
    value?: string;
  }>;
};

type BuildProofPacketOptions = {
  ledger: EvidenceEntry[];
  financialReport?: FinancialReport;
  repositoryUrl?: string;
  startDate: string;
  country?: string;
  demoVideoUrl?: string;
};

const DEFAULT_REPOSITORY_URL = "https://github.com/jasimvk/servicepulse-ai";
const GENERATED_AT = "2026-05-21T10:00:00.000Z";

export function getDefaultFinancialReport(): FinancialReport {
  return {
    totalRevenue: 0,
    revenueByMonth: {
      "May 2026": 0,
      "June 2026": 0,
      "July 2026": 0,
      "August 2026": 0
    },
    relatedPartyRevenue: 0,
    costOfGoodsSold: 0,
    totalExpenses: 0,
    marketingSpend: 0,
    usersAcquired: 0,
    payingUsers: 0,
    additionalExpenses: "USD 0. No additional cash expenses beyond development time.",
    marketingExplanation: "No paid marketing expenses have been incurred."
  };
}

export function buildProofPacket({
  country,
  demoVideoUrl,
  financialReport = getDefaultFinancialReport(),
  ledger,
  repositoryUrl = DEFAULT_REPOSITORY_URL,
  startDate
}: BuildProofPacketOptions): ProofPacket {
  const links = buildRepositoryLinks(repositoryUrl);
  const aiDecisionsLogged = ledger.reduce(
    (total, entry) => total + entry.metrics.loggedDecisions,
    0
  );
  const quotedValue = ledger.reduce(
    (total, entry) => total + entry.metrics.revenueAttached,
    0
  );
  const hasLiveGemini = ledger.some((entry) => entry.source === "gemini-api");
  const claimsRealRevenue =
    financialReport.totalRevenue > 0 || financialReport.payingUsers > 0;

  return {
    product: "ServicePulse AI",
    generatedAt: GENERATED_AT,
    downloadName: "servicepulse-ai-proof-packet.json",
    links,
    metrics: {
      quotedValue,
      totalRevenue: financialReport.totalRevenue,
      relatedPartyRevenue: financialReport.relatedPartyRevenue,
      payingUsers: financialReport.payingUsers,
      usersAcquired: financialReport.usersAcquired,
      aiDecisionsLogged,
      evidenceItems: ledger.length
    },
    honesty: {
      claimsRealRevenue,
      claimsLiveGemini: hasLiveGemini,
      evidenceMode: hasLiveGemini || claimsRealRevenue ? "live" : "prototype"
    },
    devpostFields: {
      startDate,
      category: "Small Business Services",
      learningLevel: "Significant",
      aiTools:
        "Gemini API, Gemini 2.5 Flash, Google AI Studio style key validation, Next.js, TypeScript, and Vitest.",
      runningEvidenceUrl: links.runningEvidence,
      repositoryUrl,
      totalRevenue: financialReport.totalRevenue.toString(),
      revenueByMonth: formatRevenueByMonth(financialReport),
      relatedPartyRevenue: `USD ${financialReport.relatedPartyRevenue}. No related-party revenue has been earned during the hackathon period.`,
      costOfGoodsSold: `USD ${financialReport.costOfGoodsSold}. No paid customer service delivery has been completed through the prototype yet.`,
      totalExpenses: financialReport.totalExpenses.toString(),
      marketingSpend: `USD ${financialReport.marketingSpend}. No paid marketing or customer acquisition spend has been incurred.`,
      marketingExplanation: financialReport.marketingExplanation,
      usersAcquired: financialReport.usersAcquired.toString(),
      additionalExpenses: financialReport.additionalExpenses,
      profitEvidenceUrl: links.profitEvidence,
      relatedPartyRevenueUsd: financialReport.relatedPartyRevenue.toString(),
      payingUsers: financialReport.payingUsers.toString()
    },
    requiredItems: [
      {
        id: "country",
        label: "Country of residence",
        status: country ? "ready" : "needs-owner",
        value: country
      },
      {
        id: "demo-video",
        label: "Demo video link",
        status: demoVideoUrl ? "ready" : "needs-owner",
        value: demoVideoUrl
      },
      {
        id: "repository",
        label: "Public repository",
        status: "ready",
        value: repositoryUrl
      },
      {
        id: "playbook-manifest",
        label: "Playbook manifest",
        status: "ready",
        value: links.playbookManifest
      },
      {
        id: "revenue-proof",
        label: "Live revenue proof",
        status: claimsRealRevenue ? "ready" : "needs-live-evidence",
        value: links.profitEvidence
      }
    ]
  };
}

function buildRepositoryLinks(repositoryUrl: string) {
  const base = repositoryUrl.replace(/\/$/, "");

  return {
    repository: base,
    runningEvidence: `${base}/blob/main/evidence/product-running.md`,
    profitEvidence: `${base}/blob/main/evidence/profit.md`,
    playbookManifest: `${base}/blob/main/playbooks/manifest.json`
  };
}

function formatRevenueByMonth(report: FinancialReport): string {
  return Object.entries(report.revenueByMonth)
    .map(([month, revenue]) => `${month}: USD ${revenue}`)
    .join("; ");
}
