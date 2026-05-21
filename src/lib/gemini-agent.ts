import {
  EvidenceEntry,
  buildEvidenceEntry
} from "./evidence-ledger";
import { getGeminiRuntimeConfig } from "./api-key-setup";
import {
  AgentRun,
  BusinessProfile,
  LeadInput,
  buildAgentRun
} from "./servicepulse";

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

type RunLeadAgentOptions = {
  profile: BusinessProfile;
  lead: LeadInput;
  apiKey?: string;
  model?: string;
  fetcher?: Fetcher;
};

export type LeadAgentResponse = {
  mode: "live" | "demo";
  run: AgentRun;
  evidenceEntry: EvidenceEntry;
  notice: string;
  prompt: string;
};

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

const allowedActionTypes = new Set([
  "qualify-lead",
  "price-quote",
  "schedule-job",
  "draft-invoice",
  "queue-follow-up"
]);

export function buildAgentPrompt(
  profile: BusinessProfile,
  lead: LeadInput
): string {
  const serviceMenu = profile.services
    .map((service) => `${service.name}: $${service.price} (${service.notes})`)
    .join("\n");

  return `You are ServicePulse AI, an AI operations agent for a local service business.

Business:
- Name: ${profile.name}
- Segment: ${profile.segment}
- Territory: ${profile.territory}
- Working hours: ${profile.workingHours}
- Preferred technician: ${profile.technician}

Service menu:
${serviceMenu}

Incoming lead:
- Customer: ${lead.customer}
- Channel: ${lead.channel}
- Urgency: ${lead.urgency}
- Message: ${lead.message}

Run the operating playbook: qualify the lead, select a service, quote the job, choose a booking window, draft the invoice, and queue a follow-up.

Return only valid JSON with this exact shape:
{
  "status": "needs-human" | "ready-to-book" | "booked",
  "quote": {
    "amount": 420,
    "currency": "USD",
    "lineItems": ["Leak diagnosis", "Drain line flush"]
  },
  "booking": {
    "window": "Today, 4:30 PM - 6:00 PM",
    "technician": "Rafi"
  },
  "actions": [
    {
      "type": "qualify-lead",
      "label": "Qualify lead",
      "owner": "Gemini agent",
      "result": "Detected service type, location, urgency, and missing info.",
      "confidence": 0.92
    }
  ],
  "loggedDecisions": 5
}

Use only these action types: qualify-lead, price-quote, schedule-job, draft-invoice, queue-follow-up. Keep results short and operational.`;
}

export function parseGeminiAgentRun(
  rawText: string,
  lead: LeadInput,
  traceId: string,
  model = DEFAULT_GEMINI_MODEL
): AgentRun {
  const jsonText = extractJson(rawText);
  const parsed = JSON.parse(jsonText) as Partial<AgentRun> & {
    loggedDecisions?: number;
  };
  const actions = Array.isArray(parsed.actions)
    ? parsed.actions.filter((action) => allowedActionTypes.has(action.type))
    : [];

  return {
    id: traceId,
    customer: lead.customer,
    status:
      parsed.status === "needs-human" ||
      parsed.status === "ready-to-book" ||
      parsed.status === "booked"
        ? parsed.status
        : "needs-human",
    quote: {
      amount:
        typeof parsed.quote?.amount === "number" ? parsed.quote.amount : 0,
      currency: "USD",
      lineItems: Array.isArray(parsed.quote?.lineItems)
        ? parsed.quote.lineItems
        : []
    },
    booking: {
      window:
        typeof parsed.booking?.window === "string"
          ? parsed.booking.window
          : "Needs owner review",
      technician:
        typeof parsed.booking?.technician === "string"
          ? parsed.booking.technician
          : "Unassigned"
    },
    actions: actions.length > 0 ? actions : buildAgentRun(lead).actions,
    evidence: {
      model,
      googleCloudProduct: "Cloud Run + Cloud Logging",
      loggedDecisions:
        typeof parsed.loggedDecisions === "number"
          ? parsed.loggedDecisions
          : actions.length,
      traceId: `cloud-run/servicepulse/${traceId}`,
      source: "gemini-api"
    }
  };
}

export async function runLeadAgent({
  profile,
  lead,
  apiKey,
  model,
  fetcher = fetch
}: RunLeadAgentOptions): Promise<LeadAgentResponse> {
  const prompt = buildAgentPrompt(profile, lead);
  const runtimeConfig = await getGeminiRuntimeConfig();
  const effectiveApiKey = apiKey ?? runtimeConfig.apiKey;
  const effectiveModel = model ?? runtimeConfig.model;

  if (!effectiveApiKey) {
    const demoRun = buildAgentRun(lead, profile, `demo-${Date.now()}`);
    return {
      mode: "demo",
      run: demoRun,
      evidenceEntry: buildEvidenceEntry(demoRun, profile),
      notice:
        "Demo mode: set GEMINI_API_KEY to run this workflow with live Gemini.",
      prompt
    };
  }

  const traceId = `gemini-live-${Date.now()}`;
  const response = await fetcher(
    `https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${effectiveApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text =
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("\n") ?? "";

  const run = parseGeminiAgentRun(text, lead, traceId, effectiveModel);

  return {
    mode: "live",
    run,
    evidenceEntry: buildEvidenceEntry(run, profile),
    notice: "Live Gemini run recorded with traceable evidence.",
    prompt
  };
}

function extractJson(rawText: string): string {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Gemini response did not contain JSON.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}
