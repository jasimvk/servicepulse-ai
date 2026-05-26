import { NextResponse } from "next/server";
import {
  getAccountSummary,
  readAccount,
  saveAccount,
  type AccountSettings
} from "@/lib/account-store";
import {
  getCurrentSupabaseUser,
  getSupabaseConfigStatus
} from "@/lib/supabase-auth";
import {
  readWorkspaceAccountForUser,
  saveWorkspaceAccountForUser
} from "@/lib/workspace-account-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authStatus = getSupabaseConfigStatus();

  if (authStatus.isConfigured) {
    const user = await getCurrentSupabaseUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const account = await readWorkspaceAccountForUser(user);

      return NextResponse.json({
        account,
        summary: getAccountSummary(account)
      });
    } catch {
      return NextResponse.json(
        { error: "Database workspace is not ready." },
        { status: 503 }
      );
    }
  }

  const account = await readAccount();

  return NextResponse.json({
    account,
    summary: getAccountSummary(account)
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { account?: AccountSettings };

    if (!payload.account) {
      return NextResponse.json(
        { error: "Account settings are required." },
        { status: 400 }
      );
    }

    const authStatus = getSupabaseConfigStatus();

    if (authStatus.isConfigured) {
      const user = await getCurrentSupabaseUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payloadResult = await saveWorkspaceAccountForUser(
        payload.account,
        user
      );

      return NextResponse.json(payloadResult);
    }

    const account = await saveAccount(payload.account);

    return NextResponse.json({
      account,
      summary: getAccountSummary(account)
    });
  } catch {
    return NextResponse.json(
      { error: "Account settings update failed." },
      { status: 400 }
    );
  }
}
