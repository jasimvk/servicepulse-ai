import { NextResponse } from "next/server";
import {
  getJobSummary,
  readJobPipeline,
  upsertJobRecord,
  type JobRecord
} from "@/lib/job-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await readJobPipeline();

  return NextResponse.json({
    jobs,
    summary: getJobSummary(jobs)
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { job?: JobRecord };

    if (!payload.job) {
      return NextResponse.json(
        { error: "Job record is required." },
        { status: 400 }
      );
    }

    const jobs = await upsertJobRecord(payload.job);

    return NextResponse.json({
      jobs,
      summary: getJobSummary(jobs)
    });
  } catch {
    return NextResponse.json(
      { error: "Job inbox update failed." },
      { status: 400 }
    );
  }
}
