import { describe, expect, it } from "vitest";
import {
  buildAgentRun,
  getBusinessSnapshot,
  getDashboardMetrics
} from "./opspilot";

describe("OpsPilot agent workflow", () => {
  it("qualifies a service lead, quotes the job, and records demo evidence", () => {
    const run = buildAgentRun({
      customer: "Maya Khan",
      message:
        "My AC is leaking water and I need someone today after 4pm in Jumeirah.",
      channel: "whatsapp",
      urgency: "today"
    });

    expect(run.status).toBe("ready-to-book");
    expect(run.quote.amount).toBe(420);
    expect(run.booking.window).toBe("Today, 4:30 PM - 6:00 PM");
    expect(run.actions.map((action) => action.type)).toEqual([
      "qualify-lead",
      "price-quote",
      "schedule-job",
      "draft-invoice",
      "queue-follow-up"
    ]);
    expect(run.evidence).toEqual(
      expect.objectContaining({
        model: "gemini-2.5-flash",
        googleCloudProduct: "Cloud Run + Cloud Logging",
        loggedDecisions: 5
      })
    );
  });

  it("summarizes modeled business viability metrics from seeded demo data", () => {
    const snapshot = getBusinessSnapshot();
    const metrics = getDashboardMetrics(snapshot);

    expect(metrics.modeledRecurringRevenue).toBe(1840);
    expect(metrics.demoBusinesses).toBe(8);
    expect(metrics.leadConversionRate).toBe(42);
    expect(metrics.aiHandledWorkflows).toBe(286);
    expect(metrics.modeledGrossMargin).toBe(78);
  });
});
