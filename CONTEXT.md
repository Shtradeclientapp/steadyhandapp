# Steadyhand — Claude Session Context

Paste this file at the start of every new Claude session to get up to speed instantly.

---

## Project

**Steadyhand** — a request-to-warranty platform for Western Australian homeowners and trade businesses. Clients drive an 8-stage pipeline from job request through to post-job warranty. Tradies respond to the client's process.

- **Live app:** https://steadyhandapp.vercel.app
- **GitHub:** https://github.com/Shtradeclientapp/steadyhandapp
- **Local files:** `~/Downloads/steadyhand-app`

---

## Stack

- **Framework:** Next.js 14.2 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database/Auth:** Supabase (Postgres + Storage + Realtime)
- **Payments:** Stripe Connect (milestone payments, 5% platform fee) + Stripe subscriptions for tradies
- **AI:** Anthropic claude-sonnet-4-20250514 (matching, trust scoring, dialogue prompts)
- **Email:** Resend
- **Deploy:** Vercel — always use `vercel --prod` from `~/Downloads/steadyhand-app`

---

## Project structure

```
~/Downloads/steadyhand-app/
  app/
    dashboard/page.tsx          — client dashboard
    tradie/
      dashboard/page.tsx        — tradie dashboard
      job/page.tsx              — tradie job view
      profile/page.tsx          — tradie profile
    request/page.tsx            — stage 1: Request
    shortlist/page.tsx          — stage 2: Match
    assess/page.tsx             — stage 3: Assess
    quotes/page.tsx             — stage 4: Quote
    agreement/page.tsx          — stage 5: Confirm
    delivery/page.tsx           — stage 6: Build
    signoff/page.tsx            — stage 7: Complete
    warranty/page.tsx           — stage 8: Protect
    api/
      auth/                     — auth helpers
      jobs/                     — job CRUD
      match/                    — AI matching
      milestones/               — milestone management
      messages/                 — messaging
      scope/                    — scope agreement
      email/                    — Resend email (notifications@steadyhanddigital.com from Apr 15)
      dialogue/                 — trust scoring
      contribution/             — voluntary tip/contribution via Stripe
      stripe/                   — Stripe Connect + subscriptions
      warranty/                 — warranty issue tracking
      upload/                   — file uploads to Supabase Storage
  components/
    ui/                         — Badge, Card, ProgressBar, EmptyState, NavHeader
    layout/
      Nav.tsx                   — persistent nav
  lib/
    supabase/
      client.ts                 — browser client
      server.ts                 — server client
  types/index.ts                — shared TypeScript types
  middleware.ts                 — auth middleware
```

---

## Brand

| Token | Hex | Usage |
|---|---|---|
| Mist | `#C8D5D2` | Background |
| Charcoal | `#1C2B32` | Primary text, dark surfaces |
| Terracotta | `#D4522A` | CTAs, active states, urgent prompts |
| Sage | `#2E7D60` | Success, verified, complete |

**Fonts:** Aboreto (wordmark/logo), Barlow Condensed (headings), Barlow (body)

---

## 8-stage pipeline

| # | Stage | Status value | Who acts |
|---|---|---|---|
| 1 | Request | `draft` / `matching` | Client |
| 2 | Match | `shortlisted` | Client selects tradie |
| 3 | Assess | `assess` | Both — site consult + shared notes |
| 4 | Quote | `quote` | Tradie submits, client reviews |
| 5 | Confirm | `agreement` | Both sign scope |
| 6 | Build | `delivery` | Tradie works, client approves milestones |
| 7 | Complete | `signoff` | Client signs off, warranty clock starts |
| 8 | Protect | `warranty` | Client logs issues, SLA tracked |

---

## Test accounts

| Role | Email | Password |
|---|---|---|
| Client | test@test.com | Test1234 |
| Tradie | tradietest@steadyhanddigital.com | Test1234 |
| Admin | anthony.coxeter@gmail.com | — |

---

## Key decisions & conventions

- **No `src/` directory** — app lives directly at `~/Downloads/steadyhand-app/app/`
- **Deploy:** `vercel --prod` (not GitHub push)
- **No localhost** — always test against the live Vercel URL
- **Tradie dashboard** is a `'use client'` component (uses `createClient` from supabase/client)
- **Client dashboard** is a server component (uses `createClient` from supabase/server)
- **Milestone payments** release through Stripe Connect
- **Fee structure:** 3% for founding members, 3.5% standard — no subscription, no upfront cost
- **Founding member flag:** `tradie_profiles.founding_member` boolean — set manually by admin
- **Trust Dialogue Score** is passive and automatic — calculated across all 8 stages
- **Contribution/tip** is voluntary, 0% platform fee, Stripe
- **Email sender** switches to `notifications@steadyhanddigital.com` on April 15

---

## What was built (as of April 6 session)

- ✅ Full 8-stage client pipeline (all pages built)
- ✅ Tradie dashboard, job view, profile pages
- ✅ Auth (Supabase email/password), role-based routing
- ✅ AI matching engine (Claude API)
- ✅ Assess stage — shared notes, photo upload, date proposal, acknowledgement
- ✅ Trust Dialogue Score system across all 8 stages
- ✅ Trust score page (`/trust`) with stage breakdown
- ✅ Scope agreement (AI-drafted, both parties sign)
- ✅ Milestone tracker with client approval + Stripe payment release
- ✅ Contribution/tip system (Stripe, 0% fee)
- ✅ Stripe Connect for tradie bank account
- ✅ Warranty issue log with SLA tracking
- ✅ Email notifications (Resend) — assess_ready, contribution_received, assessment_shared
- ✅ NavHeader with avatar dropdown on all stage pages
- ✅ Stage rails — client 8-stage and tradie 6-stage
- ✅ Admin dashboard
- ✅ Tradie dashboard next action prompts (April 6, session 2)

---

## Remaining priorities (before April 15 user testing)

- [ ] Logo upload on tradie profile
- [ ] Tradie subscription self-service page
- [ ] End-to-end test of full 8-stage assess flow with real accounts
- [ ] Embedded Stripe Payment Element
- [ ] Google Places billing + directory tab
- [ ] April 15 — domain transfer, switch email to notifications@steadyhanddigital.com

---

## Known issues to watch

- Tradie stage rail `currentStageN` logic needs real job data to verify
- Contribution prompt requires `tradie_id` to be set on the job
- Quotes page `STAGE_ORDER` was updated to include `assess`

---

## How to deploy

```bash
cd ~/Downloads/steadyhand-app
vercel --prod
```

Vercel auto-deploys in ~30 seconds. Test at https://steadyhandapp.vercel.app.