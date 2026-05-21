import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readBusinessProfile,
  saveBusinessProfile
} from "./profile-store";
import { BusinessProfile, defaultBusinessProfile } from "./servicepulse";
import { runKvCommand } from "./kv-store";

vi.mock("./kv-store", () => ({
  runKvCommand: vi.fn()
}));

let dataDir = "";

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "servicepulse-profile-"));
});

afterEach(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

describe("profile store", () => {
  it("returns the default business profile when no saved profile exists", async () => {
    const profile = await readBusinessProfile(dataDir);

    expect(profile).toEqual(defaultBusinessProfile);
  });

  it("persists a business profile with service menu pricing", async () => {
    const customProfile: BusinessProfile = {
      name: "BrightCare Clinic",
      segment: "Clinic",
      territory: "Dubai Silicon Oasis",
      workingHours: "9:00 AM - 9:00 PM",
      technician: "Nadia",
      services: [
        {
          name: "New patient triage",
          price: 150,
          notes: "Symptoms, preferred slot, insurance status"
        }
      ]
    };

    await saveBusinessProfile(customProfile, dataDir);

    const profile = await readBusinessProfile(dataDir);
    expect(profile).toEqual(customProfile);
  });

  it("falls back to temporary directory when writing to the profile directory fails with EACCES/EROFS", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const customProfile: BusinessProfile = {
      name: "Test EROFS Clinic",
      segment: "Clinic",
      territory: "Test",
      workingHours: "9:00 AM - 5:00 PM",
      technician: "Rafi",
      services: [
        {
          name: "Test",
          price: 100,
          notes: "Notes"
        }
      ]
    };

    const saved = await saveBusinessProfile(customProfile, "/nonexistent-dir-test-1234");
    expect(saved).toEqual(customProfile);

    // Read it back from the fallback (calls getEvidenceDataDir)
    const profile = await readBusinessProfile();
    expect(profile).toEqual(customProfile);
    expect(warnSpy).toHaveBeenCalledWith(
      "Read-only filesystem detected. Falling back to OS temporary directory for profile store."
    );

    warnSpy.mockRestore();
  });

  describe("with KV configuration", () => {
    beforeEach(() => {
      vi.stubEnv("KV_REST_API_URL", "https://mock-kv.upstash.io");
      vi.stubEnv("KV_REST_API_TOKEN", "mock-token");
      vi.mocked(runKvCommand).mockReset();
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("reads profile from KV database if configured", async () => {
      const customProfile: BusinessProfile = {
        name: "KV Clinic",
        segment: "Clinic",
        territory: "Dubai",
        workingHours: "9:00 AM - 5:00 PM",
        technician: "KV Tech",
        services: [
          {
            name: "KV Consultation",
            price: 200,
            notes: "KV test notes"
          }
        ]
      };

      vi.mocked(runKvCommand).mockResolvedValueOnce(JSON.stringify(customProfile));

      const profile = await readBusinessProfile(dataDir);
      expect(profile).toEqual(customProfile);
      expect(runKvCommand).toHaveBeenCalledWith(["GET", "servicepulse:profile"]);
    });

    it("saves profile to KV database if configured", async () => {
      const customProfile: BusinessProfile = {
        name: "KV Clinic",
        segment: "Clinic",
        territory: "Dubai",
        workingHours: "9:00 AM - 5:00 PM",
        technician: "KV Tech",
        services: [
          {
            name: "KV Consultation",
            price: 200,
            notes: "KV test notes"
          }
        ]
      };

      vi.mocked(runKvCommand).mockResolvedValueOnce("OK");

      const saved = await saveBusinessProfile(customProfile, dataDir);
      expect(saved).toEqual(customProfile);
      expect(runKvCommand).toHaveBeenCalledWith([
        "SET",
        "servicepulse:profile",
        JSON.stringify(customProfile)
      ]);
    });
  });
});
