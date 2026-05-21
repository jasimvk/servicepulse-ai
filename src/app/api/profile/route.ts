import { NextResponse } from "next/server";
import {
  readBusinessProfile,
  saveBusinessProfile
} from "@/lib/profile-store";
import type { BusinessProfile } from "@/lib/servicepulse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    profile: await readBusinessProfile()
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { profile?: BusinessProfile };

  if (!body.profile?.name || !body.profile?.services?.length) {
    return NextResponse.json(
      { error: "Business profile name and at least one service are required." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    profile: await saveBusinessProfile(body.profile)
  });
}
