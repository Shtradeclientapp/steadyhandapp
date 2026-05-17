-- Migration 004: org_id / property_id on jobs, is_demo on tradie_profiles

-- Allow jobs to be linked to an organisation and a specific property
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organisations(id);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id);

-- Mirror the is_demo flag onto tradie_profiles so it can be filtered directly
-- (profiles.is_demo already exists; this column lets match queries avoid a join condition)
ALTER TABLE public.tradie_profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Sync existing demo tradies from their profile row
UPDATE public.tradie_profiles tp
SET is_demo = true
FROM public.profiles p
WHERE tp.id = p.id AND p.is_demo = true;
