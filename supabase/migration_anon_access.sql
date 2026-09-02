-- ============================================================
-- EXECUTAR NO SUPABASE SQL EDITOR
-- Libera acesso anônimo às tabelas do app
-- (necessário pois removemos o Supabase Auth)
-- ============================================================

DROP POLICY IF EXISTS "rbw_anon_tasks"    ON public.tasks;
DROP POLICY IF EXISTS "rbw_anon_clients"  ON public.clients;
DROP POLICY IF EXISTS "rbw_anon_notes"    ON public.notes;

CREATE POLICY "rbw_anon_tasks"   ON public.tasks   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "rbw_anon_clients" ON public.clients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "rbw_anon_notes"   ON public.notes   FOR ALL TO anon USING (true) WITH CHECK (true);

-- Tabelas secundárias (se existirem)
DO $$ BEGIN
  DROP POLICY IF EXISTS "rbw_anon_comments" ON public.comments;
  CREATE POLICY "rbw_anon_comments" ON public.comments FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "rbw_anon_activity" ON public.activity_log;
  CREATE POLICY "rbw_anon_activity" ON public.activity_log FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "rbw_anon_time" ON public.time_entries;
  CREATE POLICY "rbw_anon_time" ON public.time_entries FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "rbw_anon_notif" ON public.notifications;
  CREATE POLICY "rbw_anon_notif" ON public.notifications FOR ALL TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL; END $$;
