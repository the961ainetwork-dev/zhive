# zhive.xyz — the AI operating hive for startups

Deploy specialist AI agents across six interconnected layers — Executive Strategy, Revenue, Operations,
Product, Intelligence, and Infrastructure — plus a rentable agent directory, and get one unified COO report.
Built MENA-first (Lebanon & the Middle East).

## What's inside

- **Vite + React** single-page app (`src/App.jsx`)
- **Home** — hero, "How it works" and "Six layers" as horizontal accordions, directory teaser
- **Agent directory** — 20 rentable specialists with search and category filters
- **Agent pages** — synopsis, case study, implementation advice, pricing, live demo per agent (55+ agents)
- **About** — AI Workforce infographic page
- **Knowledge** — resources page with the "Loop Engineering" essay
- **Cart & checkout** (prototype — no payments processed), **user workspace**, **24h demo account**
- **Streaming responses** — agent briefs render token-by-token (draft and QA-revision phases both stream)
- **Agent handoffs (L6 relay)** — chain any output into another specialist from agent pages or the workspace
- **Saved pipelines** — save any multi-agent chain as a reusable pipeline; 4 curated pipelines included (Strategy Sprint, Launch Prep, Competitor Scan, Investor Update)
- **Daily usage quotas** — enforced server-side in `api/agent.js`: signed-in users 300 API calls/day (~100 runs), anonymous/demo 50/day per IP (override with `DAILY_CALL_LIMIT_USER` / `DAILY_CALL_LIMIT_ANON` env vars)
- **Admin** at the footer `/admin` link (prototype password: `zhive2026`)
- **`api/agent.js`** — Vercel serverless function that proxies AI calls to the Anthropic API so your key
  stays server-side

## Persistence: two modes

- **Prototype mode (zero setup):** if Supabase env vars aren't set, the app runs with in-memory data
  (resets on refresh). Admin password: `zhive2026`.
- **Production mode (Supabase):** set the env vars below and the app switches to real auth (hashed
  passwords, sessions handled by Supabase), Postgres persistence for profiles/orders/purchases with
  row-level security, and a server-verified admin dashboard.

### Supabase setup (10 minutes)

1. Create a free project at https://supabase.com → copy the **Project URL**, **anon key**, and
   **service_role key** from Settings → API.
2. In the Supabase dashboard, open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. (Recommended for testing) Authentication → Providers → Email → turn **off** "Confirm email"
   so sign-ups log in instantly. Leave it on for production.
4. Set environment variables:
   - Local: copy `.env.example` to `.env` and fill in values.
   - Vercel: Project → Settings → Environment Variables — add all of:
     `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client), and
     `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY` (server).
5. Redeploy. The footer will read "connected to Supabase" when live.

> Still prototype-level: checkout records orders without payments. Add Stripe (or regionally
> Areeba / Whish) before charging anyone — never handle raw card numbers yourself. And never commit
> `.env` or expose the service-role key / Anthropic key in client code.

## Run locally

```bash
npm install
npm run dev
```

The UI runs immediately. Agent demos call `/api/agent`, which only exists on Vercel — for full local
testing either run `vercel dev` (with the env var set), or temporarily point `callClaude` in
`src/App.jsx` back at your own endpoint.

## Deploy: GitHub → Vercel

1. **Create the GitHub repo**
   ```bash
   git init
   git add .
   git commit -m "zhive.xyz initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/zhive.git
   git push -u origin main
   ```
2. **Import to Vercel** — at vercel.com: *Add New → Project → Import* your `zhive` repo.
   Vercel auto-detects Vite; defaults are fine (build: `vite build`, output: `dist`).
3. **Add the API key** — Project → Settings → Environment Variables:
   `ANTHROPIC_API_KEY` = your key from the Anthropic Console (https://console.anthropic.com).
   Redeploy after saving.
4. **Attach your domain** — Project → Settings → Domains → add `zhive.xyz` and follow the DNS steps.

API docs: https://docs.claude.com/en/api/overview

## Roadmap ideas

- Real auth + database (Supabase), hashed passwords, persistent workspaces
- Payments (Stripe; regionally: Areeba / Whish) — keep card handling with the processor
- Deeper handoffs: multi-agent auto-pipelines and saved pipeline templates
- Arabic / French UI
