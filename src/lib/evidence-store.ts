import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  EvidenceEntry,
  getSeedEvidenceLedger
} from "./evidence-ledger";

const STORE_FILE = "evidence-ledger.json";

export function getEvidenceDataDir() {
  return process.env.OPSPILOT_DATA_DIR ?? join(process.cwd(), ".data");
}

export async function readStoredEvidence(
  dataDir = getEvidenceDataDir()
): Promise<EvidenceEntry[]> {
  try {
    const raw = await readFile(join(dataDir, STORE_FILE), "utf-8");
    const parsed = JSON.parse(raw) as EvidenceEntry[];
    return Array.isArray(parsed) ? parsed : [];
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

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    join(dataDir, STORE_FILE),
    `${JSON.stringify(nextEntries, null, 2)}\n`,
    "utf-8"
  );

  return nextEntries;
}

export async function getEvidenceLedger(
  dataDir = getEvidenceDataDir()
): Promise<EvidenceEntry[]> {
  return mergeEvidence(getSeedEvidenceLedger(), await readStoredEvidence(dataDir));
}

function mergeEvidence(
  seeded: EvidenceEntry[],
  stored: EvidenceEntry[]
): EvidenceEntry[] {
  const byId = new Map<string, EvidenceEntry>();

  for (const entry of seeded) {
    byId.set(entry.id, entry);
  }

  for (const entry of stored) {
    byId.set(entry.id, entry);
  }

  return Array.from(byId.values()).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
}
