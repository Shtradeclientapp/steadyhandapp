# Steadyhand — Setup & Deployment Guide

## What's in this project

A full-stack Next.js 14 app with:
- **Supabase** — Postgres database, Auth, Realtime messaging, Storage
- **Anthropic Claude** — AI tradie matching + scope agreement drafting + message suggestions
- **Vercel** — one-command deployment

---

## Step 1 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `steadyhand`), set a strong database password, select **ap-southeast-2** (Sydney) for WA latency
3. Wait ~2 minutes for provisioning

### Run the database migration

In your Supabase project dashboard:
1. Go to **SQL Editor** → **New query**
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### Create storage buckets

In **Storage** → **New bucket**:
- `job-photos` — set to **Public**
- `documents` — set to **Private**

### Get your API keys

Go to **Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. **API Keys** → **Create Key**
3. Copy it → `ANTHROPIC_API_KEY`

---

## Step 3 — Install and run locally

```bash
npm install
cp .env.local .env.local   # already created — fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 4 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted:
- Link to new project: **Yes**
- Framework: **Next.js** (auto-detected)
- Root directory: **./** (default)

Then add environment variables in Vercel dashboard → your project → **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
ANTHROPIC_API_KEY             = sk-ant-...
NEXT_PUBLIC_APP_URL           = https://your-vercel-url.vercel.app
```

Redeploy after adding env vars:
```bash
vercel --prod
```

---

## Architecture overview

```
app/
├── api/
│   ├── auth/         POST — signup / login / logout
│   ├── jobs/         GET list, POST create (triggers AI match)
│   ├── match/        POST — Claude scores & ranks tradies
│   ├── scope/        POST — Claude drafts scope agreement
│   ├── messages/     GET/POST messages + AI suggestions
│   ├── milestones/   PATCH — submit / approve / dispute
│   ├── warranty/     GET/POST/PATCH warranty issues
│   └── upload/       POST — files to Supabase Storage
├── dashboard/        Server component — job list
├── request/          Client form — 3-step job submission
├── login/            Auth page
└── signup/           Registration — client + tradie

lib/
├── supabase/
│   ├── client.ts     Browser Supabase client
│   └── server.ts     Server + service-role clients
├── hooks/
│   ├── useAuth.ts    Auth context + profile
│   ├── useMessages.ts Real-time message hook
│   └── useUpload.ts  File upload with progress

components/
├── ui/index.tsx      Button, Card, Badge, Input, AIPanel...
├── layout/Nav.tsx    Fixed nav + CycleRail stage indicator
└── forms/
    ├── MessageThread.tsx  Real-time chat with AI suggestions
    └── Dropzone.tsx       Drag-and-drop file upload

supabase/
└── migrations/
    └── 001_initial_schema.sql  Full Postgres schema + RLS
```

---

## How the AI features work

### Tradie matching (`/api/match`)
Called automatically when a job is created. Claude receives:
- The job title, description, trade, suburb, urgency
- Up to 10 eligible tradies (filtered by subscription + trade category)

Claude scores each 0–100 on: category fit (40%), location (20%), track record (20%), verification (10%), response time (10%). Returns ranked shortlist with reasoning text shown to the client.

### Scope drafting (`/api/scope`)
Called when client proceeds to Agreement stage. Claude receives the job details + full message thread. Returns structured JSON: inclusions, exclusions, milestone breakdown, warranty period, notes. Saved to `scope_agreements` table.

### Message suggestions (`/api/messages` OPTIONS)
Called when a message thread loads. Returns 3 short contextual prompts for the current job stage and role. Shown as clickable pills above the message input.

---

## Demo accounts

After running the migration, create two demo users via Supabase **Auth → Users → Invite user**:
- `client@demo.com` / `demo1234` → create profile with role `client`
- `tradie@demo.com` / `demo1234` → create profile with role `tradie`

Or use the demo buttons on the login page (they attempt signIn — create the users first).

---

## Supabase Realtime

Messages use `postgres_changes` subscriptions — no extra config needed. Make sure **Realtime** is enabled for the `messages` table:

Supabase dashboard → **Database → Replication → supabase_realtime** → enable for `messages`.

---

## Cost estimates (free tiers cover MVP launch)

| Service    | Free tier                           | Paid when...                    |
|------------|-------------------------------------|---------------------------------|
| Supabase   | 500MB DB, 1GB storage, 50k MAU      | > 50k users or > 500MB DB       |
| Vercel     | Unlimited deployments, 100GB BW     | > 100GB bandwidth               |
| Anthropic  | $5 free credit                      | ~$0.003/match, ~$0.005/scope    |

For the MVP (20–50 tradies, 100–200 jobs/month), expect ~$5–15/month in Anthropic API costs.
