"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CalendarCheck,
  ClipboardList,
  Loader2,
  MapPin,
  MessageSquareText,
  Plus,
  RefreshCw,
  Save,
  WalletCards
} from "lucide-react";
import type { JobRecord, JobSummary } from "@/lib/job-store";

type JobInboxPanelProps = {
  autoLoad?: boolean;
  initialJobs: JobRecord[];
  initialSummary: JobSummary;
};

type JobPayload = {
  jobs: JobRecord[];
  summary: JobSummary;
};

const blankJob: JobRecord = {
  id: "",
  customerName: "",
  customerContact: "",
  businessName: "CoolFix AC",
  channel: "whatsapp",
  message: "",
  service: "AC leak repair",
  location: "Dubai",
  urgency: "today",
  stage: "captured",
  quoteAmount: 420,
  scheduledWindow: "Today, 4:30 PM - 6:00 PM",
  paymentUrl: "",
  evidenceUrl: "",
  nextAction: "Qualify and send quote",
  notes: "",
  updatedAt: ""
};

const jobStages: JobRecord["stage"][] = [
  "captured",
  "qualified",
  "quoted",
  "booked",
  "paid",
  "follow-up"
];

const stageLabels: Record<JobRecord["stage"], string> = {
  captured: "captured",
  qualified: "qualified",
  quoted: "quoted",
  booked: "booked",
  paid: "paid",
  "follow-up": "follow up"
};

const channelLabels: Record<JobRecord["channel"], string> = {
  whatsapp: "WhatsApp",
  web: "Web",
  email: "Email",
  phone: "Phone",
  other: "Other"
};

export function JobInboxPanel({
  autoLoad = true,
  initialJobs,
  initialSummary
}: JobInboxPanelProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [summary, setSummary] = useState(initialSummary);
  const [draft, setDraft] = useState(blankJob);
  const [status, setStatus] = useState("Ready to save customer work.");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    async function loadJobs() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Job inbox load failed");
        }

        const payload = (await response.json()) as JobPayload;
        setJobs(payload.jobs);
        setSummary(payload.summary);
        setStatus("Job inbox synced.");
      } catch {
        setStatus("Using local job inbox.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadJobs();
  }, [autoLoad]);

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.customerName.trim()) {
      setStatus("Customer name required.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving job...");

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          job: {
            ...draft,
            id: draft.id || slugify(`${draft.customerName}-${draft.service}`),
            quoteAmount: Number(draft.quoteAmount),
            updatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error("Job save failed");
      }

      const payload = (await response.json()) as JobPayload;
      setJobs(payload.jobs);
      setSummary(payload.summary);
      setDraft(blankJob);
      setStatus("Job saved.");
    } catch {
      setStatus("Job save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  function editJob(job: JobRecord) {
    setDraft(job);
    setStatus(`Editing ${job.customerName}.`);
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <p className="pixel-text text-xs tracking-wider text-cyan">
              Owner Workflow
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">Job Inbox</h2>
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
          <JobMetric icon={ClipboardList} label="Open jobs" value={summary.openJobs} />
          <JobMetric icon={MessageSquareText} label="Quoted" value={`$${summary.quotedValue}`} />
          <JobMetric icon={CalendarCheck} label="Booked" value={summary.bookedJobs} />
          <JobMetric icon={WalletCards} label="Paid jobs" value={summary.paidJobs} />
          <JobMetric icon={BadgeDollarSign} label="Paid revenue" value={`$${summary.paidRevenue}`} />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form
            className="rounded border border-white/5 bg-black/20 p-4"
            onSubmit={saveJob}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">Add Customer Job</h3>
              <Plus className="text-cyan" size={17} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <JobInput
                label="Customer"
                value={draft.customerName}
                onChange={(customerName) =>
                  setDraft((current) => ({ ...current, customerName }))
                }
              />
              <JobInput
                label="Contact"
                value={draft.customerContact}
                onChange={(customerContact) =>
                  setDraft((current) => ({ ...current, customerContact }))
                }
              />
              <JobInput
                label="Business"
                value={draft.businessName}
                onChange={(businessName) =>
                  setDraft((current) => ({ ...current, businessName }))
                }
              />
              <JobInput
                label="Service"
                value={draft.service}
                onChange={(service) =>
                  setDraft((current) => ({ ...current, service }))
                }
              />
              <JobInput
                label="Location"
                value={draft.location}
                onChange={(location) =>
                  setDraft((current) => ({ ...current, location }))
                }
              />
              <JobInput
                label="Quote"
                type="number"
                value={draft.quoteAmount.toString()}
                onChange={(quoteAmount) =>
                  setDraft((current) => ({
                    ...current,
                    quoteAmount: Number(quoteAmount)
                  }))
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
                      stage: event.target.value as JobRecord["stage"]
                    }))
                  }
                >
                  {jobStages.map((stage) => (
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
                      channel: event.target.value as JobRecord["channel"]
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
              <JobInput
                label="Schedule"
                value={draft.scheduledWindow}
                onChange={(scheduledWindow) =>
                  setDraft((current) => ({ ...current, scheduledWindow }))
                }
              />
              <JobInput
                label="Next action"
                value={draft.nextAction}
                onChange={(nextAction) =>
                  setDraft((current) => ({ ...current, nextAction }))
                }
              />
              <JobInput
                label="Payment link"
                value={draft.paymentUrl}
                onChange={(paymentUrl) =>
                  setDraft((current) => ({ ...current, paymentUrl }))
                }
              />
              <JobInput
                label="Evidence link"
                value={draft.evidenceUrl}
                onChange={(evidenceUrl) =>
                  setDraft((current) => ({ ...current, evidenceUrl }))
                }
              />
            </div>

            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-white/55">
              Customer Message
              <textarea
                className="mt-1.5 min-h-20 w-full resize-y rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                value={draft.message}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    message: event.target.value
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
              {isSaving ? "Saving Job..." : "Save Job"}
            </button>
          </form>

          <div className="rounded border border-white/5 bg-black/20 p-4">
            <div className="grid gap-2 sm:grid-cols-6">
              {jobStages.map((stage) => (
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
              {jobs.length === 0 ? (
                <div className="rounded border border-dashed border-white/10 bg-white/[0.01] p-5">
                  <p className="text-sm font-semibold text-white">
                    No customer jobs saved yet.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">
                    Save jobs from lead to quote, booking, payment, and follow-up.
                  </p>
                </div>
              ) : (
                jobs.map((job) => (
                  <button
                    className="w-full rounded border border-white/5 bg-white/[0.02] p-4 text-left transition hover:border-cyan/25 hover:bg-white/[0.04]"
                    key={job.id}
                    onClick={() => editJob(job)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {job.customerName}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                          <span>{job.service}</span>
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} />
                            {job.location}
                          </span>
                        </div>
                      </div>
                      <span className="rounded border border-cyan/25 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] uppercase text-cyan">
                        {stageLabels[job.stage]}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <MiniFact label="Quote" value={`$${job.quoteAmount}`} />
                      <MiniFact label="Schedule" value={job.scheduledWindow} />
                      <MiniFact label="Source" value={channelLabels[job.channel]} />
                    </div>

                    <p className="mt-3 text-xs text-white/60">
                      {job.nextAction}
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

function JobMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ClipboardList;
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

function JobInput({
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

  return slug || `job-${Date.now()}`;
}
