"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";

type KeyStatus = {
  configured: boolean;
  maskedApiKey?: string;
  model: string;
  source: "process.env" | "env.local" | "missing";
};

type KeySetupResponse = {
  message?: string;
  error?: string;
  gemini: KeyStatus;
};

const defaultStatus: KeyStatus = {
  configured: false,
  model: "gemini-2.5-flash",
  source: "missing"
};

export function ApiKeySetupAgent() {
  const [status, setStatus] = useState<KeyStatus>(defaultStatus);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [message, setMessage] = useState("Checking Gemini key status...");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const response = await fetch("/api/setup/keys", { cache: "no-store" });
        const payload = (await response.json()) as KeySetupResponse;
        setStatus(payload.gemini);
        setModel(payload.gemini.model);
        setMessage(
          payload.gemini.configured
            ? `Gemini configured from ${payload.gemini.source}.`
            : "Gemini key missing. Paste a key to validate and save locally."
        );
      } catch {
        setMessage("Could not check key status.");
      }
    }

    void loadStatus();
  }, []);

  async function saveKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("Validating Gemini key...");

    try {
      const response = await fetch("/api/setup/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          geminiApiKey: apiKey,
          geminiModel: model
        })
      });
      const payload = (await response.json()) as KeySetupResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Key validation failed.");
      }

      setStatus(payload.gemini);
      setApiKey("");
      setMessage(payload.message ?? "Gemini key saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Key setup failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-6 lg:px-8">
      <div className="rounded-lg border border-cyan/25 bg-cyan/[0.025] p-6 shadow-[0_0_24px_rgba(27,191,224,0.05)]">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="pixel-text text-xs tracking-wider text-cyan">
              Setup Agent
            </p>
            <h2 className="mt-1 text-lg font-bold text-white">
              API Key Readiness
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Validates a Gemini key, saves it to local `.env.local`, and keeps
              raw secrets out of the UI.
            </p>
            <div className="mt-5 rounded border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                {status.configured ? (
                  <CheckCircle2 className="text-emerald-400" size={18} />
                ) : (
                  <ShieldAlert className="text-amber-400" size={18} />
                )}
                <span className="font-mono text-xs uppercase tracking-wider text-white/70">
                  {status.configured ? "Configured" : "Missing"}
                </span>
              </div>
              <div
                className="mt-3 space-y-1 font-mono text-[10px] text-white/45"
                data-testid="key-status"
              >
                <p>Source: {status.source}</p>
                <p>Model: {status.model}</p>
                <p>Key: {status.maskedApiKey ?? "not set"}</p>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={saveKey}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Gemini API Key
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                data-testid="gemini-api-key"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="AIza..."
                type="password"
                value={apiKey}
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
              Gemini Model
              <input
                className="mt-2 w-full rounded border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-cyan focus:ring-1 focus:ring-cyan/35"
                data-testid="gemini-model"
                onChange={(event) => setModel(event.target.value)}
                value={model}
              />
            </label>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-cyan px-4 py-3 text-sm font-bold uppercase tracking-wider text-near-black shadow-[0_0_15px_rgba(27,191,224,0.2)] transition hover:bg-[#16A8C6] disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="save-api-key"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
              {isSaving ? "Validating..." : "Validate & Save Key"}
            </button>
            <div
              className="rounded border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] text-white/55"
              data-testid="key-setup-message"
            >
              {message}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
