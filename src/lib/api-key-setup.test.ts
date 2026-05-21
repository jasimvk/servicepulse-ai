import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getGeminiRuntimeConfig,
  maskSecret,
  upsertEnvValues,
  validateGeminiApiKey,
  writeLocalEnvValues
} from "./api-key-setup";

let projectDir = "";

beforeEach(async () => {
  projectDir = await mkdtemp(join(tmpdir(), "opspilot-keys-"));
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

describe("api key setup utilities", () => {
  it("masks secrets without exposing the raw key", () => {
    expect(maskSecret("AIzaSyA-real-looking-secret-key-1234")).toBe(
      "AIzaSy...1234"
    );
  });

  it("merges new values into existing env text", () => {
    const nextEnv = upsertEnvValues("EXISTING=true\nGEMINI_MODEL=old\n", {
      GEMINI_API_KEY: "new-key",
      GEMINI_MODEL: "gemini-2.5-flash"
    });

    expect(nextEnv).toContain("EXISTING=true");
    expect(nextEnv).toContain("GEMINI_API_KEY=new-key");
    expect(nextEnv).toContain("GEMINI_MODEL=gemini-2.5-flash");
    expect(nextEnv).not.toContain("GEMINI_MODEL=old");
  });

  it("reads runtime config from .env.local when process env is not set", async () => {
    await writeFile(
      join(projectDir, ".env.local"),
      "GEMINI_API_KEY=local-key-1234\nGEMINI_MODEL=gemini-2.5-flash\n",
      "utf-8"
    );

    const config = await getGeminiRuntimeConfig(projectDir, {});

    expect(config.apiKey).toBe("local-key-1234");
    expect(config.maskedApiKey).toBe("local-...1234");
    expect(config.model).toBe("gemini-2.5-flash");
    expect(config.source).toBe("env.local");
  });

  it("writes local env values without losing unrelated entries", async () => {
    await writeFile(join(projectDir, ".env.local"), "KEEP=1\n", "utf-8");

    await writeLocalEnvValues(
      {
        GEMINI_API_KEY: "saved-key",
        GEMINI_MODEL: "gemini-2.5-flash"
      },
      projectDir
    );

    const localEnv = await readFile(join(projectDir, ".env.local"), "utf-8");
    expect(localEnv).toContain("KEEP=1");
    expect(localEnv).toContain("GEMINI_API_KEY=saved-key");
  });

  it("validates a Gemini key with the selected model endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] })
    });

    const result = await validateGeminiApiKey({
      apiKey: "valid-key",
      model: "gemini-2.5-flash",
      fetcher
    });

    expect(result.ok).toBe(true);
    expect(fetcher.mock.calls[0][0]).toContain("gemini-2.5-flash");
    expect(fetcher.mock.calls[0][0]).toContain("key=valid-key");
  });
});
