import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthPanel, AuthSetupRequired } from "./auth-panel";

describe("AuthPanel", () => {
  it("renders a sign in form when auth is configured", () => {
    render(
      <AuthPanel
        action={vi.fn()}
        isConfigured
        mode="login"
        next="/dashboard"
      />
    );

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });

  it("renders setup state when Supabase configuration is missing", () => {
    render(
      <AuthSetupRequired
        missing={[
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
        ]}
        title="Authentication setup required"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Authentication setup required" })
    ).toBeTruthy();
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeTruthy();
    expect(
      screen.getByText("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    ).toBeTruthy();
  });
});
