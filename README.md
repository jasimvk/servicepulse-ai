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

- Customer-facing SaaS landing page at `/` with product workflow, pricing, and console calls to action.
- Supabase-ready sign in/sign up at `/login` and `/signup`.
- Customer SaaS console at `/dashboard` protected by Supabase Auth when configured, with workspace onboarding, plan limits, team seats, usage, Stripe checkout, and billing readiness.
- Separate personal prize workspace at `/prize` for submission evidence and judging materials.
- Owner dashboard with modeled revenue, lead conversion, workflow, and margin metrics in the personal prize workspace.
- API Key Setup Agent for validating and saving Gemini credentials locally.
- Alternate `/saas` route that redirects to the customer SaaS console.
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
- Database-backed or file-backed account store for SaaS billing, team, usage, and launch readiness.
- Supabase Postgres migration for workspaces, members, customers, jobs, usage events, and billing accounts with Row Level Security.
- Submission evidence ledger with quoted value, AI decisions logged, paying-user count, readiness scoring, and next proof needed.
- `/api/profile` route for saved business settings.
- `/api/account` route for SaaS workspace, plan, billing, team, usage, and launch settings.
- `/api/billing/checkout` route for Stripe subscription Checkout Sessions.
- `/api/billing/portal` route for Stripe customer portal sessions.
- `/api/billing/webhook` route for signed Stripe billing events.
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
http://localhost:3000/login
http://localhost:3000/signup
http://localhost:3000/dashboard
http://localhost:3000/prize
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
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Auth + Postgres
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
SUPABASE_SECRET_KEY=sb_secret_your_server_key

# Stripe subscription billing
STRIPE_SECRET_KEY=sk_test_or_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_STARTER=price_starter_monthly
STRIPE_PRICE_GROWTH=price_growth_monthly
STRIPE_PRICE_PRO=price_pro_monthly

# Optional for production persistent storage
KV_REST_API_URL=https://your-upstash-kv-url.upstash.io
KV_REST_API_TOKEN=your_upstash_kv_token
```

Without `GEMINI_API_KEY`, the app runs in honest demo mode and labels evidence as `deterministic-demo`.

`SERVICEPULSE_DATA_DIR` controls the local file-backed workspace. By default, evidence entries are written to `.data/evidence-ledger.json`, the business profile is written to `.data/business-profile.json`, account settings are written to `.data/account-settings.json`, jobs are written to `.data/job-pipeline.json`, and real pilot records are written to `.data/pilot-pipeline.json`. `.data/` is ignored by git.

If `KV_REST_API_URL` and `KV_REST_API_TOKEN` are provided, the application will use the Upstash/Vercel KV REST database as its primary storage for demo stores. If they are omitted, it gracefully falls back to the file system or OS temp storage on read-only platforms.

Supabase is the production customer database/auth path. Add the Supabase env vars, then run `supabase/migrations/20260526090000_initial_servicepulse_schema.sql` in the Supabase SQL editor or through the Supabase CLI. Until Supabase is configured, `/dashboard` shows the missing auth configuration instead of exposing a shared demo workspace.

Stripe billing is server-side only. The customer console posts to `/api/billing/checkout`, which creates a subscription Checkout Session, and `/api/billing/portal`, which opens the hosted customer portal after a Stripe customer is saved. Configure the Stripe webhook endpoint at `/api/billing/webhook` and send at least `checkout.session.completed` and `customer.subscription.deleted`.

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
- SaaS account persistence, Supabase auth/database helpers, Stripe billing helpers/API behavior, minimal console rendering, and proof packet export metrics

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
src/app/page.tsx                     Customer-facing SaaS landing page
src/app/dashboard/page.tsx           Customer SaaS console route
src/app/login/page.tsx               Customer sign-in page
src/app/signup/page.tsx              Customer sign-up page
src/app/auth/callback/route.ts       Supabase auth code exchange route
src/app/logout/route.ts              Supabase sign-out route
src/app/saas/page.tsx                Redirect to the SaaS console route
src/app/prize/page.tsx               Personal prize/submission workspace
src/app/api/agent/lead/route.ts      Lead-to-quote agent API
src/app/api/evidence/route.ts        Evidence ledger API
src/app/api/account/route.ts         SaaS account settings API
src/app/api/billing/checkout/route.ts Stripe subscription Checkout API
src/app/api/billing/portal/route.ts  Stripe customer portal API
src/app/api/billing/webhook/route.ts Signed Stripe billing webhook
src/app/api/jobs/route.ts            Customer job inbox API
src/app/api/pilots/route.ts          Real business pilot pipeline API
src/app/api/profile/route.ts         Saved business profile API
src/app/api/setup/keys/route.ts      Gemini key validation and local env writer
src/app/api/submission/proof-packet/route.ts Judge proof packet export
src/components/api-key-setup-agent.tsx API key setup UI
src/components/auth-panel.tsx        Customer auth and setup-required UI
src/components/saas-landing-page.tsx Customer SaaS landing page
src/components/minimal-saas-console.tsx Customer SaaS workspace console
src/components/saas-account-panel.tsx SaaS account and billing controls
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
src/lib/account-store.ts             KV-backed or file-backed SaaS account, team, usage, and launch persistence
src/lib/supabase-auth.ts             Supabase auth config, server session, and protection helpers
src/lib/workspace-account-store.ts   Supabase workspace-to-account persistence mapper
src/lib/stripe-billing.ts            Stripe checkout, portal, and webhook billing helpers
src/lib/job-store.ts                 KV-backed or file-backed customer job persistence
src/lib/pilot-store.ts               KV-backed or file-backed pilot pipeline persistence
src/lib/profile-store.ts             KV-backed or file-backed business profile persistence
src/lib/proof-packet.ts              Judge-ready submission export model
docs/demo-video-script.md            Devpost 2-minute demo video script
supabase/migrations/20260526090000_initial_servicepulse_schema.sql Production SaaS schema with RLS
```

## Product Rule

Do not let the app claim live Gemini, real revenue, or real customer proof unless that source is actually connected. Demo data should stay clearly labeled.
