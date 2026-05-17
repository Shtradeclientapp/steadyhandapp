-- Migration 006: Snapshot columns on scope_agreements
-- These were added directly to production; this migration formalises them.
ALTER TABLE public.scope_agreements
  ADD COLUMN IF NOT EXISTS tradie_business_name_snapshot text,
  ADD COLUMN IF NOT EXISTS client_full_name_snapshot text,
  ADD COLUMN IF NOT EXISTS tradie_licence_number_snapshot text,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quote_total numeric(10,2);
