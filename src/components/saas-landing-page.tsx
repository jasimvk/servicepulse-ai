import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  Inbox,
  MessageSquareText,
  PhoneCall,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UsersRound
} from "lucide-react";
import Link from "next/link";

const workflow = [
  {
    label: "Lead intake",
    detail: "Capture web, phone, and chat requests in one queue.",
    icon: MessageSquareText
  },
  {
    label: "Job scheduling",
    detail: "Turn qualified requests into booked work with owner visibility.",
    icon: CalendarCheck
  },
  {
    label: "Invoice follow-up",
    detail: "Track sent invoices, payment status, and next actions.",
    icon: ReceiptText
  }
] as const;

const proofPoints = [
  "Missed leads visible",
  "Quotes drafted faster",
  "Receivables tracked daily"
] as const;

const plans = [
  {
    name: "Starter",
    price: "$99",
    detail: "One location getting organized",
    features: ["150 AI runs", "50 jobs", "1 seat"]
  },
  {
    name: "Growth",
    price: "$199",
    detail: "Busy teams with a dispatcher",
    features: ["750 AI runs", "250 jobs", "5 seats"]
  },
  {
    name: "Pro",
    price: "$499",
    detail: "Multi-location operators",
    features: ["3,000 AI runs", "1,000 jobs", "15 seats"]
  }
] as const;

export function SaasLandingPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f1] text-[#141414]">
      <header className="border-b border-black/10 bg-[#f6f6f1]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-9 items-center justify-center rounded-lg border border-black/10 bg-white">
              <Sparkles size={17} />
            </span>
            <span className="text-sm font-semibold">ServicePulse</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              className="hidden rounded-lg border border-black/10 bg-white px-3 py-2 font-semibold text-black/70 transition hover:border-black/25 hover:text-black sm:inline-flex"
              href="#pricing"
            >
              Pricing
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-[#141414] px-3 py-2 font-semibold text-white transition hover:bg-black"
              href="/signup"
            >
              Start workspace
              <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 lg:px-8 lg:pb-16 lg:pt-16">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            Local service operations
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-normal text-[#111111] sm:text-6xl lg:text-7xl">
            AI operations desk for local service teams
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-black/62 sm:text-lg">
            ServicePulse gives owners one focused place to catch leads, schedule
            jobs, and follow up on payments before work slips through the cracks.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
              href="/signup"
            >
              Start workspace
              <ArrowRight size={15} />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/75 transition hover:border-black/25 hover:text-black"
              href="/login"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-lg border border-black/10 bg-[#101312] shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#2dd4bf]" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                Live workspace
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/55">
              <ShieldCheck size={14} />
              Owner view
            </div>
          </div>
          <div className="grid gap-px bg-white/10 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="bg-[#151917] p-4 text-white sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Today
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <PreviewMetric label="New leads" value="18" />
                <PreviewMetric label="Booked" value="11" />
                <PreviewMetric label="Pending invoices" value="$4.8k" />
                <PreviewMetric label="Open follow-ups" value="7" />
              </div>
              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PhoneCall size={15} />
                  Next action
                </div>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  Call back a same-day repair lead, confirm availability, and
                  send the quote link.
                </p>
              </div>
            </div>
            <div className="bg-[#fbfbf8] p-4 sm:p-6">
              <div className="grid gap-3 md:grid-cols-3">
                {workflow.map((item) => (
                  <div
                    className="rounded-lg border border-black/10 bg-white p-4"
                    key={item.label}
                  >
                    <item.icon size={17} />
                    <h2 className="mt-4 text-sm font-semibold">
                      {item.label}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-black/52">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-black/10 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Inbox size={16} />
                    Job queue
                  </div>
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    86% on track
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <QueueRow label="AC service quote" status="Ready to send" />
                  <QueueRow label="Salon booking request" status="Needs slot" />
                  <QueueRow label="Clinic invoice" status="Follow up today" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-5 sm:grid-cols-3 lg:px-8">
          {proofPoints.map((point) => (
            <div className="flex items-center gap-2 text-sm" key={point}>
              <CheckCircle2 className="text-emerald-600" size={16} />
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8" id="pricing">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              Start small, upgrade when volume grows
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/75 transition hover:border-black/25 hover:text-black"
            href="/dashboard#billing"
          >
            Manage billing
            <CreditCard size={15} />
          </Link>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              className="rounded-lg border border-black/10 bg-white p-5"
              key={plan.name}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-black/50">{plan.detail}</p>
                </div>
                <UsersRound size={17} />
              </div>
              <p className="mt-5 font-mono text-3xl font-semibold">
                {plan.price}
                <span className="font-sans text-sm font-medium text-black/45">
                  /mo
                </span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-black/68">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-2" key={feature}>
                    <CheckCircle2 className="text-emerald-600" size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

function QueueRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-[#fbfbf8] px-3 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-black/48">{status}</span>
    </div>
  );
}
