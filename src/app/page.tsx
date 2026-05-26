import {
  Activity,
  ArrowUpRight,
  BadgeDollarSign,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards
} from "lucide-react";
import {
  buildAgentRun,
  customers,
  evidenceEvents,
  getBusinessSnapshot,
  getDashboardMetrics,
  pipeline
} from "@/lib/servicepulse";
import {
  buildSubmissionBrief,
  getSeedEvidenceLedger
} from "@/lib/evidence-ledger";
import { ServicePulseWorkbench } from "@/components/servicepulse-workbench";
import { SubmissionDashboard } from "@/components/submission-dashboard";
import { ApiKeySetupAgent } from "@/components/api-key-setup-agent";
import { ProofPacketPanel } from "@/components/proof-packet-panel";
import { PilotCrmPanel } from "@/components/pilot-crm-panel";
import { JobInboxPanel } from "@/components/job-inbox-panel";
import { SaasAccountPanel } from "@/components/saas-account-panel";
import {
  buildProofPacket,
  getDefaultFinancialReport
} from "@/lib/proof-packet";
import { getPilotSummary, type PilotRecord } from "@/lib/pilot-store";
import { getJobSummary, type JobRecord } from "@/lib/job-store";
import {
  defaultAccount,
  getAccountSummary,
  type AccountSettings
} from "@/lib/account-store";

const agentRun = buildAgentRun({
  customer: "Maya Khan",
  message: "My AC is leaking water and I need someone today after 4pm in Jumeirah.",
  channel: "whatsapp",
  urgency: "today"
});

const metrics = getDashboardMetrics(getBusinessSnapshot());
const ledger = getSeedEvidenceLedger();
const initialAccount: AccountSettings = defaultAccount;
const accountSummary = getAccountSummary(initialAccount);
const initialJobs: JobRecord[] = [];
const jobSummary = getJobSummary(initialJobs);
const initialPilots: PilotRecord[] = [];
const pilotSummary = getPilotSummary(initialPilots);
const submissionBrief = buildSubmissionBrief(ledger);
const proofPacket = buildProofPacket({
  accountSummary,
  ledger,
  financialReport: getDefaultFinancialReport(),
  jobSummary,
  repositoryUrl: "https://github.com/jasimvk/servicepulse-ai",
  startDate: "05-21-26"
});

const metricCards = [
  {
    label: "Modeled revenue",
    value: `$${metrics.modeledRecurringRevenue.toLocaleString()}`,
    note: "Demo cohort, not claimed revenue",
    icon: BadgeDollarSign
  },
  {
    label: "Lead conversion",
    value: `${metrics.leadConversionRate}%`,
    note: "AI quoted and booked",
    icon: ArrowUpRight
  },
  {
    label: "AI workflows",
    value: metrics.aiHandledWorkflows.toString(),
    note: "Logged this month",
    icon: Bot
  },
  {
    label: "Modeled margin",
    value: `${metrics.modeledGrossMargin}%`,
    note: "Hosting + AI costs estimate",
    icon: WalletCards
  }
] as const;

const prizeFit = [
  {
    label: "Business viability",
    text: "Designed for subscription revenue, cost tracking, and third-party demand proof.",
    icon: BadgeDollarSign
  },
  {
    label: "AI-native operations",
    text: "Gemini qualifies, prices, schedules, invoices, and follows up.",
    icon: Sparkles
  },
  {
    label: "Category impact",
    text: "Small businesses get an always-on operations team they can afford.",
    icon: UsersRound
  }
] as const;

export default function Home() {
  return (
    <main className="min-h-screen pb-16 bg-[#050505] text-white selection:bg-cyan/20">
      {/* Translucent Cyber Nav */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded bg-cyan/15 text-cyan border border-cyan/35 shadow-[0_0_10px_rgba(27,191,224,0.2)]">
              <Bot size={20} className="animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-semibold tracking-wide text-cyan drop-shadow-[0_0_5px_rgba(27,191,224,0.5)]">
                  ServicePulse AI
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                <span className="font-mono text-xs text-[#a2ddeb]">XPRIZE entry</span>
              </div>
              <h1 className="text-sm font-medium text-white/80">
                AI Operations Desk for Local Service Businesses
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded border border-cyan/20 bg-cyan/5 px-3 py-1.5 text-xs text-[#a2ddeb] sm:flex font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_#1BBFE0]" />
              Gemini + Cloud Ready
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Overview Section */}
      <section className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Brand Introduction Card */}
          <div className="flex flex-col justify-between rounded-lg border border-white/8 bg-white/[0.02] p-6 lg:p-8 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_#1BBFE0]" />
                <span className="font-mono text-xs tracking-wider text-cyan">
                  Small Business Services Category
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                Turn every missed message into a <span className="text-cyan font-extrabold drop-shadow-[0_0_8px_rgba(27,191,224,0.5)]">quoted, booked, paid</span> job.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                Built for AC repair, salons, clinics, cleaners, and contractors.
                ServicePulse AI embeds Gemini directly into communication channels, CRM, quote desks,
                invoice chasing, and public audit ledgers.
              </p>
            </div>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {prizeFit.map((item) => (
                <div
                  className="rounded border border-white/5 bg-white/[0.01] p-4 hover:bg-white/[0.03] transition"
                  key={item.label}
                >
                  <item.icon className="text-cyan" size={20} />
                  <h3 className="mt-3 text-xs font-semibold uppercase tracking-wider text-white">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-xs leading-normal text-white/60">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time agent status simulation */}
          <div className="rounded-lg border border-cyan/30 bg-cyan/[0.02] p-6 shadow-[0_0_20px_rgba(27,191,224,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan"></span>
                    </span>
                    <span className="font-mono text-xs text-cyan">Incoming Message</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-white">
                    {agentRun.customer}
                  </h2>
                </div>
                <MessageSquareText className="text-cyan" size={24} />
              </div>

              <div className="mt-4 rounded bg-white/[0.04] p-3 text-xs italic leading-relaxed text-white/80 border border-white/5">
                “My AC is leaking water and I need someone today after 4pm in Jumeirah.”
              </div>

              <div className="mt-4 space-y-2">
                {agentRun.actions.map((action) => (
                  <div
                    className="flex gap-3 rounded border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition"
                    key={action.type}
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-400"
                      size={16}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white/95">{action.label}</p>
                        <span className="rounded bg-cyan/10 border border-cyan/20 px-1.5 py-0.5 font-mono text-[10px] text-[#a2ddeb]">
                          {Math.round(action.confidence * 100)}% Match
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        {action.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40 font-mono">
              <span>Trace: {agentRun.evidence.traceId}</span>
              <span className="text-cyan">Status: {agentRun.status}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="mx-auto grid max-w-7xl gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {metricCards.map((card) => (
          <div
            className="rounded-lg border border-white/8 bg-white/[0.02] p-5 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
            key={card.label}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{card.label}</p>
              <card.icon className="text-cyan" size={18} />
            </div>
            <p className="mt-3 font-mono text-4xl font-semibold tracking-wider text-cyan drop-shadow-[0_0_5px_rgba(27,191,224,0.3)]">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-white/40">{card.note}</p>
          </div>
        ))}
      </section>

      <ApiKeySetupAgent />

      <SaasAccountPanel
        initialAccount={initialAccount}
        initialSummary={accountSummary}
      />

      <ServicePulseWorkbench initialRun={agentRun} />

      <JobInboxPanel initialJobs={initialJobs} initialSummary={jobSummary} />

      <PilotCrmPanel initialPilots={initialPilots} initialSummary={pilotSummary} />

      <SubmissionDashboard ledger={ledger} brief={submissionBrief} />

      <ProofPacketPanel packet={proofPacket} />

      {/* Secondary Pipeline and Pilots Info */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="font-mono text-xs text-cyan">Volume Funnel</p>
              <h2 className="text-lg font-bold text-white">Sales Pipeline</h2>
            </div>
            <Activity className="text-cyan animate-pulse" size={20} />
          </div>
          <div className="mt-6 space-y-4">
            {pipeline.map((stage) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white/80">{stage.stage}</span>
                  <span className="font-mono text-[#a2ddeb]">
                    {stage.count} jobs ({stage.value})
                  </span>
                </div>
                <div className="h-1.5 w-full rounded bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-cyan to-[#a2ddeb] shadow-[0_0_8px_#1BBFE0]"
                    style={{ width: `${Math.min(stage.count * 5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="font-mono text-xs text-cyan font-semibold">Demo Cohort</p>
              <h2 className="text-lg font-bold text-white">Customer Templates</h2>
            </div>
            <UsersRound className="text-cyan" size={20} />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {customers.map((customer) => (
              <div
                className="rounded border border-white/5 bg-white/[0.01] p-4 hover:bg-white/[0.03] transition flex flex-col justify-between"
                key={customer.name}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold truncate text-white">
                      {customer.name}
                    </h3>
                    <span className="shrink-0 rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[9px] font-semibold text-emerald-400">
                      {customer.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-white/50">{customer.segment}</p>
                </div>
                <div className="mt-4">
                  <p className="font-mono text-xl font-bold text-cyan">
                    {customer.fee}
                  </p>
                  <p className="text-[10px] text-white/40 leading-tight mt-1">
                    {customer.outcome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational Proof cards */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-8 sm:grid-cols-3 lg:px-8">
        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <CalendarCheck className="text-cyan animate-pulse" size={20} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Job Schedule</h2>
          </div>
          <p className="mt-4 font-mono text-3xl font-bold text-cyan">
            {agentRun.booking.window}
          </p>
          <p className="mt-2 text-xs text-white/60">
            Technician <strong className="text-white">{agentRun.booking.technician}</strong> assigned. Customer
            confirmation message drafted and queued.
          </p>
        </div>

        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <FileText className="text-amber-400" size={20} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Financial Details</h2>
          </div>
          <p className="mt-4 font-mono text-3xl font-bold text-amber-400">
            ${agentRun.quote.amount}
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-white/60">
            {agentRun.quote.lineItems.map((item) => (
              <li className="flex items-center gap-2 truncate" key={item}>
                <span className="size-1 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-cyan/30 bg-cyan/[0.01] p-5 shadow-[0_0_15px_rgba(27,191,224,0.02)]">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <ShieldCheck className="text-cyan" size={20} />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Submission Envelope</h2>
          </div>
          <div className="mt-4 space-y-2 font-mono text-[10px] text-white/60">
            <p className="truncate">Model: <span className="text-white">{agentRun.evidence.model}</span></p>
            <p className="truncate">Cloud: <span className="text-white">{agentRun.evidence.googleCloudProduct}</span></p>
            <p className="truncate">Trace: <span className="text-[#a2ddeb]">{agentRun.evidence.traceId}</span></p>
            <p className="truncate">Source: <span className="text-white">{agentRun.evidence.source}</span></p>
            <p className="truncate">Logged decisions: <span className="text-white">{agentRun.evidence.loggedDecisions}</span></p>
          </div>
        </div>
      </section>

      {/* Production Log Stream Footer */}
      <section className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-lg border border-white/8 bg-black/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-ping" />
                <p className="font-mono text-xs tracking-wider text-cyan">Realtime Trace Stream</p>
              </div>
              <h2 className="mt-1 text-xl font-bold text-white">
                Traceable AI Decision Ledger
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 font-mono">
              <Clock3 size={14} className="text-cyan" />
              Demo Logs
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {evidenceEvents.map((event) => (
              <div
                className="rounded border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] p-4 transition font-mono"
                key={event.event}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px]">
                  <span className="text-[#a2ddeb]">{event.time}</span>
                  <span className="text-white/30">{event.trace}</span>
                </div>
                <h3 className="mt-3 text-xs font-bold text-white">{event.event}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-white/50">
                  {event.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
