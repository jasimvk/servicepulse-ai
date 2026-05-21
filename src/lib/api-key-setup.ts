import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type EnvMap = Record<string, string>;

type RuntimeEnv = {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
};

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export type GeminiRuntimeConfig = {
  configured: boolean;
  apiKey?: string;
  maskedApiKey?: string;
  model: string;
  source: "process.env" | "env.local" | "missing";
};

export type GeminiValidationResult = {
  ok: boolean;
  status: number;
  message: string;
};

export function maskSecret(secret: string): string {
  if (secret.length <= 10) {
    return "configured";
  }

  return `${secret.slice(0, 6)}...${secret.slice(-4)}`;
}

export function upsertEnvValues(existingEnvText: string, values: EnvMap): string {
  const lines = existingEnvText
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const keys = new Set(Object.keys(values));
  const nextLines = lines.filter((line) => {
    const [key] = line.split("=", 1);
    return !keys.has(key);
  });

  for (const [key, value] of Object.entries(values)) {
    nextLines.push(`${key}=${value}`);
  }

  return `${nextLines.join("\n")}\n`;
}

export async function getGeminiRuntimeConfig(
  projectDir = process.cwd(),
  runtimeEnv: RuntimeEnv = process.env as RuntimeEnv
): Promise<GeminiRuntimeConfig> {
  if (runtimeEnv.GEMINI_API_KEY) {
    return {
      configured: true,
      apiKey: runtimeEnv.GEMINI_API_KEY,
      maskedApiKey: maskSecret(runtimeEnv.GEMINI_API_KEY),
      model: runtimeEnv.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
      source: "process.env"
    };
  }

  const localEnv = await readLocalEnv(projectDir);
  const localApiKey = localEnv.GEMINI_API_KEY;

  if (localApiKey) {
    return {
      configured: true,
      apiKey: localApiKey,
      maskedApiKey: maskSecret(localApiKey),
      model: localEnv.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
      source: "env.local"
    };
  }

  return {
    configured: false,
    model: localEnv.GEMINI_MODEL ?? runtimeEnv.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
    source: "missing"
  };
}

export async function writeLocalEnvValues(
  values: EnvMap,
  projectDir = process.cwd()
): Promise<void> {
  const path = join(projectDir, ".env.local");
  const existing = await readTextIfExists(path);
  const nextText = upsertEnvValues(existing, values);

  await mkdir(projectDir, { recursive: true });
  await writeFile(path, nextText, "utf-8");
}

export async function validateGeminiApiKey({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  fetcher = fetch
}: {
  apiKey: string;
  model?: string;
  fetcher?: Fetcher;
}): Promise<GeminiValidationResult> {
  const response = await fetcher(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: "Return OK." }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 8,
          temperature: 0
        }
      })
    }
  );

  return {
    ok: response.ok,
    status: response.status,
    message: response.ok
      ? "Gemini key validated."
      : `Gemini validation failed with ${response.status}.`
  };
}

async function readLocalEnv(projectDir: string): Promise<RuntimeEnv> {
  return parseEnv(await readTextIfExists(join(projectDir, ".env.local")));
}

async function readTextIfExists(path: string): Promise<string> {
  try {
    return await readFile(path, "utf-8");
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return "";
    }

    throw error;
  }
}

function parseEnv(text: string): RuntimeEnv {
  const env: RuntimeEnv = {};

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^["']|["']$/g, "");

    if (key === "GEMINI_API_KEY" || key === "GEMINI_MODEL") {
      env[key] = value;
    }
  }

  return env;
}
