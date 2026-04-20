-- Fix: tradie RLS access via quote_requests pre-acceptance
-- All job-related tables now allow access if tradie has a quote_request on the job
-- Also fixes jobs status enum to include all interim statuses

alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in (
    'draft','matching','shortlisted','assess','consult',
    'compare','quote','agreement','delivery','signoff',
    'warranty','complete','cancelled'
  ));

drop policy if exists "jobs_tradie_select" on public.jobs;
create policy "jobs_tradie_select" on public.jobs for select using (
  auth.uid() = tradie_id
  or exists (select 1 from public.shortlist s where s.job_id = id and s.tradie_id = auth.uid())
  or exists (select 1 from public.quote_requests qr where qr.job_id = id and qr.tradie_id = auth.uid())
);

drop policy if exists "messages_job_parties" on public.messages;
create policy "messages_job_parties" on public.messages for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid() or exists (select 1 from public.quote_requests qr where qr.job_id = j.id and qr.tradie_id = auth.uid())))
);

drop policy if exists "scope_job_parties" on public.scope_agreements;
create policy "scope_job_parties" on public.scope_agreements for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid() or exists (select 1 from public.quote_requests qr where qr.job_id = j.id and qr.tradie_id = auth.uid())))
);

drop policy if exists "milestones_job_parties" on public.milestones;
create policy "milestones_job_parties" on public.milestones for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid() or exists (select 1 from public.quote_requests qr where qr.job_id = j.id and qr.tradie_id = auth.uid())))
);

drop policy if exists "warranty_job_parties" on public.warranty_issues;
create policy "warranty_job_parties" on public.warranty_issues for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid() or exists (select 1 from public.quote_requests qr where qr.job_id = j.id and qr.tradie_id = auth.uid())))
);

drop policy if exists "photos_job_parties" on public.job_photos;
create policy "photos_job_parties" on public.job_photos for all using (
  exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid() or exists (select 1 from public.quote_requests qr where qr.job_id = j.id and qr.tradie_id = auth.uid())))
);

drop policy if exists "docs_job_parties" on public.documents;
create policy "docs_job_parties" on public.documents for select using (
  job_id is not null and exists (select 1 from public.jobs j where j.id = job_id and (j.client_id = auth.uid() or j.tradie_id = auth.uid() or exists (select 1 from public.quote_requests qr where qr.job_id = j.id and qr.tradie_id = auth.uid())))
);
