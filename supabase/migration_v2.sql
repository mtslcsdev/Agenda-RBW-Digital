-- ============================================================
-- RBW Digital — Migration v2: Archive + Hidden
-- Run in: Supabase Dashboard → SQL Editor → New Query → RUN
-- ============================================================

ALTER TABLE public.tasks   ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE public.notes   ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS hidden   boolean DEFAULT false;
