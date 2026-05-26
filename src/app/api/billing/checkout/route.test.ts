import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/billing/checkout", () => {
  it("returns configuration guidance when Stripe is not configured", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_PRICE_STARTER", "");
    vi.stubEnv("STRIPE_PRICE_GROWTH", "");
    vi.stubEnv("STRIPE_PRICE_PRO", "");

    const response = await POST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan: "growth" })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      error: "stripe_not_configured",
      missing: [
        "STRIPE_SECRET_KEY",
        "STRIPE_PRICE_STARTER",
        "STRIPE_PRICE_GROWTH",
        "STRIPE_PRICE_PRO"
      ]
    });
  });
});
