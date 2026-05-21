import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getEvidenceDataDir, setFallbackDataDir } from "./evidence-store";
import { BusinessProfile, defaultBusinessProfile } from "./servicepulse";
import { runKvCommand } from "./kv-store";

const PROFILE_FILE = "business-profile.json";
const KV_PROFILE_KEY = "servicepulse:profile";

export async function readBusinessProfile(
  dataDir = getEvidenceDataDir()
): Promise<BusinessProfile> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const data = await runKvCommand<string>(["GET", KV_PROFILE_KEY]);
      if (data) {
        return normalizeBusinessProfile(JSON.parse(data));
      }
    } catch (kvError) {
      console.warn("KV profile read failed, trying local file fallback:", kvError);
    }
  }

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

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const result = await runKvCommand<string>([
        "SET",
        KV_PROFILE_KEY,
        JSON.stringify(normalized)
      ]);
      if (result === "OK" || result === "ok") {
        return normalized;
      }
      console.warn("KV profile save did not return OK, trying local file fallback.");
    } catch (kvError) {
      console.warn("KV profile save failed, trying local file fallback:", kvError);
    }
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, PROFILE_FILE),
      `${JSON.stringify(normalized, null, 2)}\n`,
      "utf-8"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "EROFS" || error.code === "EACCES" || error.code === "EPERM" || error.code === "ENOENT")
    ) {
      console.warn("Read-only filesystem detected. Falling back to OS temporary directory for profile store.");
      const fallbackDir = join(tmpdir(), "servicepulse-data");
      setFallbackDataDir(fallbackDir);

      const newPath = join(fallbackDir, PROFILE_FILE);
      await mkdir(fallbackDir, { recursive: true });
      await writeFile(
        newPath,
        `${JSON.stringify(normalized, null, 2)}\n`,
        "utf-8"
      );
      return normalized;
    }
    throw error;
  }

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
