-- ============================================================
-- RBW Digital — RLS por sessão + colunas do quadro
-- Rode DEPOIS de schema_v3_full.sql e auth_secure.sql
-- ============================================================
-- Substitui as policies "rbw_public_access" do schema_v3_full.sql, que
-- liberavam as tabelas de dados para qualquer um com a chave publishable.
--
-- Como funciona: o app manda o token da sessão no header x-rbw-token
-- (ver src/lib/supabase.js). O PostgREST expõe os headers da requisição em
-- request.headers, então as policies conseguem descobrir quem está chamando
-- e qual o papel — sem precisar do Supabase Auth.
--
-- Cuidado: o Realtime abre um socket próprio e NÃO envia esse header, então
-- ele não recebe eventos destas tabelas. O app compensa recarregando quando a
-- aba volta ao foco e periodicamente (ver AppContext.jsx).
-- ============================================================

CREATE OR REPLACE FUNCTION public.rbw_request_token()
RETURNS text
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT nullif(
    coalesce(current_setting('request.headers', true), '{}')::json ->> 'x-rbw-token',
    '');
$$;

-- SECURITY DEFINER porque anon não pode ler users nem user_sessions
CREATE OR REPLACE FUNCTION public.rbw_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.role
  FROM public.users u
  JOIN public.user_sessions s ON s.user_id = u.id
  WHERE s.token = public.rbw_request_token()
    AND s.expires_at > now();
$$;

GRANT EXECUTE ON FUNCTION public.rbw_request_token() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_role()          TO anon, authenticated;

-- ── Colunas do quadro (antes eram fixas no código) ────────────
CREATE TABLE IF NOT EXISTS public.board_columns (
  id         bigserial PRIMARY KEY,
  label      text    NOT NULL,
  color      text    NOT NULL DEFAULT '#6B6960',
  position   numeric NOT NULL,
  is_done    boolean NOT NULL DEFAULT false,  -- qual coluna significa "concluído"
  archived   boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ligação por chave real + ordem dentro da coluna.
-- `position` é numeric porque as inserções usam a média entre os vizinhos:
-- mover um card grava uma linha só, em vez de renumerar a coluna inteira.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS column_id bigint REFERENCES public.board_columns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position  numeric;

INSERT INTO public.board_columns (label, color, position, is_done)
SELECT * FROM (VALUES
  ('Pendente',     '#6B6960', 1000, false),
  ('Em Progresso', '#E07A3A', 2000, false),
  ('Concluído',    '#2D6A4F', 3000, true )
) AS v(label, color, position, is_done)
WHERE NOT EXISTS (SELECT 1 FROM public.board_columns);

-- ── Policies ──────────────────────────────────────────────────
-- Grupo A: sessão válida lê; só editor/admin escreve.
-- Grupo B (tempo e histórico): qualquer sessão grava, só admin altera/apaga.
DO $$
DECLARE t text; pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['tasks','clients','notes','comments','docs','folders','board_columns'] LOOP
    IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format($f$CREATE POLICY "rbw_read" ON public.%I FOR SELECT TO anon, authenticated
      USING (public.rbw_role() IS NOT NULL)$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_insert" ON public.%I FOR INSERT TO anon, authenticated
      WITH CHECK (public.rbw_role() IN ('editor','admin','super_admin'))$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_update" ON public.%I FOR UPDATE TO anon, authenticated
      USING (public.rbw_role() IN ('editor','admin','super_admin'))
      WITH CHECK (public.rbw_role() IN ('editor','admin','super_admin'))$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_delete" ON public.%I FOR DELETE TO anon, authenticated
      USING (public.rbw_role() IN ('editor','admin','super_admin'))$f$, t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['time_entries','activity_log'] LOOP
    IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format($f$CREATE POLICY "rbw_read" ON public.%I FOR SELECT TO anon, authenticated
      USING (public.rbw_role() IS NOT NULL)$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_insert" ON public.%I FOR INSERT TO anon, authenticated
      WITH CHECK (public.rbw_role() IS NOT NULL)$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_update" ON public.%I FOR UPDATE TO anon, authenticated
      USING (public.rbw_role() IN ('admin','super_admin'))
      WITH CHECK (public.rbw_role() IN ('admin','super_admin'))$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_delete" ON public.%I FOR DELETE TO anon, authenticated
      USING (public.rbw_role() IN ('admin','super_admin'))$f$, t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_columns TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.board_columns_id_seq TO anon, authenticated;

-- ── Quadros (um interno da equipe + um por cliente) ───────────
CREATE TABLE IF NOT EXISTS public.boards (
  id         bigserial PRIMARY KEY,
  name       text    NOT NULL,
  client_id  bigint  REFERENCES public.clients(id) ON DELETE CASCADE,
  position   numeric NOT NULL DEFAULT 1000,
  archived   boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Colunas pertencem a um quadro; apagar o quadro leva as colunas junto.
-- As tarefas ficam com board_id nulo em vez de sumirem.
ALTER TABLE public.board_columns
  ADD COLUMN IF NOT EXISTS board_id bigint REFERENCES public.boards(id) ON DELETE CASCADE;
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS board_id bigint REFERENCES public.boards(id) ON DELETE SET NULL;

INSERT INTO public.boards (name, client_id, position)
SELECT 'Equipe RBW', NULL, 1000
WHERE NOT EXISTS (SELECT 1 FROM public.boards);

UPDATE public.board_columns SET board_id = (SELECT id FROM public.boards ORDER BY id LIMIT 1)
WHERE board_id IS NULL;
UPDATE public.tasks SET board_id = (SELECT id FROM public.boards ORDER BY id LIMIT 1)
WHERE board_id IS NULL;

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rbw_read"   ON public.boards;
DROP POLICY IF EXISTS "rbw_insert" ON public.boards;
DROP POLICY IF EXISTS "rbw_update" ON public.boards;
DROP POLICY IF EXISTS "rbw_delete" ON public.boards;
CREATE POLICY "rbw_read" ON public.boards FOR SELECT TO anon, authenticated
  USING (public.rbw_role() IS NOT NULL);
CREATE POLICY "rbw_insert" ON public.boards FOR INSERT TO anon, authenticated
  WITH CHECK (public.rbw_role() IN ('editor','admin','super_admin'));
CREATE POLICY "rbw_update" ON public.boards FOR UPDATE TO anon, authenticated
  USING (public.rbw_role() IN ('editor','admin','super_admin'))
  WITH CHECK (public.rbw_role() IN ('editor','admin','super_admin'));
CREATE POLICY "rbw_delete" ON public.boards FOR DELETE TO anon, authenticated
  USING (public.rbw_role() IN ('admin','super_admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.boards_id_seq TO anon, authenticated;

-- ── Conteúdo do card: subtarefas e etiquetas ──────────────────
CREATE TABLE IF NOT EXISTS public.task_checklist (
  id         bigserial PRIMARY KEY,
  task_id    bigint  NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text       text    NOT NULL,
  done       boolean NOT NULL DEFAULT false,
  position   numeric NOT NULL DEFAULT 1000,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS task_checklist_task_idx ON public.task_checklist(task_id);

-- Etiquetas reutilizáveis, no lugar da tag única por card
CREATE TABLE IF NOT EXISTS public.labels (
  id         bigserial PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  color      text NOT NULL DEFAULT '#2D6A4F',
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.task_labels (
  task_id  bigint NOT NULL REFERENCES public.tasks(id)  ON DELETE CASCADE,
  label_id bigint NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);
CREATE INDEX IF NOT EXISTS task_labels_task_idx ON public.task_labels(task_id);

DO $$
DECLARE t text; pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['task_checklist','labels','task_labels'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format($f$CREATE POLICY "rbw_read" ON public.%I FOR SELECT TO anon, authenticated
      USING (public.rbw_role() IS NOT NULL)$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_insert" ON public.%I FOR INSERT TO anon, authenticated
      WITH CHECK (public.rbw_role() IN ('editor','admin','super_admin'))$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_update" ON public.%I FOR UPDATE TO anon, authenticated
      USING (public.rbw_role() IN ('editor','admin','super_admin'))
      WITH CHECK (public.rbw_role() IN ('editor','admin','super_admin'))$f$, t);
    EXECUTE format($f$CREATE POLICY "rbw_delete" ON public.%I FOR DELETE TO anon, authenticated
      USING (public.rbw_role() IN ('editor','admin','super_admin'))$f$, t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_checklist, public.labels, public.task_labels TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.task_checklist_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.labels_id_seq         TO anon, authenticated;
