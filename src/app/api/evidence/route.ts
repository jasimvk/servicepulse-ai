import { NextResponse } from "next/server";
import {
  buildSubmissionBrief
} from "@/lib/evidence-ledger";
import { getEvidenceLedger } from "@/lib/evidence-store";

export const runtime = "nodejs";

export async function GET() {
  const ledger = await getEvidenceLedger();

  return NextResponse.json({
    ledger,
    brief: buildSubmissionBrief(ledger)
  });
}
