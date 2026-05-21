import { NextResponse } from "next/server";
import { getEvidenceLedger } from "@/lib/evidence-store";
import {
  buildProofPacket,
  getDefaultFinancialReport
} from "@/lib/proof-packet";

export const dynamic = "force-dynamic";

export async function GET() {
  const ledger = await getEvidenceLedger();
  const packet = buildProofPacket({
    ledger,
    financialReport: getDefaultFinancialReport(),
    repositoryUrl: "https://github.com/jasimvk/servicepulse-ai",
    startDate: "05-21-26"
  });

  return NextResponse.json(packet, {
    headers: {
      "Content-Disposition": `attachment; filename="${packet.downloadName}"`
    }
  });
}
