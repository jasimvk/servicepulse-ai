import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaasLandingPage } from "./saas-landing-page";

describe("SaasLandingPage", () => {
  it("renders a customer-facing SaaS landing page without internal prize copy", () => {
    const { container } = render(<SaasLandingPage />);

    expect(screen.getByText("ServicePulse")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "AI operations desk for local service teams"
      })
    ).toBeTruthy();
    const workspaceLinks = screen.getAllByRole("link", {
      name: "Start workspace"
    });
    expect(workspaceLinks).toHaveLength(2);
    expect(
      workspaceLinks.every((link) => link.getAttribute("href") === "/signup")
    ).toBe(true);
    expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe(
      "/login"
    );
    expect(screen.getByText("Lead intake")).toBeTruthy();
    expect(screen.getByText("Job scheduling")).toBeTruthy();
    expect(screen.getByText("Invoice follow-up")).toBeTruthy();

    expect(container.innerHTML).not.toMatch(
      /xprize|prize|judge|submission|codex|superpowers|antigravity|opspilot/i
    );
    expect(container.querySelector('a[href="/prize"]')).toBeNull();
  });
});
