import { NextResponse } from "next/server";
import {
  getGeminiRuntimeConfig,
  maskSecret,
  validateGeminiApiKey,
  writeLocalEnvValues
} from "@/lib/api-key-setup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KeySetupRequest = {
  geminiApiKey?: string;
  geminiModel?: string;
};

export async function GET() {
  const config = await getGeminiRuntimeConfig();

  return NextResponse.json({
    gemini: {
      configured: config.configured,
      maskedApiKey: config.maskedApiKey,
      model: config.model,
      source: config.source
    }
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as KeySetupRequest;
  const apiKey = body.geminiApiKey?.trim();
  const model = body.geminiModel?.trim() || "gemini-2.5-flash";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is required." },
      { status: 400 }
    );
  }

  const validation = await validateGeminiApiKey({ apiKey, model });

  if (!validation.ok) {
    return NextResponse.json(
      {
        error: validation.message,
        gemini: {
          configured: false,
          model,
          source: "missing"
        }
      },
      { status: 400 }
    );
  }

  await writeLocalEnvValues({
    GEMINI_API_KEY: apiKey,
    GEMINI_MODEL: model
  });

  const updatedConfig = await getGeminiRuntimeConfig();
  const isMemory = updatedConfig.source === "memory";

  return NextResponse.json({
    message: isMemory
      ? "Gemini key validated and saved in-memory (read-only environment)."
      : "Gemini key validated and saved to .env.local.",
    gemini: {
      configured: true,
      maskedApiKey: maskSecret(apiKey),
      model,
      source: updatedConfig.source
    }
  });
}
