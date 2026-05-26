import { describe, expect, it } from "vitest";
import {
  getSupabaseAdminConfigStatus,
  getSupabaseConfigStatus,
  getSupabaseLoginRedirect,
  isProtectedCustomerPath
} from "./supabase-auth";

describe("supabase auth helpers", () => {
  it("reports missing Supabase configuration", () => {
    expect(getSupabaseConfigStatus({})).toEqual({
      isConfigured: false,
      missing: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      ]
    });
  });

  it("reports configured Supabase auth when public server keys are present", () => {
    expect(
      getSupabaseConfigStatus({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123"
      })
    ).toEqual({
      isConfigured: true,
      missing: []
    });
  });

  it("reports configured Supabase admin access when a server secret is present", () => {
    expect(
      getSupabaseAdminConfigStatus({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SECRET_KEY: "sb_secret_123"
      })
    ).toEqual({
      isConfigured: true,
      missing: []
    });
  });

  it("builds a safe login redirect for protected paths only", () => {
    expect(getSupabaseLoginRedirect("/dashboard")).toBe(
      "/login?next=%2Fdashboard"
    );
    expect(getSupabaseLoginRedirect("https://evil.example")).toBe(
      "/login?next=%2Fdashboard"
    );
  });

  it("detects protected customer paths", () => {
    expect(isProtectedCustomerPath("/dashboard")).toBe(true);
    expect(isProtectedCustomerPath("/api/account")).toBe(true);
    expect(isProtectedCustomerPath("/api/billing/checkout")).toBe(true);
    expect(isProtectedCustomerPath("/api/billing/portal")).toBe(true);
    expect(isProtectedCustomerPath("/api/billing/webhook")).toBe(false);
    expect(isProtectedCustomerPath("/")).toBe(false);
    expect(isProtectedCustomerPath("/api/submission/proof-packet")).toBe(false);
  });
});
