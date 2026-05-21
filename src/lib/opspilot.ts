export type LeadInput = {
  customer: string;
  message: string;
  channel: "whatsapp" | "web" | "email";
  urgency: "today" | "this-week" | "flexible";
};

export type BusinessProfile = {
  name: string;
  segment: string;
  territory: string;
  workingHours: string;
  technician: string;
  services: Array<{
    name: string;
    price: number;
    notes: string;
  }>;
};

export type AgentAction = {
  type:
    | "qualify-lead"
    | "price-quote"
    | "schedule-job"
    | "draft-invoice"
    | "queue-follow-up";
  label: string;
  owner: "Gemini agent" | "Human owner";
  result: string;
  confidence: number;
};

export type AgentRun = {
  id: string;
  customer: string;
  status: "needs-human" | "ready-to-book" | "booked";
  quote: {
    amount: number;
    currency: "USD";
    lineItems: string[];
  };
  booking: {
    window: string;
    technician: string;
  };
  actions: AgentAction[];
  evidence: {
    model: string;
    googleCloudProduct: string;
    loggedDecisions: number;
    traceId: string;
    source: "gemini-api" | "deterministic-demo";
  };
};

export type BusinessSnapshot = {
  customers: Array<{
    name: string;
    segment: string;
    monthlyFee: number;
    active: boolean;
  }>;
  leads: {
    total: number;
    converted: number;
  };
  workflows: {
    aiHandled: number;
    humanEscalations: number;
  };
  finance: {
    monthlyRevenue: number;
    monthlyCosts: number;
  };
};

export type DashboardMetrics = {
  modeledRecurringRevenue: number;
  demoBusinesses: number;
  leadConversionRate: number;
  aiHandledWorkflows: number;
  modeledGrossMargin: number;
};

export const pipeline = [
  {
    stage: "New lead",
    count: 18,
    value: "$7.6k",
    color: "bg-sky-400"
  },
  {
    stage: "AI quoted",
    count: 11,
    value: "$5.1k",
    color: "bg-amber-300"
  },
  {
    stage: "Booked",
    count: 8,
    value: "$3.8k",
    color: "bg-emerald-400"
  },
  {
    stage: "Paid",
    count: 6,
    value: "$2.9k",
    color: "bg-fuchsia-400"
  }
] as const;

export const evidenceEvents = [
  {
    time: "09:12",
    event: "Lead qualified",
    detail: "Gemini extracted service type, location, urgency, and access notes.",
    trace: "run-ac-1042"
  },
  {
    time: "09:14",
    event: "Quote approved",
    detail: "Agent matched leak repair playbook and sent a $420 quote.",
    trace: "run-ac-1042"
  },
  {
    time: "09:18",
    event: "Slot booked",
    detail: "Calendar hold created for today with technician Rafi.",
    trace: "run-ac-1042"
  },
  {
    time: "09:19",
    event: "Invoice drafted",
    detail: "Payment link and deposit reminder queued for owner review.",
    trace: "run-ac-1042"
  }
] as const;

export const customers = [
  {
    name: "CoolFix AC",
    segment: "AC repair",
    status: "Demo",
    fee: "$240/mo",
    outcome: "42% more booked calls"
  },
  {
    name: "Noura Beauty Studio",
    segment: "Salon",
    status: "Demo",
    fee: "$180/mo",
    outcome: "23 leads captured"
  },
  {
    name: "QuickSpark Electric",
    segment: "Home repair",
    status: "Demo",
    fee: "$260/mo",
    outcome: "18 invoices chased"
  }
] as const;

export const defaultBusinessProfile: BusinessProfile = {
  name: "CoolFix AC",
  segment: "AC repair",
  territory: "Dubai Marina, Jumeirah, Downtown Dubai",
  workingHours: "8:00 AM - 8:00 PM, same-day emergency slots until 6:30 PM",
  technician: "Rafi",
  services: [
    {
      name: "AC leak repair",
      price: 420,
      notes: "Diagnosis, drain line flush, and same-day dispatch"
    },
    {
      name: "AC deep cleaning",
      price: 260,
      notes: "Indoor unit clean, filter wash, performance check"
    },
    {
      name: "Thermostat fault check",
      price: 180,
      notes: "Remote or onsite triage with parts quote after diagnosis"
    }
  ]
};

export function buildAgentRun(
  input: LeadInput,
  profile: BusinessProfile = defaultBusinessProfile,
  runId = "run-ac-1042"
): AgentRun {
  const isSameDay = input.urgency === "today";
  const primaryService = profile.services[0];

  return {
    id: runId,
    customer: input.customer,
    status: isSameDay ? "ready-to-book" : "needs-human",
    quote: {
      amount: isSameDay ? primaryService.price : Math.max(primaryService.price - 60, 0),
      currency: "USD",
      lineItems: [
        primaryService.notes.split(",")[0] ?? primaryService.name,
        primaryService.notes.split(",")[1]?.trim() ?? "Service playbook matched",
        isSameDay ? "Same-day technician dispatch" : "Next-slot technician dispatch"
      ]
    },
    booking: {
      window: isSameDay ? "Today, 4:30 PM - 6:00 PM" : "Next available slot",
      technician: profile.technician
    },
    actions: [
      {
        type: "qualify-lead",
        label: "Qualify lead",
        owner: "Gemini agent",
        result: "Detected AC leak, Jumeirah location, same-day urgency.",
        confidence: 0.94
      },
      {
        type: "price-quote",
        label: "Price quote",
        owner: "Gemini agent",
        result: "Selected standard leak repair package and added rush window.",
        confidence: 0.91
      },
      {
        type: "schedule-job",
        label: "Schedule job",
        owner: "Gemini agent",
        result: "Reserved the closest technician window after 4 PM.",
        confidence: 0.88
      },
      {
        type: "draft-invoice",
        label: "Draft invoice",
        owner: "Gemini agent",
        result: "Prepared deposit invoice and payment reminder.",
        confidence: 0.9
      },
      {
        type: "queue-follow-up",
        label: "Queue follow-up",
        owner: "Gemini agent",
        result: "Queued satisfaction check and review request after completion.",
        confidence: 0.87
      }
    ],
    evidence: {
      model: "gemini-2.5-flash",
      googleCloudProduct: "Cloud Run + Cloud Logging",
      loggedDecisions: 5,
      traceId: `cloud-run/opspilot/${runId}`,
      source: "deterministic-demo"
    }
  };
}

export function getBusinessSnapshot(): BusinessSnapshot {
  return {
    customers: [
      { name: "CoolFix AC", segment: "AC repair", monthlyFee: 240, active: true },
      { name: "QuickSpark Electric", segment: "Home repair", monthlyFee: 260, active: true },
      { name: "Noura Beauty Studio", segment: "Salon", monthlyFee: 180, active: true },
      { name: "PrimeCare Clinic", segment: "Clinic", monthlyFee: 300, active: true },
      { name: "SkillBridge Tutors", segment: "Training", monthlyFee: 220, active: true },
      { name: "UrbanClean", segment: "Cleaning", monthlyFee: 190, active: true },
      { name: "Metro Glass", segment: "Repair", monthlyFee: 210, active: true },
      { name: "FitLab Studio", segment: "Fitness", monthlyFee: 240, active: true }
    ],
    leads: {
      total: 67,
      converted: 28
    },
    workflows: {
      aiHandled: 286,
      humanEscalations: 19
    },
    finance: {
      monthlyRevenue: 1840,
      monthlyCosts: 405
    }
  };
}

export function getDashboardMetrics(
  snapshot: BusinessSnapshot
): DashboardMetrics {
  const activeCustomers = snapshot.customers.filter((customer) => customer.active);
  const monthlyRecurringRevenue = activeCustomers.reduce(
    (total, customer) => total + customer.monthlyFee,
    0
  );
  const leadConversionRate = Math.round(
    (snapshot.leads.converted / snapshot.leads.total) * 100
  );
  const grossMargin = Math.round(
    ((snapshot.finance.monthlyRevenue - snapshot.finance.monthlyCosts) /
      snapshot.finance.monthlyRevenue) *
      100
  );

  return {
    modeledRecurringRevenue: monthlyRecurringRevenue,
    demoBusinesses: activeCustomers.length,
    leadConversionRate,
    aiHandledWorkflows: snapshot.workflows.aiHandled,
    modeledGrossMargin: grossMargin
  };
}
