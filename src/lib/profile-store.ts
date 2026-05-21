import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getEvidenceDataDir } from "./evidence-store";
import { BusinessProfile, defaultBusinessProfile } from "./opspilot";

const PROFILE_FILE = "business-profile.json";

export async function readBusinessProfile(
  dataDir = getEvidenceDataDir()
): Promise<BusinessProfile> {
  try {
    const raw = await readFile(join(dataDir, PROFILE_FILE), "utf-8");
    return normalizeBusinessProfile(JSON.parse(raw));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return defaultBusinessProfile;
    }

    throw error;
  }
}

export async function saveBusinessProfile(
  profile: BusinessProfile,
  dataDir = getEvidenceDataDir()
): Promise<BusinessProfile> {
  const normalized = normalizeBusinessProfile(profile);

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    join(dataDir, PROFILE_FILE),
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf-8"
  );

  return normalized;
}

function normalizeBusinessProfile(value: unknown): BusinessProfile {
  if (!isRecord(value)) {
    return defaultBusinessProfile;
  }

  const services = Array.isArray(value.services)
    ? value.services
        .map((service) => {
          if (!isRecord(service)) {
            return null;
          }

          return {
            name: stringOrDefault(service.name, "Service"),
            price:
              typeof service.price === "number" && Number.isFinite(service.price)
                ? service.price
                : 0,
            notes: stringOrDefault(service.notes, "Owner review required")
          };
        })
        .filter((service): service is BusinessProfile["services"][number] =>
          Boolean(service)
        )
    : [];

  return {
    name: stringOrDefault(value.name, defaultBusinessProfile.name),
    segment: stringOrDefault(value.segment, defaultBusinessProfile.segment),
    territory: stringOrDefault(value.territory, defaultBusinessProfile.territory),
    workingHours: stringOrDefault(
      value.workingHours,
      defaultBusinessProfile.workingHours
    ),
    technician: stringOrDefault(value.technician, defaultBusinessProfile.technician),
    services: services.length > 0 ? services : defaultBusinessProfile.services
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOrDefault(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
