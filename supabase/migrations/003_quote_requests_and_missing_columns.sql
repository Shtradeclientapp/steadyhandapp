-- Migration 003: quote_requests table, RLS, and all missing columns
-- Run in Supabase SQL editor

create table if not exists public.quote_requests (
  id           uuid primary key default uuid_generate_v4(),
  job_id       uuid not null references public.jobs(id) on delete cascade,
  tradie_id    uuid not null references public.tradie_profiles(id),
  status       text default 'requested' check (status in ('requested','viewed','quoted','accepted','declined','expired')),
  requested_at timestamptz default now(),
  viewed_at    timestamptz,
  quoted_at    timestamptz,
  created_at   timestamptz default now(),
  unique(job_id, tradie_id)
);
alter table public.quote_requests enable row level security;
drop policy if exists "qr_client_all" on public.quote_requests;
create policy "qr_client_all" on public.quote_requests for all using (exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid()));
drop policy if exists "qr_tradie_own" on public.quote_requests;
create policy "qr_tradie_own" on public.quote_requests for all using (tradie_id = auth.uid());

alter table public.jobs add column if not exists quote_request_sent_at timestamptz;
alter table public.jobs add column if not exists consult_skipped_by_client boolean default false;
alter table public.jobs add column if not exists agreement_document_name text;
alter table public.jobs add column if not exists agreement_document_url text;

alter table public.tradie_profiles add column if not exists trial_ends_at timestamptz;
alter table public.tradie_profiles add column if not exists suspended_at timestamptz;
alter table public.tradie_profiles add column if not exists suspension_reason text;
alter table public.tradie_profiles add column if not exists admin_notes text;
alter table public.tradie_profiles add column if not exists free_tier_override text;
alter table public.tradie_profiles add column if not exists subscription_tier text;
alter table public.tradie_profiles add column if not exists worker_seats_included int default 0;
alter table public.tradie_profiles add column if not exists onboarding_step text;
alter table public.tradie_profiles add column if not exists availability_message text;
alter table public.tradie_profiles add column if not exists availability_visible boolean default false;

alter table public.profiles add column if not exists is_admin boolean default false;

alter table public.scope_agreements add column if not exists version int default 1;
alter table public.scope_agreements add column if not exists last_edited_at timestamptz;
alter table public.scope_agreements add column if not exists last_edited_by uuid references public.profiles(id);
alter table public.scope_agreements add column if not exists dialogue_score numeric(5,2);

create table if not exists public.quotes (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  tradie_id       uuid not null references public.tradie_profiles(id),
  total_price     numeric(10,2) not null,
  breakdown       jsonb,
  conditions      text,
  estimated_start date,
  estimated_days  int,
  version         int default 1,
  status          text default 'pending' check (status in ('pending','accepted','declined','superseded')),
  created_at      timestamptz default now()
);
alter table public.quotes enable row level security;
drop policy if exists "quotes_client_read" on public.quotes;
create policy "quotes_client_read" on public.quotes for select using (exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid()));
drop policy if exists "quotes_tradie_all" on public.quotes;
create policy "quotes_tradie_all" on public.quotes for all using (tradie_id = auth.uid());
