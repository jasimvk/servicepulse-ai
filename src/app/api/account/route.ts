import { NextResponse } from "next/server";
import {
  getAccountSummary,
  readAccount,
  saveAccount,
  type AccountSettings
} from "@/lib/account-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
