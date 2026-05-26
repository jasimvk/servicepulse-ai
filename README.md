# ServicePulse AI Gemini XPRIZE

ServicePulse AI is a Gemini-ready AI operations desk for local service businesses. It is built as a submission-oriented starter for the Build with Gemini XPRIZE: a working product surface, live/demo agent backend, and evidence dashboard that tracks the proof judges will care about.

The first target niche is local service operators such as AC repair shops, salons, clinics, cleaning companies, tutors, and home repair teams.

## Why This Can Compete

ServicePulse AI is aligned to the prize criteria:

- **Business viability:** subscription revenue, pilot customers, conversion, margin, and proof items are represented as a transparent readiness model until real customer evidence is connected.
- **AI-native operations:** the agent qualifies leads, quotes jobs, schedules technicians, drafts invoices, queues follow-ups, and logs each decision.
- **Category impact:** the product helps small businesses get an always-on operations desk they could not normally afford.

## Current Product

The app currently includes:

- Owner dashboard with modeled revenue, lead conversion, workflow, and margin metrics.
- API Key Setup Agent for validating and saving Gemini credentials locally.
- SaaS Account panel for workspace, plan, seats, billing links, subscription status, and region.
- Business onboarding/workbench form for service menu, territory, technician, and lead message.
- Job Inbox for tracking customer requests through quote, booking, invoice, payment, and follow-up.
- Pilot CRM for tracking real outreach, paid pilots, permission, payment links, and evidence links.
- `/api/agent/lead` route that runs the agent in either live Gemini mode or deterministic demo mode.
- `/api/setup/keys` route that validates Gemini keys and writes `.env.local` only after validation succeeds.
- Gemini adapter using `gemini-2.5-flash` by default.
- Database-backed or file-backed business profile and service menu store.
- Database-backed or file-backed evidence store for agent runs.
- Database-backed or file-backed job store for owner workflow tracking.
- Database-backed or file-backed pilot pipeline store for real business validation.
- Database-backed or file-backed account store for SaaS billing readiness.
- Submission evidence ledger with quoted value, AI decisions logged, paying-user count, readiness scoring, and next proof needed.
- `/api/profile` route for saved business settings.
- `/api/account` route for SaaS workspace, plan, billing, and seat settings.
- `/api/jobs` route for saved customer jobs.
- `/api/pilots` route for the real business pilot pipeline.
- `/api/evidence` route for seeded evidence.
- `/api/submission/proof-packet` route for judge-ready JSON evidence export.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Then set:

```bash
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.5-flash
SERVICEPULSE_DATA_DIR=.data

# Optional for production persistent storage
KV_REST_API_URL=https://your-upstash-kv-url.upstash.io
KV_REST_API_TOKEN=your_upstash_kv_token
```

Without `GEMINI_API_KEY`, the app runs in honest demo mode and labels evidence as `deterministic-demo`.

`SERVICEPULSE_DATA_DIR` controls the local file-backed workspace. By default, evidence entries are written to `.data/evidence-ledger.json`, the business profile is written to `.data/business-profile.json`, account settings are written to `.data/account-settings.json`, jobs are written to `.data/job-pipeline.json`, and real pilot records are written to `.data/pilot-pipeline.json`. `.data/` is ignored by git.

If `KV_REST_API_URL` and `KV_REST_API_TOKEN` are provided, the application will use the Upstash/Vercel KV REST database as its primary storage. If they are omitted, it gracefully falls back to the file system or OS temp storage on read-only platforms.

The in-app API Key Setup Agent saves validated Gemini keys to `.env.local`, which is ignored by git. It never returns the raw key back to the browser after saving; it only shows a masked key.

## Verification

Use these before handing work off:

```bash
npm run lint
npm test
npm run build
```

Current test coverage is focused on:

- agent workflow and business metrics
- Gemini prompt/response adapter
- evidence ledger and submission readiness scoring
- job inbox, invoice tracking, API behavior, and proof packet export metrics
- pilot pipeline persistence, API behavior, and proof packet export metrics
- SaaS account persistence, API behavior, UI rendering, and proof packet export metrics

## Public Deployment

You can deploy this application publicly using Vercel (recommended for Next.js) or any Next.js-compatible hosting provider.

### Deploying to Vercel (CLI)

1. Run the Vercel deployment command:
   ```bash
   npx vercel
   ```
2. Follow the interactive prompts to log in, link your project, and deploy.
3. Configure your production environment variables (e.g. `GEMINI_API_KEY`) on the Vercel Dashboard under **Project Settings > Environment Variables** to enable live mode.

### Continuous Integration (Git Integration)

Alternatively, push the repository to GitHub, GitLab, or Bitbucket, and connect it to your Vercel/Netlify account for automatic deployments on every commit.

## Important Files

```text
src/app/page.tsx                     Main product/dashboard page
src/app/api/agent/lead/route.ts      Lead-to-quote agent API
src/app/api/evidence/route.ts        Evidence ledger API
src/app/api/account/route.ts         SaaS account settings API
src/app/api/jobs/route.ts            Customer job inbox API
src/app/api/pilots/route.ts          Real business pilot pipeline API
src/app/api/profile/route.ts         Saved business profile API
src/app/api/setup/keys/route.ts      Gemini key validation and local env writer
src/app/api/submission/proof-packet/route.ts Judge proof packet export
src/components/api-key-setup-agent.tsx API key setup UI
src/components/saas-account-panel.tsx SaaS account and billing readiness UI
src/components/job-inbox-panel.tsx   Customer job tracker UI
src/components/pilot-crm-panel.tsx   Real business pilot tracker UI
src/components/servicepulse-workbench.tsx Interactive business setup + agent run UI
src/components/proof-packet-panel.tsx Judge evidence export panel
src/components/submission-dashboard.tsx XPRIZE evidence dashboard
src/lib/servicepulse.ts                  Core seeded demo business model and deterministic run
src/lib/gemini-agent.ts              Gemini API adapter and demo fallback
src/lib/api-key-setup.ts             Secret masking, Gemini validation, .env.local merge logic
src/lib/evidence-ledger.ts           Submission proof ledger and readiness scoring
src/lib/evidence-store.ts            KV-backed or file-backed evidence persistence
src/lib/account-store.ts             KV-backed or file-backed SaaS account persistence
src/lib/job-store.ts                 KV-backed or file-backed customer job persistence
src/lib/pilot-store.ts               KV-backed or file-backed pilot pipeline persistence
src/lib/profile-store.ts             KV-backed or file-backed business profile persistence
src/lib/proof-packet.ts              Judge-ready submission export model
docs/demo-video-script.md            Devpost 2-minute demo video script
```

## Product Rule

Do not let the app claim live Gemini, real revenue, or real customer proof unless that source is actually connected. Demo data should stay clearly labeled.
