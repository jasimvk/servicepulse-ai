"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  ClipboardCheck,
  FileCheck2,
  ListChecks,
  ShieldCheck
} from "lucide-react";
import type { EvidenceEntry, SubmissionBrief } from "@/lib/evidence-ledger";

type SubmissionDashboardProps = {
  ledger: EvidenceEntry[];
  brief: SubmissionBrief;
};

type EvidenceResponse = {
  ledger: EvidenceEntry[];
  brief: SubmissionBrief;
};

const criteriaLabels = [
  {
    label: "Business viability",
    value: "businessViability" as const
  },
  {
    label: "AI-native operations",
    value: "aiNativeOperations" as const
  },
  {
    label: "Category impact",
    value: "categoryImpact" as const
  }
];

export function SubmissionDashboard({
  ledger,
  brief
}: SubmissionDashboardProps) {
  const [currentLedger, setCurrentLedger] = useState(ledger);
  const [currentBrief, setCurrentBrief] = useState(brief);

  useEffect(() => {
    async function refreshEvidence() {
      const response = await fetch("/api/evidence", { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as EvidenceResponse;
      setCurrentLedger(payload.ledger);
      setCurrentBrief(payload.brief);
    }

    void refreshEvidence();

    window.addEventListener("opspilot:evidence-updated", refreshEvidence);
    return () => {
      window.removeEventListener("opspilot:evidence-updated", refreshEvidence);
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div
        className="rounded-lg border border-white/8 bg-white/[0.02] shadow-[0_0_20px_rgba(0,0,0,0.3)]"
        data-testid="submission-dashboard"
      >
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-white/5 p-6 lg:border-b-0 lg:border-r lg:border-white/5">
            <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div>
                <p className="pixel-text text-xs tracking-wider text-cyan">
                  Submission Room
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Evidence Judges Can Inspect
                </h2>
              </div>
              <ShieldCheck className="text-cyan animate-pulse" size={24} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <EvidenceMetric
                icon={BadgeDollarSign}
                label="Quoted value"
                value={`$${currentBrief.totals.revenueAttached.toLocaleString()}`}
              />
              <EvidenceMetric
                icon={FileCheck2}
                label="Evidence items"
                value={currentBrief.totals.evidenceItems.toString()}
                testId="evidence-items"
              />
              <EvidenceMetric
                icon={ClipboardCheck}
                label="AI decisions"
                value={currentBrief.totals.aiDecisionsLogged.toString()}
              />
              <EvidenceMetric
                icon={ListChecks}
                label="Paying users"
                value={currentBrief.totals.payingCustomers.toString()}
              />
            </div>

            <div className="mt-6 space-y-2">
              {criteriaLabels.map((criterion) => {
                const val = currentBrief.criteria[criterion.value];
                const isStrong = val === "strong";
                const isCredible = val === "credible";
                return (
                  <div
                    className="flex items-center justify-between rounded border border-white/5 bg-white/[0.01] px-4 py-2.5"
                    key={criterion.value}
                  >
                    <span className="text-xs font-medium text-white/70">
                      {criterion.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        isStrong ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" :
                        isCredible ? "bg-cyan shadow-[0_0_8px_#1bbfe0]" :
                        "bg-red-400 shadow-[0_0_8px_#f87171]"
                      }`} />
                      <span className="font-mono text-xs uppercase tracking-wider text-white">
                        {val}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <FileCheck2 size={20} className="text-cyan" />
              <h3 className="text-md font-bold text-white">Proof Ledger</h3>
            </div>
            <div className="mt-6 space-y-3">
              {currentLedger.map((entry) => (
                <div
                  className="rounded border border-white/5 bg-white/[0.01] p-4 hover:bg-white/[0.02] transition"
                  key={entry.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-white">
                      {entry.proofType}
                    </p>
                    <span className="rounded bg-cyan/10 border border-cyan/20 px-2 py-0.5 font-mono text-[10px] text-[#a2ddeb]">
                      {entry.traceId}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    {entry.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.prizeCriteria.map((criterion) => (
                      <span
                        className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/60"
                        key={criterion}
                      >
                        {criterion}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 text-amber-400 border-b border-amber-500/10 pb-2">
                <AlertCircle size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Next Proof Required</h3>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-white/70">
                {currentBrief.nextEvidenceNeeded.map((item) => (
                  <li className="flex items-center gap-2" key={item}>
                    <span className="size-1 rounded bg-amber-400/80" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function EvidenceMetric({
  icon: Icon,
  label,
  testId,
  value
}: {
  icon: typeof BadgeDollarSign;
  label: string;
  testId?: string;
  value: string;
}) {
  return (
    <div
      className="rounded border border-white/5 bg-white/[0.01] p-4"
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
        <Icon size={16} className="text-cyan" />
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
