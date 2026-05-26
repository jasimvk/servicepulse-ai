"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  Gauge,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  UserPlus,
  UsersRound
} from "lucide-react";
import type {
  AccountSettings,
  AccountSummary,
  AccountPlan,
  TeamMemberRole,
  SubscriptionStatus
} from "@/lib/account-store";

type SaasAccountPanelProps = {
  autoLoad?: boolean;
  initialAccount: AccountSettings;
  initialSummary: AccountSummary;
};

type AccountPayload = {
  account: AccountSettings;
  summary: AccountSummary;
};

const planLabels: Record<AccountPlan, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro"
};

const statusLabels: Record<SubscriptionStatus, string> = {
  trialing: "trialing",
  active: "active",
  "past-due": "past due",
  canceled: "canceled"
};

export function SaasAccountPanel({
  autoLoad = true,
  initialAccount,
  initialSummary
}: SaasAccountPanelProps) {
  const [account, setAccount] = useState(initialAccount);
  const [summary, setSummary] = useState(initialSummary);
  const [draft, setDraft] = useState(initialAccount);
  const [memberDraft, setMemberDraft] = useState({
    name: "",
    email: "",
    role: "operator" as TeamMemberRole
  });
  const [status, setStatus] = useState("SaaS controls ready.");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    async function loadAccount() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/account", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Account load failed");
        }

        const payload = (await response.json()) as AccountPayload;
        setAccount(payload.account);
        setDraft(payload.account);
        setSummary(payload.summary);
        setStatus("Account synced.");
      } catch {
        setStatus("Using local account settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadAccount();
  }, [autoLoad]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setStatus("Saving account...");

    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          account: {
            ...draft,
            monthlyPrice: Number(draft.monthlyPrice),
            seatsIncluded: Number(draft.seatsIncluded),
            seatsUsed: Number(draft.seatsUsed),
            usage: {
              agentRunsThisMonth: Number(draft.usage.agentRunsThisMonth),
              jobsThisMonth: Number(draft.usage.jobsThisMonth),
              pilotsThisMonth: Number(draft.usage.pilotsThisMonth)
            },
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error("Account save failed");
      }

      const payload = (await response.json()) as AccountPayload;
      setAccount(payload.account);
      setDraft(payload.account);
      setSummary(payload.summary);
      setStatus("Account saved.");
    } catch {
      setStatus("Account save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function addTeamMember() {
    if (!memberDraft.email.trim()) {
      setStatus("Invite email required.");
      return;
    }

    const email = memberDraft.email.trim();
    setDraft((current) => ({
      ...current,
      teamMembers: [
        ...current.teamMembers,
        {
          id: slugify(email),
          name: memberDraft.name.trim() || email,
          email,
          role: memberDraft.role,
          status: "invited",
          updatedAt: new Date().toISOString()
        }
      ]
    }));
    setMemberDraft({ name: "", email: "", role: "operator" });
    setStatus("Seat staged. Save account to persist.");
  }

  const readyLabel = summary.readyForBilling ? "Ready: yes" : "Ready: no";

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <p className="pixel-text text-xs tracking-wider text-cyan">
              SaaS Control Plane
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">SaaS Account</h2>
          </div>
          <div className="flex items-center gap-2 rounded border border-cyan/20 bg-cyan/5 px-3 py-1.5 font-mono text-xs text-[#a2ddeb]">
            {isLoading ? (
              <Loader2 className="animate-spin text-cyan" size={14} />
            ) : (
              <RefreshCw className="text-cyan" size={14} />
            )}
            {status}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <AccountMetric icon={ShieldCheck} label="Plan" value={summary.planLabel} />
          <AccountMetric
            icon={CreditCard}
            label="Recurring"
            value={`$${summary.monthlyRecurringRevenue}`}
          />
          <AccountMetric
            icon={UsersRound}
            label="Seats"
            value={`Seats ${summary.seatsUsed}/${summary.seatsIncluded}`}
          />
          <AccountMetric
            icon={Gauge}
            label="Launch"
            value={`Launch ${summary.goLiveScore}%`}
          />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded border border-white/5 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {account.workspaceName}
                </h3>
                <p className="mt-1 font-mono text-xs text-white/50">
                  {planLabels[account.plan]} · {statusLabels[account.subscriptionStatus]}
                </p>
              </div>
              <span className="rounded border border-cyan/25 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan">
                {readyLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniFact label="Owner" value={account.ownerEmail || "not set"} />
              <MiniFact label="Billing" value={account.billingCycle} />
              <MiniFact label="Region" value={account.dataRegion.toUpperCase()} />
              <MiniFact label="Trial ends" value={account.trialEndsAt} />
              <MiniFact label="Active seats" value={summary.activeMembers.toString()} />
              <MiniFact label="Invited" value={summary.invitedMembers.toString()} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AccountLink href={account.checkoutUrl} label="Checkout" />
              <AccountLink href={account.customerPortalUrl} label="Portal" />
            </div>

            <div className="mt-4 rounded border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold text-white">Launch Checklist</h3>
                <span className="font-mono text-xs text-cyan">
                  Launch {summary.goLiveScore}%
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {summary.goLiveChecklist.map((item) => (
                  <div
                    className="flex items-center gap-2 rounded border border-white/5 bg-black/20 px-3 py-2 text-xs text-white/70"
                    key={item.id}
                  >
                    {item.ready ? (
                      <CheckCircle2 className="text-emerald-300" size={14} />
                    ) : (
                      <Circle className="text-white/25" size={14} />
                    )}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-cyan">
                <BarChart3 size={16} />
                <h3 className="text-xs font-bold text-white">Plan Usage</h3>
              </div>
              <div className="mt-3 space-y-3">
                <UsageBar
                  label="Agent runs"
                  meter={summary.usage.agentRuns}
                />
                <UsageBar label="Jobs" meter={summary.usage.jobs} />
                <UsageBar label="Pilots" meter={summary.usage.pilots} />
              </div>
            </div>

            <div className="mt-4 rounded border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-cyan">
                <UsersRound size={16} />
                <h3 className="text-xs font-bold text-white">Team Seats</h3>
              </div>
              <div className="mt-3 space-y-2">
                {account.teamMembers.length === 0 ? (
                  <div className="rounded border border-dashed border-white/10 bg-black/20 px-3 py-3 text-xs text-white/45">
                    No seats assigned.
                  </div>
                ) : (
                  account.teamMembers.map((member) => (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded border border-white/5 bg-black/20 px-3 py-2"
                      key={member.id}
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {member.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-white/45">
                          {member.email} · {member.role}
                        </p>
                      </div>
                      <span className="rounded border border-cyan/25 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan">
                        {member.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <form
            className="rounded border border-white/5 bg-black/20 p-4"
            onSubmit={saveSettings}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">Workspace Setup</h3>
              <CreditCard className="text-cyan" size={17} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <AccountInput
                label="Workspace"
                value={draft.workspaceName}
                onChange={(workspaceName) =>
                  setDraft((current) => ({ ...current, workspaceName }))
                }
              />
              <AccountInput
                label="Workspace slug"
                value={draft.workspaceSlug}
                onChange={(workspaceSlug) =>
                  setDraft((current) => ({ ...current, workspaceSlug }))
                }
              />
              <AccountInput
                label="Owner email"
                value={draft.ownerEmail}
                onChange={(ownerEmail) =>
                  setDraft((current) => ({ ...current, ownerEmail }))
                }
              />
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Plan
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.plan}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      plan: event.target.value as AccountPlan
                    }))
                  }
                >
                  {Object.entries(planLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Status
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.subscriptionStatus}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      subscriptionStatus: event.target.value as SubscriptionStatus
                    }))
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Billing
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.billingCycle}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      billingCycle: event.target.value as AccountSettings["billingCycle"]
                    }))
                  }
                >
                  <option value="monthly">monthly</option>
                  <option value="annual">annual</option>
                </select>
              </label>
              <AccountInput
                label="Price"
                type="number"
                value={draft.monthlyPrice.toString()}
                onChange={(monthlyPrice) =>
                  setDraft((current) => ({
                    ...current,
                    monthlyPrice: Number(monthlyPrice)
                  }))
                }
              />
              <AccountInput
                label="Seats used"
                type="number"
                value={(draft.teamMembers.length || draft.seatsUsed).toString()}
                onChange={(seatsUsed) =>
                  setDraft((current) => ({
                    ...current,
                    seatsUsed: Number(seatsUsed)
                  }))
                }
              />
              <AccountInput
                label="Seats included"
                type="number"
                value={draft.seatsIncluded.toString()}
                onChange={(seatsIncluded) =>
                  setDraft((current) => ({
                    ...current,
                    seatsIncluded: Number(seatsIncluded)
                  }))
                }
              />
              <AccountInput
                label="Trial ends"
                value={draft.trialEndsAt}
                onChange={(trialEndsAt) =>
                  setDraft((current) => ({ ...current, trialEndsAt }))
                }
              />
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Region
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.dataRegion}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      dataRegion: event.target.value as AccountSettings["dataRegion"]
                    }))
                  }
                >
                  <option value="us">US</option>
                  <option value="eu">EU</option>
                  <option value="uae">UAE</option>
                </select>
              </label>
              <AccountInput
                label="Checkout URL"
                value={draft.checkoutUrl}
                onChange={(checkoutUrl) =>
                  setDraft((current) => ({ ...current, checkoutUrl }))
                }
              />
              <AccountInput
                label="Portal URL"
                value={draft.customerPortalUrl}
                onChange={(customerPortalUrl) =>
                  setDraft((current) => ({ ...current, customerPortalUrl }))
                }
              />
              <AccountInput
                label="Agent runs"
                type="number"
                value={draft.usage.agentRunsThisMonth.toString()}
                onChange={(agentRunsThisMonth) =>
                  setDraft((current) => ({
                    ...current,
                    usage: {
                      ...current.usage,
                      agentRunsThisMonth: Number(agentRunsThisMonth)
                    }
                  }))
                }
              />
              <AccountInput
                label="Jobs this month"
                type="number"
                value={draft.usage.jobsThisMonth.toString()}
                onChange={(jobsThisMonth) =>
                  setDraft((current) => ({
                    ...current,
                    usage: {
                      ...current.usage,
                      jobsThisMonth: Number(jobsThisMonth)
                    }
                  }))
                }
              />
              <AccountInput
                label="Pilots this month"
                type="number"
                value={draft.usage.pilotsThisMonth.toString()}
                onChange={(pilotsThisMonth) =>
                  setDraft((current) => ({
                    ...current,
                    usage: {
                      ...current.usage,
                      pilotsThisMonth: Number(pilotsThisMonth)
                    }
                  }))
                }
              />
            </div>

            <div className="mt-4 rounded border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold text-white">Add Seat</h3>
                <UserPlus className="text-cyan" size={16} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_0.8fr_auto]">
                <AccountInput
                  label="Name"
                  value={memberDraft.name}
                  onChange={(name) =>
                    setMemberDraft((current) => ({ ...current, name }))
                  }
                />
                <AccountInput
                  label="Email"
                  value={memberDraft.email}
                  onChange={(email) =>
                    setMemberDraft((current) => ({ ...current, email }))
                  }
                />
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                  Role
                  <select
                    className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                    value={memberDraft.role}
                    onChange={(event) =>
                      setMemberDraft((current) => ({
                        ...current,
                        role: event.target.value as TeamMemberRole
                      }))
                    }
                  >
                    <option value="operator">operator</option>
                    <option value="technician">technician</option>
                    <option value="owner">owner</option>
                  </select>
                </label>
                <button
                  className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded border border-cyan/35 bg-cyan/10 px-3 text-xs font-bold uppercase tracking-wider text-cyan transition hover:bg-cyan/15"
                  type="button"
                  onClick={addTeamMember}
                >
                  <UserPlus size={14} />
                  Add
                </button>
              </div>
            </div>

            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-cyan px-4 py-3 text-sm font-bold uppercase tracking-wider text-near-black shadow-[0_0_15px_rgba(27,191,224,0.2)] transition hover:bg-[#16A8C6] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {isSaving ? "Saving Account..." : "Save Account"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function AccountMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CreditCard;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded border border-white/5 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
          {label}
        </p>
        <Icon className="text-cyan" size={15} />
      </div>
      <p className="mt-2 font-mono text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function AccountInput({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "number" | "text";
  value: string;
}) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
      {label}
      <input
        className="mt-1.5 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan focus:ring-1 focus:ring-cyan/35"
        min={type === "number" ? 0 : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/5 bg-white/[0.02] px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-xs text-white">{value}</p>
    </div>
  );
}

function UsageBar({
  label,
  meter
}: {
  label: string;
  meter: AccountSummary["usage"]["agentRuns"];
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-white/65">
          {label} {meter.used}/{meter.limit}
        </span>
        <span className="font-mono text-white/45">{meter.remaining} left</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-white/5">
        <div
          className="h-full rounded bg-cyan"
          style={{ width: `${meter.percentUsed}%` }}
        />
      </div>
    </div>
  );
}

function AccountLink({ href, label }: { href: string; label: string }) {
  const isReady = Boolean(href);

  if (!isReady) {
    return (
      <div className="flex items-center justify-between gap-3 rounded border border-dashed border-white/10 bg-white/[0.01] px-3 py-2 text-xs text-white/45">
        <span>{label}</span>
        <span>not set</span>
      </div>
    );
  }

  return (
    <a
      className="flex items-center justify-between gap-3 rounded border border-cyan/25 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan transition hover:bg-cyan/15"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <span>{label}</span>
      <ExternalLink size={13} />
    </a>
  );
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `member-${Date.now()}`;
}
