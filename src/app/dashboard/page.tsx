import { redirect } from "next/navigation";
import { AuthSetupRequired } from "@/components/auth-panel";
import { MinimalSaasConsole } from "@/components/minimal-saas-console";
import { getAccountSummary } from "@/lib/account-store";
import {
  getCurrentSupabaseUser,
  getSupabaseConfigStatus,
  getSupabaseLoginRedirect
} from "@/lib/supabase-auth";
import { readWorkspaceAccountForUser } from "@/lib/workspace-account-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const authStatus = getSupabaseConfigStatus();

  if (!authStatus.isConfigured) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] px-5 py-10 text-[#161616]">
        <div className="mx-auto max-w-2xl">
          <AuthSetupRequired
            missing={authStatus.missing}
            title="Authentication setup required"
          />
        </div>
      </main>
    );
  }

  const user = await getCurrentSupabaseUser();

  if (!user) {
    redirect(getSupabaseLoginRedirect("/dashboard"));
  }

  const account = await readWorkspaceAccountForUser(user).catch(() => null);

  if (!account) {
    return (
      <main className="min-h-screen bg-[#f7f7f4] px-5 py-10 text-[#161616]">
        <div className="mx-auto max-w-2xl">
          <AuthSetupRequired
            missing={["Run supabase/migrations/20260526090000_initial_servicepulse_schema.sql"]}
            title="Database setup required"
          />
        </div>
      </main>
    );
  }

  return (
    <MinimalSaasConsole
      account={account}
      summary={getAccountSummary(account)}
    />
  );
}
