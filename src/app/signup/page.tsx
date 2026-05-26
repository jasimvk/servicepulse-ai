import { AuthPanel } from "@/components/auth-panel";
import { getSupabaseConfigStatus } from "@/lib/supabase-auth";
import { signUpWithPassword } from "./actions";

type SignupPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const status = getSupabaseConfigStatus();

  return (
    <AuthPanel
      action={signUpWithPassword}
      error={getErrorMessage(params?.error)}
      isConfigured={status.isConfigured}
      mode="signup"
      next={params?.next || "/dashboard"}
    />
  );
}

function getErrorMessage(error?: string) {
  if (error === "signup_failed") {
    return "Account creation failed.";
  }

  if (error === "auth_not_configured") {
    return "Authentication is not configured yet.";
  }

  return "";
}
