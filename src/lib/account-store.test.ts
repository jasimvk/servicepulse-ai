import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultAccount,
  getAccountSummary,
  readAccount,
  saveAccount,
  type AccountSettings
} from "./account-store";
import { runKvCommand } from "./kv-store";

vi.mock("./kv-store", () => ({
  runKvCommand: vi.fn()
}));

let dataDir = "";

const activeAccount: AccountSettings = {
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
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-account-"));
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(dataDir, { recursive: true, force: true });
});

describe("account store", () => {
  it("returns the default SaaS account when none is saved", async () => {
    const account = await readAccount(dataDir);

    expect(account).toEqual(defaultAccount);
    expect(getAccountSummary(account)).toMatchObject({
      readyForBilling: false,
      seatsAvailable: 1,
      planLabel: "Starter",
      launchReady: false,
      goLiveScore: 25,
      usage: {
        agentRuns: {
          limit: 150,
          remaining: 150
        },
        jobs: {
          limit: 25,
          remaining: 25
        }
      }
    });
  });

  it("persists account, billing, and seat settings", async () => {
    await saveAccount(activeAccount, dataDir);

    const account = await readAccount(dataDir);
    expect(account).toEqual(activeAccount);
    expect(getAccountSummary(account)).toMatchObject({
      readyForBilling: true,
      seatsAvailable: 3,
      planLabel: "Growth",
      monthlyRecurringRevenue: 199,
      activeMembers: 1,
      invitedMembers: 1,
      launchReady: true,
      goLiveScore: 100,
      usage: {
        agentRuns: {
          limit: 750,
          used: 120,
          remaining: 630,
          percentUsed: 16
        },
        jobs: {
          limit: 150,
          used: 18,
          remaining: 132,
          percentUsed: 12
        },
        pilots: {
          limit: 15,
          used: 4,
          remaining: 11,
          percentUsed: 27
        }
      }
    });
  });

  describe("with KV configuration", () => {
    beforeEach(() => {
      vi.stubEnv("KV_REST_API_URL", "https://mock-kv.upstash.io");
      vi.stubEnv("KV_REST_API_TOKEN", "mock-token");
      vi.mocked(runKvCommand).mockReset();
    });

    it("reads and saves account settings through KV when configured", async () => {
      vi.mocked(runKvCommand).mockResolvedValueOnce(JSON.stringify(activeAccount));

      const account = await readAccount(dataDir);
      expect(account.workspaceName).toBe("CoolFix AC");
      expect(runKvCommand).toHaveBeenCalledWith(["GET", "servicepulse:account"]);

      vi.mocked(runKvCommand).mockResolvedValueOnce("OK");
      await saveAccount(account, dataDir);

      expect(runKvCommand).toHaveBeenLastCalledWith([
        "SET",
        "servicepulse:account",
        JSON.stringify(account)
      ]);
    });
  });
});
