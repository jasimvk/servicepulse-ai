import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Supabase database schema", () => {
  it("creates SaaS tables with row level security enabled", () => {
    const schema = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260526090000_initial_servicepulse_schema.sql"
      ),
      "utf-8"
    ).toLowerCase();

    for (const table of [
      "workspaces",
      "workspace_members",
      "customers",
      "jobs",
      "usage_events",
      "billing_accounts"
    ]) {
      expect(schema).toContain(`create table if not exists public.${table}`);
      expect(schema).toContain(
        `alter table public.${table} enable row level security`
      );
    }

    expect(schema).toContain("auth.uid()");
  });
});
