import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readBusinessProfile,
  saveBusinessProfile
} from "./profile-store";
import { BusinessProfile, defaultBusinessProfile } from "./opspilot";

let dataDir = "";

beforeEach(async () => {
  dataDir = await mkdtemp(join(tmpdir(), "opspilot-profile-"));
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
});
