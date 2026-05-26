import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/billing/portal", () => {
  it("requires a saved Stripe customer before creating a portal session", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");

    const response = await POST(
      new Request("http://localhost/api/billing/portal", {
        method: "POST",
        headers: {
          Accept: "application/json"
        }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload).toMatchObject({
      error: "stripe_customer_missing"
    });
  });
});
