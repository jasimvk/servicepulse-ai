# Product Running Evidence

## Current Status
ServicePulse AI runs locally as a Next.js app with a Gemini-ready backend adapter.

## Verification Commands
```bash
npm run lint
npm test
npm run build
```

## Runtime
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Evidence Notes
- Demo mode is deterministic and labeled as `deterministic-demo`.
- Live Gemini mode is only enabled after a valid `GEMINI_API_KEY` is saved through the API Key Setup Agent or `.env.local`.
- Agent runs are persisted in `.data/evidence-ledger.json`, which is ignored by git because it may contain user-specific local evidence.
- The public repository keeps playbooks and manifest files inspectable without including API keys or local evidence files.
