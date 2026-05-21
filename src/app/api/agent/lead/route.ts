import { NextResponse } from "next/server";
import { appendEvidenceEntry } from "@/lib/evidence-store";
import { runLeadAgent } from "@/lib/gemini-agent";
import { defaultBusinessProfile } from "@/lib/opspilot";
import type { BusinessProfile, LeadInput } from "@/lib/opspilot";

export const runtime = "nodejs";

type LeadAgentRequest = {
  profile?: BusinessProfile;
  lead?: LeadInput;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LeadAgentRequest;

  if (!body.lead?.customer || !body.lead?.message) {
    return NextResponse.json(
      { error: "Lead customer and message are required." },
      { status: 400 }
    );
  }

  try {
    const response = await runLeadAgent({
      profile: body.profile ?? defaultBusinessProfile,
      lead: body.lead
    });
    await appendEvidenceEntry(response.evidenceEntry);

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gemini agent run failed."
      },
      { status: 502 }
    );
  }
}
