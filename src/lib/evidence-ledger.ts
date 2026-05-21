import type { AgentRun, BusinessProfile } from "./servicepulse";

export type PrizeCriterion =
  | "Business viability"
  | "AI-native operations"
  | "Category impact";

export type EvidenceEntry = {
  id: string;
  timestamp: string;
  business: string;
  customer: string;
  proofType:
    | "AI operations log"
    | "Revenue proof"
    | "Customer proof"
    | "Impact proof";
  summary: string;
  traceId: string;
  source: AgentRun["evidence"]["source"] | "manual-upload";
  prizeCriteria: PrizeCriterion[];
  metrics: {
    revenueAttached: number;
    loggedDecisions: number;
    payingCustomers: number;
  };
};

export type SubmissionBrief = {
  totals: {
    revenueAttached: number;
    payingCustomers: number;
    aiDecisionsLogged: number;
    evidenceItems: number;
  };
  criteria: {
    businessViability: "weak" | "credible" | "strong";
    aiNativeOperations: "weak" | "credible" | "strong";
    categoryImpact: "weak" | "credible" | "strong";
  };
  nextEvidenceNeeded: string[];
};

export function buildEvidenceEntry(
  run: AgentRun,
  profile: BusinessProfile
): EvidenceEntry {
  return {
    id: `evidence-${run.id}`,
    timestamp: "2026-05-21T09:19:00.000Z",
    business: profile.name,
    customer: run.customer,
    proofType: "AI operations log",
    summary: `${profile.name} used ServicePulse AI to qualify ${run.customer}, generate a $${run.quote.amount} quote, and prepare the booking workflow.`,
    traceId: run.evidence.traceId,
    source: run.evidence.source,
    prizeCriteria: ["AI-native operations", "Business viability"],
    metrics: {
      revenueAttached: run.quote.amount,
      loggedDecisions: run.evidence.loggedDecisions,
      payingCustomers: 0
    }
  };
}

export function getSeedEvidenceLedger(): EvidenceEntry[] {
  return [
    {
      id: "evidence-run-ac-1042",
      timestamp: "2026-05-21T09:19:00.000Z",
      business: "CoolFix AC",
      customer: "Maya Khan",
      proofType: "AI operations log",
      summary:
        "Gemini demo mode qualified, quoted, scheduled, invoiced, and queued follow-up for a same-day AC leak job.",
      traceId: "cloud-run/servicepulse/run-ac-1042",
      source: "deterministic-demo",
      prizeCriteria: ["AI-native operations", "Business viability"],
      metrics: {
        revenueAttached: 420,
        loggedDecisions: 5,
        payingCustomers: 0
      }
    },
    {
      id: "evidence-demo-business-ledger",
      timestamp: "2026-05-21T09:30:00.000Z",
      business: "ServicePulse AI",
      customer: "Demo business cohort",
      proofType: "Impact proof",
      summary:
        "Eight sample service businesses model the target customer segments; this is prototype readiness evidence, not submitted as real revenue.",
      traceId: "demo/servicepulse/business-cohort-2026-05",
      source: "deterministic-demo",
      prizeCriteria: ["Business viability", "Category impact"],
      metrics: {
        revenueAttached: 0,
        loggedDecisions: 0,
        payingCustomers: 0
      }
    },
    {
      id: "evidence-workflow-volume",
      timestamp: "2026-05-21T10:00:00.000Z",
      business: "ServicePulse AI",
      customer: "Demo workflow replay",
      proofType: "Impact proof",
      summary:
        "Prototype replay logs 286 sample AI-handled workflows and 19 human escalations to show how production evidence will be captured.",
      traceId: "demo/servicepulse/workflows-2026-05",
      source: "deterministic-demo",
      prizeCriteria: ["AI-native operations", "Category impact"],
      metrics: {
        revenueAttached: 0,
        loggedDecisions: 321,
        payingCustomers: 0
      }
    }
  ];
}

export function buildSubmissionBrief(
  ledger: EvidenceEntry[]
): SubmissionBrief {
  const summed = ledger.reduce(
    (accumulator, entry) => ({
      revenueAttached:
        accumulator.revenueAttached + entry.metrics.revenueAttached,
      payingCustomers: Math.max(
        accumulator.payingCustomers,
        entry.metrics.payingCustomers
      ),
      aiDecisionsLogged:
        accumulator.aiDecisionsLogged + entry.metrics.loggedDecisions,
      evidenceItems: accumulator.evidenceItems + 1
    }),
    {
      revenueAttached: 0,
      payingCustomers: 0,
      aiDecisionsLogged: 0,
      evidenceItems: 0
    }
  );
  const totals = summed;

  return {
    totals,
    criteria: {
      businessViability:
        totals.revenueAttached >= 5000 && totals.payingCustomers >= 5
          ? "strong"
          : totals.revenueAttached > 0
            ? "credible"
            : "weak",
      aiNativeOperations:
        totals.aiDecisionsLogged >= 250 ? "strong" : "credible",
      categoryImpact:
        totals.payingCustomers >= 5
          ? "credible"
          : totals.aiDecisionsLogged >= 250
            ? "credible"
            : "weak"
    },
    nextEvidenceNeeded: [
      "Signed pilot invoices",
      "Live Gemini API usage export",
      "Customer permission for public case studies"
    ]
  };
}
