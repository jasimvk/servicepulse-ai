import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  CreditCard,
  FileJson2,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import type {
  AccountPlan,
  AccountSettings,
  AccountSummary
} from "@/lib/account-store";

type MinimalSaasConsoleProps = {
  account: AccountSettings;
  summary: AccountSummary;
};

const productModules = [
  {
    label: "AI Desk",
    detail: "Lead intake and quote workflow",
    icon: MessageSquareText
  },
  {
    label: "Job Inbox",
    detail: "Requests, invoices, payment status",
    icon: BriefcaseBusiness
  },
  {
    label: "Customer CRM",
    detail: "Customers, owners, and permissions",
    icon: UsersRound
  },
  {
    label: "Ops Report",
    detail: "Exportable operating summary",
    icon: FileJson2
  }
] as const;

export function MinimalSaasConsole({
  account,
  summary
}: MinimalSaasConsoleProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#161616]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded border border-black/10 bg-white text-[#161616]">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">ServicePulse</p>
              <p className="text-xs text-black/50">{account.workspaceSlug}</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              className="rounded border border-black/10 bg-white px-3 py-2 text-black/70 transition hover:border-black/25 hover:text-black"
              href="/"
            >
              Product
            </Link>
            <form action="/api/billing/checkout" method="POST">
              <input name="plan" type="hidden" value={account.plan} />
              <button
                className="inline-flex items-center gap-2 rounded bg-[#161616] px-3 py-2 font-semibold text-white transition hover:bg-black"
                type="submit"
              >
                Subscribe
                <ArrowRight size={14} />
              </button>
            </form>
          </nav>
        </header>

        <section className="grid flex-1 gap-5 py-6 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-5">
            <div className="rounded border border-black/10 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-black/45">
                Workspace
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {account.workspaceName}
              </h1>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Plan" value={summary.planLabel} />
                <Metric
                  label="Launch"
                  value={`Launch ${summary.goLiveScore}%`}
                />
                <Metric
                  label="Billing"
                  value={summary.readyForBilling ? "Ready" : "Setup"}
                />
                <Metric
                  label="Seats"
                  value={`${summary.seatsUsed}/${summary.seatsIncluded}`}
                />
              </div>
            </div>

            <div className="rounded border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Go Live</h2>
                <span className="text-xs text-black/45">
                  {summary.launchReady ? "Ready" : "Setup"}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {summary.goLiveChecklist.map((item) => (
                  <div
                    className="flex items-center gap-2 text-sm text-black/70"
                    key={item.id}
                  >
                    {item.ready ? (
                      <CheckCircle2 className="text-emerald-600" size={15} />
                    ) : (
                      <Circle className="text-black/25" size={15} />
                    )}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-black/10 bg-white p-5">
              <div className="flex items-center gap-2">
                <CreditCard size={16} />
                <h2 className="text-sm font-semibold">Billing</h2>
              </div>
              <p className="mt-4 font-mono text-3xl font-semibold">
                ${summary.monthlyRecurringRevenue}
              </p>
              <p className="mt-1 text-xs text-black/45">
                {account.subscriptionStatus} · {account.billingCycle}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <BillingAction label="Checkout" plan={account.plan} />
                <BillingAction
                  disabled={!account.stripeCustomerId}
                  label="Portal"
                />
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded border border-black/10 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Product Modules</h2>
                <Link
                  className="text-xs font-semibold text-black/55"
                  href="/dashboard"
                >
                  Open console
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {productModules.map((module) => (
                  <div
                    className="rounded border border-black/10 bg-[#fbfbf9] p-4"
                    key={module.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <module.icon size={17} />
                      <span className="rounded border border-black/10 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-black/50">
                        included
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold">
                      {module.label}
                    </h3>
                    <p className="mt-1 text-xs text-black/50">{module.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Usage</h2>
                  <span className="text-xs text-black/45">this month</span>
                </div>
                <div className="mt-4 space-y-4">
                  <UsageMeter label="Agent runs" meter={summary.usage.agentRuns} />
                  <UsageMeter label="Jobs" meter={summary.usage.jobs} />
                  <UsageMeter label="Customers" meter={summary.usage.pilots} />
                </div>
              </div>

              <div className="rounded border border-black/10 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Team</h2>
                  <span className="text-xs text-black/45">
                    {summary.seatsAvailable} seats left
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  {account.teamMembers.length === 0 ? (
                    <div className="rounded border border-dashed border-black/15 bg-[#fbfbf9] px-3 py-3 text-sm text-black/45">
                      No team seats
                    </div>
                  ) : (
                    account.teamMembers.map((member) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded border border-black/10 bg-[#fbfbf9] px-3 py-3"
                        key={member.id}
                      >
                        <div>
                          <p className="text-sm font-semibold">{member.name}</p>
                          <p className="mt-0.5 text-xs text-black/45">
                            {member.email}
                          </p>
                        </div>
                        <span className="rounded border border-black/10 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-black/50">
                          {member.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div
              className="rounded border border-black/10 bg-white p-5"
              id="billing"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Settings</h2>
                  <p className="mt-1 text-xs text-black/45">
                    Region {account.dataRegion.toUpperCase()} · trial ends{" "}
                    {account.trialEndsAt}
                  </p>
                </div>
                <Link
                  className="inline-flex items-center gap-2 rounded border border-black/10 bg-[#fbfbf9] px-3 py-2 text-sm font-semibold"
                  href="/dashboard#billing"
                >
                  <Settings size={14} />
                  Manage workspace
                </Link>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-black/10 bg-[#fbfbf9] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

function UsageMeter({
  label,
  meter
}: {
  label: string;
  meter: AccountSummary["usage"]["agentRuns"];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>
          {label} {meter.used}/{meter.limit}
        </span>
        <span className="font-mono text-xs text-black/45">
          {meter.remaining} left
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded bg-black/10">
        <div
          className="h-full rounded bg-[#161616]"
          style={{ width: `${meter.percentUsed}%` }}
        />
      </div>
    </div>
  );
}

function BillingAction({
  disabled = false,
  label,
  plan
}: {
  disabled?: boolean;
  label: string;
  plan?: AccountPlan;
}) {
  if (disabled) {
    return (
      <span className="rounded border border-dashed border-black/15 px-3 py-2 text-center text-xs text-black/40">
        {label} after checkout
      </span>
    );
  }

  return (
    <form action={`/api/billing/${label.toLowerCase()}`} method="POST">
      {plan ? <input name="plan" type="hidden" value={plan} /> : null}
      <button
        className="w-full rounded border border-black/10 bg-[#fbfbf9] px-3 py-2 text-center text-xs font-semibold text-black/70 transition hover:border-black/25 hover:text-black"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
