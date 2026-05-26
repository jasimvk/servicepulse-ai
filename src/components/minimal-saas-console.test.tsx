import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MinimalSaasConsole } from "./minimal-saas-console";
import {
  defaultAccount,
  getAccountSummary,
  type AccountSettings
} from "@/lib/account-store";

const account: AccountSettings = {
  workspaceName: "CoolFix AC",
  workspaceSlug: "coolfix-ac",
  ownerEmail: "owner@coolfix.example",
  plan: "growth",
  subscriptionStatus: "active",
  billingCycle: "monthly",
  monthlyPrice: 199,
  seatsIncluded: 5,
  seatsUsed: 3,
  trialEndsAt: "2026-06-05",
  checkoutUrl: "https://buy.stripe.com/test",
  customerPortalUrl: "https://billing.stripe.com/test",
  dataRegion: "us",
  usage: {
    agentRunsThisMonth: 120,
    jobsThisMonth: 18,
    pilotsThisMonth: 4
  },
  teamMembers: [
    {
      id: "owner",
      name: "Nadia Owner",
      email: "owner@coolfix.example",
      role: "owner",
      status: "active",
      updatedAt: "2026-05-26T07:00:00.000Z"
    },
    {
      id: "dispatcher",
      name: "Sam Dispatcher",
      email: "sam@coolfix.example",
      role: "operator",
      status: "invited",
      updatedAt: "2026-05-26T07:00:00.000Z"
    }
  ],
  updatedAt: "2026-05-26T07:00:00.000Z"
};

describe("MinimalSaasConsole", () => {
  it("renders a minimal onboarding console for a new workspace", () => {
    render(
      <MinimalSaasConsole
        account={defaultAccount}
        summary={getAccountSummary(defaultAccount)}
      />
    );

    expect(screen.getByText("ServicePulse")).toBeTruthy();
    expect(screen.getByText("Starter")).toBeTruthy();
    expect(screen.getByText("Launch 25%")).toBeTruthy();
    expect(screen.getByText("Agent runs 0/150")).toBeTruthy();
    expect(screen.getByText("No team seats")).toBeTruthy();
  });

  it("renders subscribed workspace, usage, team, and product modules", () => {
    render(
      <MinimalSaasConsole
        account={account}
        summary={getAccountSummary(account)}
      />
    );

    expect(screen.getByText("CoolFix AC")).toBeTruthy();
    expect(screen.getByText("Growth")).toBeTruthy();
    expect(screen.getByText("Launch 100%")).toBeTruthy();
    expect(screen.getByText("Agent runs 120/750")).toBeTruthy();
    expect(screen.getByText("Sam Dispatcher")).toBeTruthy();
    expect(screen.getByText("Job Inbox")).toBeTruthy();
    expect(screen.getByText("Ops Report")).toBeTruthy();
  });
});
