import { describe, expect, it, vi } from "vitest";
import {
  buildAgentPrompt,
  parseGeminiAgentRun,
  runLeadAgent
} from "./gemini-agent";
import { defaultBusinessProfile } from "./opspilot";

const lead = {
  customer: "Maya Khan",
  message: "My AC is leaking water and I need someone today after 4pm.",
  channel: "whatsapp" as const,
  urgency: "today" as const
};

describe("Gemini agent adapter", () => {
  it("builds a prize-evidence prompt with business settings and strict JSON shape", () => {
    const prompt = buildAgentPrompt(defaultBusinessProfile, lead);

    expect(prompt).toContain("CoolFix AC");
    expect(prompt).toContain("AC leak repair: $420");
    expect(prompt).toContain("Return only valid JSON");
    expect(prompt).toContain("loggedDecisions");
    expect(prompt).toContain(lead.message);
  });

  it("parses Gemini JSON into an agent run with traceable evidence", () => {
    const run = parseGeminiAgentRun(
      JSON.stringify({
        status: "ready-to-book",
        quote: {
          amount: 455,
          currency: "USD",
          lineItems: ["Leak diagnosis", "After-hours dispatch"]
        },
        booking: {
          window: "Today, 5:00 PM - 6:30 PM",
          technician: "Sara"
        },
        actions: [
          {
            type: "qualify-lead",
            label: "Qualify lead",
            owner: "Gemini agent",
            result: "Detected AC leak and same-day urgency.",
            confidence: 0.93
          }
        ]
      }),
      lead,
      "gemini-live-1700"
    );

    expect(run.quote.amount).toBe(455);
    expect(run.booking.technician).toBe("Sara");
    expect(run.evidence.model).toBe("gemini-2.5-flash");
    expect(run.evidence.traceId).toBe("cloud-run/opspilot/gemini-live-1700");
  });

  it("uses deterministic demo mode when no Gemini API key is configured", async () => {
    const response = await runLeadAgent({
      profile: defaultBusinessProfile,
      lead,
      apiKey: "",
      fetcher: vi.fn()
    });

    expect(response.mode).toBe("demo");
    expect(response.run.evidence.source).toBe("deterministic-demo");
    expect(response.notice).toContain("GEMINI_API_KEY");
  });
});
