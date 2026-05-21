import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JobInboxPanel } from "./job-inbox-panel";
import { getJobSummary, type JobRecord } from "@/lib/job-store";

const job: JobRecord = {
  id: "maya-khan-ac-leak",
  customerName: "Maya Khan",
  customerContact: "+971500000000",
  businessName: "CoolFix AC",
  channel: "whatsapp",
  message: "My AC is leaking water and I need someone today after 4pm.",
  service: "AC leak repair",
  location: "Jumeirah",
  urgency: "today",
  stage: "paid",
  quoteAmount: 420,
  scheduledWindow: "Today, 4:30 PM - 6:00 PM",
  paymentUrl: "https://pay.example.com/maya",
  evidenceUrl: "https://drive.google.com/job-proof",
  nextAction: "Send review request",
  notes: "Deposit collected.",
  updatedAt: "2026-05-21T12:00:00.000Z"
};

describe("JobInboxPanel", () => {
  it("renders the empty owner inbox state", () => {
    render(
      <JobInboxPanel
        autoLoad={false}
        initialJobs={[]}
        initialSummary={getJobSummary([])}
      />
    );

    expect(screen.getByText("Job Inbox")).toBeTruthy();
    expect(screen.getByText("No customer jobs saved yet.")).toBeTruthy();
    expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
  });

  it("renders saved customer work and paid revenue", () => {
    render(
      <JobInboxPanel
        autoLoad={false}
        initialJobs={[job]}
        initialSummary={getJobSummary([job])}
      />
    );

    expect(screen.getByText("Maya Khan")).toBeTruthy();
    expect(screen.getAllByText("paid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$420").length).toBeGreaterThan(0);
  });
});
