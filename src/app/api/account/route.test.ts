import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import type { AccountSettings } from "@/lib/account-store";

let dataDir = "";

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

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-api-account-"));
  vi.stubEnv("SERVICEPULSE_DATA_DIR", dataDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("/api/account", () => {
  it("returns the current SaaS account settings", async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      account: {
        workspaceName: "ServicePulse Workspace",
        plan: "starter"
      },
      summary: {
        planLabel: "Starter",
        readyForBilling: false,
        seatsAvailable: 1,
        launchReady: false,
        goLiveScore: 25
      }
    });
  });

  it("saves SaaS account settings and returns billing readiness", async () => {
    const response = await POST(
      new Request("http://localhost/api/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ account })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.account.workspaceName).toBe("CoolFix AC");
    expect(payload.summary).toMatchObject({
      planLabel: "Growth",
      readyForBilling: true,
      monthlyRecurringRevenue: 199,
      seatsAvailable: 3,
      launchReady: true,
      goLiveScore: 100,
      activeMembers: 1,
      invitedMembers: 1,
      usage: {
        agentRuns: {
          limit: 750,
          used: 120,
          remaining: 630
        }
      }
    });
  });
});
