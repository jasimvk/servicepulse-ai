"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Briefcase,
  CalendarCheck,
  Handshake,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import type { PilotRecord, PilotSummary } from "@/lib/pilot-store";

type PilotCrmPanelProps = {
  autoLoad?: boolean;
  initialPilots: PilotRecord[];
  initialSummary: PilotSummary;
};

type PilotPayload = {
  pilots: PilotRecord[];
  summary: PilotSummary;
};

const blankPilot: PilotRecord = {
  id: "",
  businessName: "",
  segment: "AC repair",
  ownerName: "",
  location: "Dubai",
  channel: "google-maps",
  stage: "target",
  offer: "$49 setup + $199/month after 7 days",
  setupFee: 49,
  monthlyPrice: 199,
  paymentUrl: "",
  testimonialUrl: "",
  evidenceUrl: "",
  permissionStatus: "needed",
  nextAction: "Send 7-day pilot offer",
  nextActionDue: "Today",
  notes: "",
  updatedAt: ""
};

const stageLabels: Record<PilotRecord["stage"], string> = {
  target: "target",
  contacted: "contacted",
  "demo-booked": "demo booked",
  "pilot-paid": "pilot paid",
  "evidence-collected": "evidence collected"
};

const pilotStages: PilotRecord["stage"][] = [
  "target",
  "contacted",
  "demo-booked",
  "pilot-paid",
  "evidence-collected"
];

const channelLabels: Record<PilotRecord["channel"], string> = {
  "google-maps": "Google Maps",
  referral: "Referral",
  "walk-in": "Walk-in",
  website: "Website",
  other: "Other"
};

export function PilotCrmPanel({
  autoLoad = true,
  initialPilots,
  initialSummary
}: PilotCrmPanelProps) {
  const [pilots, setPilots] = useState(initialPilots);
  const [summary, setSummary] = useState(initialSummary);
  const [draft, setDraft] = useState(blankPilot);
  const [status, setStatus] = useState("Ready to capture first real pilot.");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    async function loadPilots() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/pilots", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Pilot pipeline load failed");
        }

        const payload = (await response.json()) as PilotPayload;
        setPilots(payload.pilots);
        setSummary(payload.summary);
        setStatus("Pilot board synced.");
      } catch {
        setStatus("Using local pilot board.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPilots();
  }, [autoLoad]);

  async function savePilot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.businessName.trim()) {
      setStatus("Business name required.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving pilot...");

    try {
      const response = await fetch("/api/pilots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pilot: {
            ...draft,
            id: draft.id || slugify(draft.businessName),
            setupFee: Number(draft.setupFee),
            monthlyPrice: Number(draft.monthlyPrice),
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error("Pilot save failed");
      }

      const payload = (await response.json()) as PilotPayload;
      setPilots(payload.pilots);
      setSummary(payload.summary);
      setDraft(blankPilot);
      setStatus("Pilot saved. Evidence board updated.");
    } catch {
      setStatus("Pilot save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function editPilot(pilot: PilotRecord) {
    setDraft(pilot);
    setStatus(`Editing ${pilot.businessName}.`);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <p className="pixel-text text-xs tracking-wider text-cyan">
              Real Business Pipeline
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">Pilot CRM</h2>
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

        <div className="mt-5 grid gap-4 md:grid-cols-5">
          <PilotMetric icon={Briefcase} label="Real pilots" value={summary.total} />
          <PilotMetric icon={Handshake} label="Paid pilots" value={summary.paidPilots} />
          <PilotMetric icon={ShieldCheck} label="Evidence" value={summary.evidenceReady} />
          <PilotMetric icon={WalletCards} label="Setup cash" value={`$${summary.setupRevenue}`} />
          <PilotMetric icon={CalendarCheck} label="Monthly" value={`$${summary.monthlyCommitted}`} />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="rounded border border-white/5 bg-black/20 p-4"
            onSubmit={savePilot}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">Add Pilot</h3>
              <Plus className="text-cyan" size={17} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PilotInput
                label="Business"
                value={draft.businessName}
                onChange={(businessName) =>
                  setDraft((current) => ({ ...current, businessName }))
                }
              />
              <PilotInput
                label="Owner"
                value={draft.ownerName}
                onChange={(ownerName) =>
                  setDraft((current) => ({ ...current, ownerName }))
                }
              />
              <PilotInput
                label="Segment"
                value={draft.segment}
                onChange={(segment) =>
                  setDraft((current) => ({ ...current, segment }))
                }
              />
              <PilotInput
                label="Location"
                value={draft.location}
                onChange={(location) =>
                  setDraft((current) => ({ ...current, location }))
                }
              />
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Stage
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.stage}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      stage: event.target.value as PilotRecord["stage"]
                    }))
                  }
                >
                  {pilotStages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stageLabels[stage]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Source
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.channel}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      channel: event.target.value as PilotRecord["channel"]
                    }))
                  }
                >
                  {Object.entries(channelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <PilotInput
                label="Setup fee"
                type="number"
                value={draft.setupFee.toString()}
                onChange={(setupFee) =>
                  setDraft((current) => ({
                    ...current,
                    setupFee: Number(setupFee)
                  }))
                }
              />
              <PilotInput
                label="Monthly"
                type="number"
                value={draft.monthlyPrice.toString()}
                onChange={(monthlyPrice) =>
                  setDraft((current) => ({
                    ...current,
                    monthlyPrice: Number(monthlyPrice)
                  }))
                }
              />
              <PilotInput
                label="Next action"
                value={draft.nextAction}
                onChange={(nextAction) =>
                  setDraft((current) => ({ ...current, nextAction }))
                }
              />
              <PilotInput
                label="Due"
                value={draft.nextActionDue}
                onChange={(nextActionDue) =>
                  setDraft((current) => ({ ...current, nextActionDue }))
                }
              />
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/55">
                Permission
                <select
                  className="mt-1.5 w-full rounded border border-white/10 bg-[#080808] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                  value={draft.permissionStatus}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      permissionStatus:
                        event.target.value as PilotRecord["permissionStatus"]
                    }))
                  }
                >
                  <option value="needed">needed</option>
                  <option value="granted">granted</option>
                  <option value="declined">declined</option>
                </select>
              </label>
              <PilotInput
                label="Payment link"
                value={draft.paymentUrl}
                onChange={(paymentUrl) =>
                  setDraft((current) => ({ ...current, paymentUrl }))
                }
              />
              <PilotInput
                label="Evidence link"
                value={draft.evidenceUrl}
                onChange={(evidenceUrl) =>
                  setDraft((current) => ({ ...current, evidenceUrl }))
                }
              />
              <PilotInput
                label="Testimonial link"
                value={draft.testimonialUrl}
                onChange={(testimonialUrl) =>
                  setDraft((current) => ({ ...current, testimonialUrl }))
                }
              />
            </div>

            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Notes
              <textarea
                className="mt-1.5 min-h-20 w-full resize-y rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                value={draft.notes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    notes: event.target.value
                  }))
                }
              />
            </label>

            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-cyan px-4 py-3 text-sm font-bold uppercase tracking-wider text-near-black shadow-[0_0_15px_rgba(27,191,224,0.2)] transition hover:bg-[#16A8C6] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {isSaving ? "Saving Pilot..." : "Save Pilot"}
            </button>
          </form>

          <div className="rounded border border-white/5 bg-black/20 p-4">
            <div className="grid gap-2 sm:grid-cols-5">
              {pilotStages.map((stage) => (
                <div
                  className="rounded border border-white/5 bg-white/[0.02] p-3"
                  key={stage}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                    {stageLabels[stage]}
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold text-cyan">
                    {summary.stageCounts[stage]}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {pilots.length === 0 ? (
                <div className="rounded border border-dashed border-white/10 bg-white/[0.01] p-5">
                  <p className="text-sm font-semibold text-white">
                    No real pilots saved yet.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Add businesses only after outreach, payment, permission, or
                    evidence exists.
                  </p>
                </div>
              ) : (
                pilots.map((pilot) => (
                  <button
                    className="w-full rounded border border-white/5 bg-white/[0.02] p-4 text-left transition hover:border-cyan/25 hover:bg-white/[0.04]"
                    key={pilot.id}
                    onClick={() => editPilot(pilot)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {pilot.businessName}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                          <span>{pilot.segment}</span>
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} />
                            {pilot.location}
                          </span>
                        </div>
                      </div>
                      <span className="rounded border border-cyan/25 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan">
                        {stageLabels[pilot.stage]}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <MiniFact label="Setup" value={`$${pilot.setupFee}`} />
                      <MiniFact label="Monthly" value={`$${pilot.monthlyPrice}`} />
                      <MiniFact label="Permission" value={pilot.permissionStatus} />
                    </div>

                    <p className="mt-3 text-xs text-white/60">
                      {pilot.nextAction} · {pilot.nextActionDue}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PilotMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Briefcase;
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

function PilotInput({
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
    <div className="rounded border border-white/5 bg-black/20 px-3 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-xs text-white">{value}</p>
    </div>
  );
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `pilot-${Date.now()}`;
}
