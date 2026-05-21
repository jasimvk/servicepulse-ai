import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  EvidenceEntry,
  getSeedEvidenceLedger
} from "./evidence-ledger";
import { runKvCommand } from "./kv-store";

const STORE_FILE = "evidence-ledger.json";
const KV_EVIDENCE_KEY = "servicepulse:evidence";

let fallbackDataDir: string | null = null;

export function getEvidenceDataDir() {
  if (fallbackDataDir) {
    return fallbackDataDir;
  }
  return process.env.SERVICEPULSE_DATA_DIR ?? join(process.cwd(), ".data");
}

export function setFallbackDataDir(dir: string) {
  fallbackDataDir = dir;
}

export async function readStoredEvidence(
  dataDir = getEvidenceDataDir()
): Promise<EvidenceEntry[]> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const data = await runKvCommand<string>(["GET", KV_EVIDENCE_KEY]);
      if (data) {
        const parsed = JSON.parse(data) as EvidenceEntry[];
        return Array.isArray(parsed) ? parsed.map(normalizeEvidenceEntry) : [];
      }
    } catch (kvError) {
      console.warn("KV evidence read failed, trying local file fallback:", kvError);
    }
  }

  try {
    const raw = await readFile(join(dataDir, STORE_FILE), "utf-8");
    const parsed = JSON.parse(raw) as EvidenceEntry[];
    return Array.isArray(parsed) ? parsed.map(normalizeEvidenceEntry) : [];
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

export async function appendEvidenceEntry(
  entry: EvidenceEntry,
  dataDir = getEvidenceDataDir()
): Promise<EvidenceEntry[]> {
  const stored = await readStoredEvidence(dataDir);
  const deduped = stored.filter((item) => item.id !== entry.id);
  const nextEntries = [entry, ...deduped];

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (url && token) {
    try {
      const result = await runKvCommand<string>([
        "SET",
        KV_EVIDENCE_KEY,
        JSON.stringify(nextEntries)
      ]);
      if (result === "OK" || result === "ok") {
        return nextEntries;
      }
      console.warn("KV evidence save did not return OK, trying local file fallback.");
    } catch (kvError) {
      console.warn("KV evidence save failed, trying local file fallback:", kvError);
    }
  }

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      join(dataDir, STORE_FILE),
      `${JSON.stringify(nextEntries, null, 2)}\n`,
      "utf-8"
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error.code === "EROFS" || error.code === "EACCES" || error.code === "EPERM" || error.code === "ENOENT")
    ) {
      console.warn("Read-only filesystem detected. Falling back to OS temporary directory.");
      fallbackDataDir = join(tmpdir(), "servicepulse-data");

      const newPath = join(fallbackDataDir, STORE_FILE);
      await mkdir(fallbackDataDir, { recursive: true });
      await writeFile(
        newPath,
        `${JSON.stringify(nextEntries, null, 2)}\n`,
        "utf-8"
      );
      return nextEntries;
    }
    throw error;
  }

  return nextEntries;
}

export async function getEvidenceLedger(
  dataDir = getEvidenceDataDir()
): Promise<EvidenceEntry[]> {
  return mergeEvidence(getSeedEvidenceLedger(), await readStoredEvidence(dataDir));
}

function normalizeEvidenceEntry(entry: EvidenceEntry): EvidenceEntry {
  return {
    ...entry,
    business: replaceLegacyBrand(entry.business),
    summary: replaceLegacyBrand(entry.summary),
    traceId: replaceLegacyBrand(entry.traceId)
  };
}

function replaceLegacyBrand(value: string): string {
  const legacyProduct = ["Ops", "Pilot"].join("");
  const legacySlug = ["ops", "pilot"].join("");

  return value
    .replaceAll(legacyProduct, "ServicePulse AI")
    .replaceAll(legacySlug, "servicepulse");
}

function mergeEvidence(
  seeded: EvidenceEntry[],
  stored: EvidenceEntry[]
): EvidenceEntry[] {
  const byId = new Map<string, EvidenceEntry>();

  for (const entry of seeded) {
    byId.set(entry.id, normalizeEvidenceEntry(entry));
  }

  for (const entry of stored) {
    byId.set(entry.id, normalizeEvidenceEntry(entry));
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
}
