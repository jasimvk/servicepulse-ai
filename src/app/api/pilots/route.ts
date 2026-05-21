import { NextResponse } from "next/server";
import {
  getPilotSummary,
  readPilotPipeline,
  upsertPilotRecord,
  type PilotRecord
} from "@/lib/pilot-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pilots = await readPilotPipeline();

  return NextResponse.json({
    pilots,
    summary: getPilotSummary(pilots)
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { pilot?: PilotRecord };

    if (!payload.pilot) {
      return NextResponse.json(
        { error: "Pilot record is required." },
        { status: 400 }
      );
    }

    const pilots = await upsertPilotRecord(payload.pilot);

    return NextResponse.json({
      pilots,
      summary: getPilotSummary(pilots)
    });
  } catch {
    return NextResponse.json(
      { error: "Pilot pipeline update failed." },
      { status: 400 }
    );
  }
}
