import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaasAccountPanel } from "./saas-account-panel";
import {
  defaultAccount,
  getAccountSummary,
  type AccountSettings
} from "@/lib/account-store";

const account: AccountSettings = {
  workspaceName: "CoolFix AC",
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
  updatedAt: "2026-05-26T07:00:00.000Z"
};

describe("SaasAccountPanel", () => {
  it("renders the default SaaS account state", () => {
    render(
      <SaasAccountPanel
        autoLoad={false}
        initialAccount={defaultAccount}
        initialSummary={getAccountSummary(defaultAccount)}
      />
    );

    expect(screen.getByText("SaaS Account")).toBeTruthy();
    expect(screen.getAllByText("Starter").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ready: no").length).toBeGreaterThan(0);
    expect(screen.getByText("Seats 0/1")).toBeTruthy();
  });

  it("renders an active workspace with recurring revenue and seats", () => {
    render(
      <SaasAccountPanel
        autoLoad={false}
        initialAccount={account}
        initialSummary={getAccountSummary(account)}
      />
    );

    expect(screen.getByText("CoolFix AC")).toBeTruthy();
    expect(screen.getAllByText("Growth").length).toBeGreaterThan(0);
    expect(screen.getByText("$199")).toBeTruthy();
    expect(screen.getAllByText("Ready: yes").length).toBeGreaterThan(0);
    expect(screen.getByText("Seats 3/5")).toBeTruthy();
  });
});
