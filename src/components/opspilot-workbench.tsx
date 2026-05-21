"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Save,
  Settings2,
  Sparkles
} from "lucide-react";
import {
  AgentRun,
  BusinessProfile,
  LeadInput,
  defaultBusinessProfile
} from "@/lib/opspilot";
import type { LeadAgentResponse } from "@/lib/gemini-agent";
import type { EvidenceEntry } from "@/lib/evidence-ledger";

type OpsPilotWorkbenchProps = {
  initialRun: AgentRun;
};

const defaultLead: LeadInput = {
  customer: "Maya Khan",
  message: "My AC is leaking water and I need someone today after 4pm in Jumeirah.",
  channel: "whatsapp",
  urgency: "today"
};

function cloneDefaultProfile(): BusinessProfile {
  return {
    ...defaultBusinessProfile,
    services: defaultBusinessProfile.services.map((service) => ({ ...service }))
  };
}

export function OpsPilotWorkbench({ initialRun }: OpsPilotWorkbenchProps) {
  const [profile, setProfile] = useState<BusinessProfile>(cloneDefaultProfile);
  const [lead, setLead] = useState<LeadInput>(defaultLead);
  const [run, setRun] = useState<AgentRun>(initialRun);
  const [mode, setMode] = useState<LeadAgentResponse["mode"]>("demo");
  const [latestEvidence, setLatestEvidence] = useState<EvidenceEntry | null>(
    null
  );
  const [notice, setNotice] = useState(
    "Ready for live Gemini once GEMINI_API_KEY is set."
  );
  const [profileStatus, setProfileStatus] = useState(
    "Profile loads from local storage when available."
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { profile: BusinessProfile };
        setProfile(payload.profile);
        setProfileStatus("Loaded saved profile.");
      } catch {
        setProfileStatus("Using default profile.");
      }
    }

    void loadProfile();
  }, []);

  async function saveProfile() {
    setIsSavingProfile(true);
    setProfileStatus("Saving profile...");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile })
      });

      if (!response.ok) {
        throw new Error("Profile save failed");
      }

      const payload = (await response.json()) as { profile: BusinessProfile };
      setProfile(payload.profile);
      setProfileStatus("Profile saved to local evidence workspace.");
    } catch {
      setProfileStatus("Profile save failed.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function runAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setError("");

    try {
      const response = await fetch("/api/agent/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile, lead })
      });

      if (!response.ok) {
        throw new Error("Agent run failed");
      }

      const payload = (await response.json()) as LeadAgentResponse;
      setRun(payload.run);
      setMode(payload.mode);
      setNotice(payload.notice);
      setLatestEvidence(payload.evidenceEntry);
      window.dispatchEvent(new Event("opspilot:evidence-updated"));
    } catch {
      setError("Agent run failed. Check the server log and Gemini API key.");
    } finally {
      setIsRunning(false);
    }
  }

  const primaryService = profile.services[0];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="rounded-lg border border-white/8 bg-white/[0.02] p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
          onSubmit={runAgent}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <p className="pixel-text text-xs tracking-wider text-cyan">
                Pilot Setup
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                Business Playbook
              </h2>
            </div>
            <Settings2 className="text-cyan" size={20} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Business Name
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                data-testid="business-name"
                value={profile.name}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Segment
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                data-testid="business-segment"
                value={profile.segment}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    segment: event.target.value
                  }))
                }
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 sm:col-span-2">
              Territory
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                data-testid="business-territory"
                value={profile.territory}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    territory: event.target.value
                  }))
                }
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Technician
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                data-testid="business-technician"
                value={profile.technician}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    technician: event.target.value
                  }))
                }
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Main Price (USD)
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                data-testid="main-price"
                min={0}
                type="number"
                value={primaryService.price}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    services: current.services.map((service, index) =>
                      index === 0
                        ? { ...service, price: Number(event.target.value) }
                        : service
                    )
                  }))
                }
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 sm:col-span-2">
              Main Service Description
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                data-testid="main-service"
                value={primaryService.name}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    services: current.services.map((service, index) =>
                      index === 0
                        ? { ...service, name: event.target.value }
                        : service
                    )
                  }))
                }
              />
            </label>
          </div>

          <div
            className="mt-5 rounded border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] text-white/55"
            data-testid="profile-status"
          >
            {profileStatus}
          </div>

          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded border border-cyan/35 bg-cyan/10 px-4 py-3 text-sm font-bold uppercase tracking-wider text-cyan cursor-pointer transition hover:bg-cyan/15 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="save-profile"
            disabled={isSavingProfile}
            onClick={saveProfile}
            type="button"
          >
            {isSavingProfile ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {isSavingProfile ? "Saving Profile..." : "Save Profile"}
          </button>

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-cyan hover:bg-[#16A8C6] px-4 py-3 text-sm font-bold uppercase tracking-wider text-near-black cursor-pointer transition shadow-[0_0_15px_rgba(27,191,224,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="execute-playbook"
            disabled={isRunning}
            type="submit"
          >
            {isRunning ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}
            {isRunning ? "Running Agent Playbook..." : "Execute Playbook"}
          </button>
        </form>

        <div className="rounded-lg border border-cyan/30 bg-cyan/[0.02] p-6 shadow-[0_0_20px_rgba(27,191,224,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div>
                <p className="pixel-text text-xs tracking-wider text-cyan">
                  Live Agent Console
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Lead Triage & Orchestration
                </h2>
              </div>
              <span className="rounded bg-cyan/15 border border-cyan/35 px-2.5 py-1 font-mono text-xs text-cyan">
                {mode === "live" ? "Gemini Live" : "Demo Mode"}
              </span>
            </div>

            <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-white/60">
              Customer Incoming Message
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition"
                value={lead.message}
                onChange={(event) =>
                  setLead((current) => ({
                    ...current,
                    message: event.target.value
                  }))
                }
              />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-cyan">
                    <MessageSquareText size={16} />
                    <p className="text-xs font-semibold">{run.customer}</p>
                  </div>
                  <p className="mt-4 font-mono text-3xl font-bold text-white">
                    ${run.quote.amount}
                  </p>
                  <p className="mt-2 text-xs text-white/60 leading-relaxed">
                    {run.booking.window} with {run.booking.technician}
                  </p>
                </div>
                
                <div>
                  <div className="mt-4 rounded bg-white/5 border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-white/70 leading-normal">
                    {notice}
                  </div>
                  {error ? (
                    <div className="mt-2 rounded bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 font-mono text-[10px] text-red-400">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                {run.actions.map((action) => (
                  <div
                    className="flex gap-3 rounded border border-white/5 bg-white/[0.01] p-3 hover:bg-white/[0.03] transition"
                    key={action.type}
                  >
                    <CheckCircle2
                      className="mt-0.5 shrink-0 text-emerald-400"
                      size={15}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white">{action.label}</p>
                        <span className="rounded bg-cyan/10 border border-cyan/20 px-1 py-0.5 font-mono text-[9px] text-[#a2ddeb]">
                          {Math.round(action.confidence * 100)}%
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-white/50 leading-relaxed">
                        {action.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-white/5 pt-4 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-white/40">
            <div className="flex items-center gap-1.5">
              <Bot size={13} className="text-cyan" />
              <span>Model: <strong className="text-white">{run.evidence.model}</strong></span>
            </div>
            <span>Trace: <strong className="text-white">{run.evidence.traceId}</strong></span>
            <span>Source: <strong className="text-white">{run.evidence.source}</strong></span>
          </div>
          {latestEvidence ? (
            <div
              className="mt-3 rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 font-mono text-[10px] text-emerald-400 leading-normal"
              data-testid="latest-evidence"
            >
              Evidence captured: {latestEvidence.proofType} | ${latestEvidence.metrics.revenueAttached} quoted value | {latestEvidence.metrics.loggedDecisions} decisions logged
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
