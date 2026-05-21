import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PilotCrmPanel } from "./pilot-crm-panel";
import { getPilotSummary, type PilotRecord } from "@/lib/pilot-store";

const pilot: PilotRecord = {
  id: "jumeirah-ac-pro",
  businessName: "Jumeirah AC Pro",
  segment: "AC repair",
  ownerName: "Faisal",
  location: "Jumeirah",
  channel: "google-maps",
  stage: "pilot-paid",
  offer: "$49 setup + $199/month after 7 days",
  setupFee: 49,
  monthlyPrice: 199,
  paymentUrl: "https://buy.stripe.com/test",
  testimonialUrl: "",
  evidenceUrl: "https://drive.google.com/proof",
  permissionStatus: "granted",
  nextAction: "Collect owner testimonial",
  nextActionDue: "2026-05-22",
  notes: "Owner paid setup and approved proof capture.",
  updatedAt: "2026-05-21T11:00:00.000Z"
};

describe("PilotCrmPanel", () => {
  it("renders the honest empty state when no real pilots are saved", () => {
    render(
      <PilotCrmPanel
        autoLoad={false}
        initialPilots={[]}
        initialSummary={getPilotSummary([])}
      />
    );

    expect(screen.getByText("Pilot CRM")).toBeTruthy();
    expect(screen.getByText("No real pilots saved yet.")).toBeTruthy();
    expect(screen.getAllByText("$0")).toHaveLength(2);
  });

  it("renders saved pilot traction without claiming demo customers", () => {
    render(
      <PilotCrmPanel
        autoLoad={false}
        initialPilots={[pilot]}
        initialSummary={getPilotSummary([pilot])}
      />
    );

    expect(screen.getByText("Jumeirah AC Pro")).toBeTruthy();
    expect(screen.getAllByText("pilot paid").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$49").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$199").length).toBeGreaterThan(0);
  });
});
