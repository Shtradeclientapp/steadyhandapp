-- ============================================================
--  Steadyhand — full schema migration
--  Run via: supabase db push
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
-- Extends auth.users. role = 'client' | 'tradie'
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('client','tradie')),
  full_name     text not null,
  email         text not null,
  phone         text,
  suburb        text,
  state         text default 'WA',
  avatar_url    text,
  created_at    timestamptz default now()
);

-- ── TRADIE PROFILES ─────────────────────────────────────────
create table public.tradie_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  business_name       text not null,
  trade_categories    text[] not null,
  service_areas       text[] not null,  -- suburbs / regions
  licence_number      text,
  licence_verified    boolean default false,
  insurance_verified  boolean default false,
  insurance_expiry    date,
  abn                 text,
  bio                 text,
  years_experience    int,
  subscription_plan   text default 'starter' check (subscription_plan in ('starter','professional','business')),
  subscription_active boolean default false,
  rating_avg          numeric(3,2) default 0,
  jobs_completed      int default 0,
  response_time_hrs   numeric(4,1),
  created_at          timestamptz default now()
);

-- ── JOBS ────────────────────────────────────────────────────
create table public.jobs (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references public.profiles(id),
  tradie_id       uuid references public.tradie_profiles(id),
  title           text not null,
  description     text not null,
  trade_category  text not null,
  suburb          text not null,
  state           text default 'WA',
  property_type   text,
  urgency         text,
  budget_range    text,
  warranty_period int default 90,  -- days
  preferred_start text,
  status          text not null default 'draft'
    check (status in ('draft','matching','shortlisted','agreement','delivery','signoff','warranty','complete','cancelled')),
  scope_agreed_at timestamptz,
  signoff_at      timestamptz,
  warranty_ends_at timestamptz,
  agreed_price    numeric(10,2),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── JOB PHOTOS ──────────────────────────────────────────────
create table public.job_photos (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  storage_path text not null,   -- path in Supabase Storage bucket
  caption     text,
  stage       text,             -- 'request' | 'milestone_1' | 'signoff' etc.
  created_at  timestamptz default now()
);

-- ── SHORTLIST ───────────────────────────────────────────────
create table public.shortlist (
  id            uuid primary key default uuid_generate_v4(),
  job_id        uuid not null references public.jobs(id) on delete cascade,
  tradie_id     uuid not null references public.tradie_profiles(id),
  ai_score      numeric(5,2),   -- 0-100 match score from Claude
  ai_reasoning  text,
  rank          int,
  status        text default 'pending' check (status in ('pending','viewed','selected','declined')),
  created_at    timestamptz default now(),
  unique(job_id, tradie_id)
);

-- ── SCOPE AGREEMENT ─────────────────────────────────────────
create table public.scope_agreements (
  id                  uuid primary key default uuid_generate_v4(),
  job_id              uuid not null unique references public.jobs(id) on delete cascade,
  drafted_by_ai       boolean default true,
  inclusions          text[],
  exclusions          text[],
  milestones          jsonb,     -- [{label, percent, amount, description}]
  warranty_days       int default 90,
  response_sla_days   int default 5,
  remediation_days    int default 14,
  total_price         numeric(10,2),
  client_signed_at    timestamptz,
  tradie_signed_at    timestamptz,
  created_at          timestamptz default now()
);

-- ── MILESTONES ──────────────────────────────────────────────
create table public.milestones (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  label           text not null,
  description     text,
  order_index     int not null,
  percent         int not null,
  amount          numeric(10,2),
  status          text default 'pending'
    check (status in ('pending','submitted','approved','disputed')),
  submitted_at    timestamptz,
  approved_at     timestamptz,
  created_at      timestamptz default now()
);

-- ── MESSAGES ────────────────────────────────────────────────
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id),
  body        text not null,
  ai_suggested boolean default false,
  created_at  timestamptz default now()
);

-- ── WARRANTY ISSUES ─────────────────────────────────────────
create table public.warranty_issues (
  id              uuid primary key default uuid_generate_v4(),
  job_id          uuid not null references public.jobs(id) on delete cascade,
  raised_by       uuid not null references public.profiles(id),
  title           text not null,
  description     text not null,
  severity        text check (severity in ('minor','moderate','serious','critical')),
  status          text default 'open' check (status in ('open','pending','resolved','escalated')),
  response_due_at timestamptz,
  resolved_at     timestamptz,
  created_at      timestamptz default now()
);

-- ── REVIEWS ─────────────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references public.jobs(id),
  reviewer_id uuid not null references public.profiles(id),
  reviewee_id uuid not null references public.profiles(id),
  rating      int not null check (rating between 1 and 5),
  body        text,
  is_public   boolean default true,
  created_at  timestamptz default now(),
  unique(job_id, reviewer_id)
);

-- ── DOCUMENTS ───────────────────────────────────────────────
create table public.documents (
  id           uuid primary key default uuid_generate_v4(),
  job_id       uuid references public.jobs(id) on delete cascade,
  tradie_id    uuid references public.tradie_profiles(id),
  type         text not null,  -- 'licence' | 'insurance' | 'scope' | 'completion_cert'
  storage_path text not null,
  verified     boolean default false,
  expires_at   date,
  created_at   timestamptz default now()
);

-- ── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger jobs_updated_at
  before update on public.jobs
  for each row execute function update_updated_at();

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.tradie_profiles     enable row level security;
alter table public.jobs                enable row level security;
alter table public.job_photos          enable row level security;
alter table public.shortlist           enable row level security;
alter table public.scope_agreements    enable row level security;
alter table public.milestones          enable row level security;
alter table public.messages            enable row level security;
alter table public.warranty_issues     enable row level security;
alter table public.reviews             enable row level security;
alter table public.documents           enable row level security;

-- profiles: users can read all, only update their own
create policy "profiles_read_all"   on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- tradie_profiles: same
create policy "tradie_profiles_read_all"   on public.tradie_profiles for select using (true);
create policy "tradie_profiles_update_own" on public.tradie_profiles for update using (auth.uid() = id);
create policy "tradie_profiles_insert_own" on public.tradie_profiles for insert with check (auth.uid() = id);

-- jobs: clients own their jobs; tradies can see jobs shortlisted to them
create policy "jobs_client_all"    on public.jobs for all    using (auth.uid() = client_id);
create policy "jobs_tradie_select" on public.jobs for select using (
  auth.uid() = tradie_id or
  exists (select 1 from public.shortlist s where s.job_id = id and s.tradie_id = auth.uid())
);

-- messages: parties on the job can read/write
create policy "messages_job_parties" on public.messages for all using (
  exists (
    select 1 from public.jobs j
    where j.id = job_id
    and (j.client_id = auth.uid() or j.tradie_id = auth.uid())
  )
);

-- shortlist: client can read their job's shortlist; tradie can see their own entries
create policy "shortlist_client"  on public.shortlist for select using (
  exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid())
);
create policy "shortlist_tradie"  on public.shortlist for select using (tradie_id = auth.uid());

-- scope agreements, milestones, warranty issues, reviews: job parties
create policy "scope_job_parties" on public.scope_agreements for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid()))
);
create policy "milestones_job_parties" on public.milestones for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid()))
);
create policy "warranty_job_parties" on public.warranty_issues for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid()))
);
create policy "reviews_public_read" on public.reviews for select using (is_public = true);
create policy "reviews_own_write"   on public.reviews for insert with check (auth.uid() = reviewer_id);

-- documents: tradie owns their docs; job parties can see job docs
create policy "docs_tradie_own"     on public.documents for all    using (tradie_id = auth.uid());
create policy "docs_job_parties"    on public.documents for select using (
  job_id is not null and
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid()))
);

-- job_photos: job parties
create policy "photos_job_parties" on public.job_photos for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid()))
);

-- ── STORAGE BUCKETS ─────────────────────────────────────────
-- Run these in Supabase dashboard → Storage, or via CLI:
-- supabase storage create-bucket job-photos --public
-- supabase storage create-bucket documents --public false
