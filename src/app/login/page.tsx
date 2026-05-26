import { AuthPanel } from "@/components/auth-panel";
import { getSupabaseConfigStatus } from "@/lib/supabase-auth";
import { signInWithPassword } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const status = getSupabaseConfigStatus();

  return (
    <AuthPanel
      action={signInWithPassword}
      error={getErrorMessage(params?.error)}
      isConfigured={status.isConfigured}
      mode="login"
      next={params?.next || "/dashboard"}
    />
  );
}

function getErrorMessage(error?: string) {
  if (error === "invalid_credentials") {
    return "Email or password is incorrect.";
  }

  if (error === "auth_not_configured") {
    return "Authentication is not configured yet.";
  }

  return "";
}
