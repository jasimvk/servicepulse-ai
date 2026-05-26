import {
  Download,
  ExternalLink,
  FileJson2,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import type { ProofPacket } from "@/lib/proof-packet";

type ProofPacketPanelProps = {
  packet: ProofPacket;
};

const statusTone = {
  ready: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  "needs-owner": "border-amber-400/20 bg-amber-400/10 text-amber-300",
  "needs-live-evidence": "border-cyan/20 bg-cyan/10 text-[#a2ddeb]"
} as const;

export function ProofPacketPanel({ packet }: ProofPacketPanelProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <p className="pixel-text text-xs tracking-wider text-cyan">
              Judge Export
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">Proof Packet</h2>
          </div>
          <a
            className="inline-flex items-center gap-2 rounded border border-cyan/35 bg-cyan/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-cyan transition hover:bg-cyan/15"
            download={packet.downloadName}
            href="/api/submission/proof-packet"
          >
            <Download size={15} />
            Export JSON
          </a>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded border border-white/5 bg-white/[0.01] p-4">
            <div className="flex items-center gap-2 text-cyan">
              <FileJson2 size={18} />
              <h3 className="text-sm font-bold text-white">Packet Metrics</h3>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProofMetric label="AI decisions" value={packet.metrics.aiDecisionsLogged} />
              <ProofMetric label="Evidence items" value={packet.metrics.evidenceItems} />
              <ProofMetric label="Real revenue" value={`$${packet.metrics.totalRevenue}`} />
              <ProofMetric label="Paying users" value={packet.metrics.payingUsers} />
              <ProofMetric label="Real pilots" value={packet.metrics.realPilots} />
              <ProofMetric label="Pilot evidence" value={packet.metrics.pilotEvidenceReady} />
              <ProofMetric label="Setup cash" value={`$${packet.metrics.pilotSetupRevenue}`} />
              <ProofMetric label="Monthly" value={`$${packet.metrics.pilotMonthlyCommitted}`} />
              <ProofMetric label="Jobs" value={packet.metrics.customerJobs} />
              <ProofMetric label="Booked jobs" value={packet.metrics.bookedJobs} />
              <ProofMetric label="Job paid" value={`$${packet.metrics.jobPaidRevenue}`} />
              <ProofMetric label="Collected" value={`$${packet.metrics.invoiceCollected}`} />
              <ProofMetric label="Balance" value={`$${packet.metrics.invoiceBalanceDue}`} />
              <ProofMetric label="Overdue" value={packet.metrics.overdueInvoices} />
              <ProofMetric
                label="SaaS ready"
                value={packet.metrics.saasReady ? "yes" : "no"}
              />
              <ProofMetric
                label="Launch"
                value={`${packet.metrics.saasLaunchScore}%`}
              />
              <ProofMetric
                label="Subscription"
                value={`$${packet.metrics.subscriptionRevenue}`}
              />
              <ProofMetric
                label="Seats"
                value={`${packet.metrics.seatsUsed}/${packet.metrics.seatsIncluded}`}
              />
            </div>

            <div className="mt-4 rounded border border-white/5 bg-black/20 p-3">
              <div className="flex items-center gap-2">
                {packet.honesty.evidenceMode === "live" ? (
                  <ShieldCheck className="text-emerald-300" size={16} />
                ) : (
                  <ShieldAlert className="text-amber-300" size={16} />
                )}
                <p className="font-mono text-xs uppercase tracking-wider text-white">
                  {packet.honesty.evidenceMode} evidence
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/55">
                Live revenue and live Gemini are only marked when connected
                evidence exists.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-white/5 bg-white/[0.01] p-4">
              <h3 className="text-sm font-bold text-white">Required Items</h3>
              <div className="mt-4 space-y-2">
                {packet.requiredItems.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded border border-white/5 bg-black/15 px-3 py-2"
                    key={item.id}
                  >
                    <span className="text-xs text-white/70">{item.label}</span>
                    <span
                      className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase ${statusTone[item.status]}`}
                    >
                      {item.status.replaceAll("-", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-white/5 bg-white/[0.01] p-4">
              <h3 className="text-sm font-bold text-white">Evidence Links</h3>
              <div className="mt-4 space-y-2">
                <ProofLink href={packet.links.repository} label="Repository" />
                <ProofLink href={packet.links.playbookManifest} label="Playbook manifest" />
                <ProofLink href={packet.links.runningEvidence} label="Running evidence" />
                <ProofLink href={packet.links.profitEvidence} label="Profit evidence" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofMetric({
  label,
  value
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded border border-white/5 bg-black/15 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function ProofLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="flex items-center justify-between gap-3 rounded border border-white/5 bg-black/15 px-3 py-2 text-xs text-white/70 transition hover:border-cyan/25 hover:text-cyan"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span>{label}</span>
      <ExternalLink size={13} />
    </a>
  );
}
