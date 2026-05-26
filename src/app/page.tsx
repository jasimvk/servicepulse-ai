import { MinimalSaasConsole } from "@/components/minimal-saas-console";
import { getAccountSummary, readAccount } from "@/lib/account-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const account = await readAccount();

  return (
    <MinimalSaasConsole
      account={account}
      summary={getAccountSummary(account)}
    />
  );
}
