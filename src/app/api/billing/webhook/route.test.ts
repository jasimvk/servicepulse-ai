import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/billing/webhook", () => {
  it("requires Stripe webhook configuration before accepting events", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");

    const response = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: "{}"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toMatchObject({
      error: "stripe_webhook_not_configured"
    });
  });
});
