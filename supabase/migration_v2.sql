-- ============================================================
-- RBW Digital — Migration v2: Profiles, RLS & Policies
-- Run in: Supabase Dashboard → SQL Editor → New Query → RUN
-- ============================================================


-- ============================================================
-- 1. TABELA profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  role       text        NOT NULL DEFAULT 'viewer',
  initials   text,
  color      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Garante que a constraint inclui super_admin (idempotente)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer'));


-- ============================================================
-- 2. TRIGGER handle_new_user
--    Auto-cria profile quando um usuário é criado no Auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, initials, color, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',       NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'initials',   upper(left(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))),
    COALESCE(NEW.raw_user_meta_data->>'color',      '#6366F1'),
    COALESCE(NEW.raw_user_meta_data->>'role',       'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 3. COLUNAS client_id e assignee_id na tabela tasks
-- ============================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS client_id   uuid REFERENCES public.clients(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;


-- ============================================================
-- 4. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. POLICIES
-- ============================================================

-- Helper inline: verifica se o usuário autenticado possui um dos roles
-- Usado como: exists (select 1 from profiles where id = auth.uid() and role in (...))


-- ------------------------------------------------------------
-- 5.1 profiles
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_authenticated"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"              ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin"            ON public.profiles;

-- Qualquer usuário autenticado pode ver todos os profiles
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Usuário pode atualizar o próprio profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin e super_admin podem atualizar qualquer profile
CREATE POLICY "profiles_update_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- Admin e super_admin podem inserir profiles manualmente
CREATE POLICY "profiles_insert_admin"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- Admin e super_admin podem deletar profiles, mas não podem deletar super_admin
CREATE POLICY "profiles_delete_admin"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
    AND (
      select role from public.profiles where id = public.profiles.id
    ) <> 'super_admin'
  );


-- ------------------------------------------------------------
-- 5.2 tasks
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "tasks_select_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_editor"        ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_editor"        ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_editor"        ON public.tasks;

CREATE POLICY "tasks_select_authenticated"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_editor"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "tasks_update_editor"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "tasks_delete_editor"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'editor')
    )
  );


-- ------------------------------------------------------------
-- 5.3 clients
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "clients_select_authenticated" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_editor"        ON public.clients;
DROP POLICY IF EXISTS "clients_update_editor"        ON public.clients;
DROP POLICY IF EXISTS "clients_delete_editor"        ON public.clients;

CREATE POLICY "clients_select_authenticated"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clients_insert_editor"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "clients_update_editor"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "clients_delete_editor"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'editor')
    )
  );


-- ------------------------------------------------------------
-- 5.4 notes
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "notes_select_authenticated" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_editor"        ON public.notes;
DROP POLICY IF EXISTS "notes_update_editor"        ON public.notes;
DROP POLICY IF EXISTS "notes_delete_editor"        ON public.notes;

CREATE POLICY "notes_select_authenticated"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "notes_insert_editor"
  ON public.notes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "notes_update_editor"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "notes_delete_editor"
  ON public.notes
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'editor')
    )
  );


-- ------------------------------------------------------------
-- 5.5 docs
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "docs_select_authenticated" ON public.docs;
DROP POLICY IF EXISTS "docs_insert_editor"        ON public.docs;
DROP POLICY IF EXISTS "docs_update_editor"        ON public.docs;
DROP POLICY IF EXISTS "docs_delete_editor"        ON public.docs;

CREATE POLICY "docs_select_authenticated"
  ON public.docs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "docs_insert_editor"
  ON public.docs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "docs_update_editor"
  ON public.docs
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "docs_delete_editor"
  ON public.docs
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'editor')
    )
  );


-- ------------------------------------------------------------
-- 5.6 folders
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "folders_select_authenticated" ON public.folders;
DROP POLICY IF EXISTS "folders_insert_editor"        ON public.folders;
DROP POLICY IF EXISTS "folders_update_editor"        ON public.folders;
DROP POLICY IF EXISTS "folders_delete_editor"        ON public.folders;

CREATE POLICY "folders_select_authenticated"
  ON public.folders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "folders_insert_editor"
  ON public.folders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "folders_update_editor"
  ON public.folders
  FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'editor', 'super_admin')
    )
  );

CREATE POLICY "folders_delete_editor"
  ON public.folders
  FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin', 'editor')
    )
  );


-- ------------------------------------------------------------
-- 5.7 comments
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "comments_select_authenticated" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_editor"        ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own_or_admin"  ON public.comments;

CREATE POLICY "comments_select_authenticated"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Editor, admin e super_admin podem inserir comentários
CREATE POLICY "comments_insert_editor"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('editor', 'admin', 'super_admin')
    )
  );

-- Autor pode deletar o próprio comentário; admin/super_admin podem deletar qualquer um
-- Assume que a tabela comments possui coluna author_id uuid referenciando auth.users
CREATE POLICY "comments_delete_own_or_admin"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );


-- ------------------------------------------------------------
-- 5.8 time_entries
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "time_entries_select_authenticated" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_insert_authenticated" ON public.time_entries;
DROP POLICY IF EXISTS "time_entries_delete_own_or_admin"  ON public.time_entries;

CREATE POLICY "time_entries_select_authenticated"
  ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- Qualquer usuário autenticado pode registrar horas
CREATE POLICY "time_entries_insert_authenticated"
  ON public.time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Autor pode deletar o próprio registro; admin pode deletar qualquer um
-- Assume que a tabela time_entries possui coluna user_id uuid referenciando auth.users
CREATE POLICY "time_entries_delete_own_or_admin"
  ON public.time_entries
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );


-- ============================================================
-- 6. CRIAÇÃO DO SUPER_ADMIN (executar APÓS criar o usuário)
--
-- Passo 1 — Criar o usuário no Supabase Auth Dashboard:
--   Email  : mateus@rbw.com
--   Senha  : Ml301298/*
--
-- Passo 2 — Após a criação do usuário, rodar o comando abaixo
--           no SQL Editor para promovê-lo a super_admin:
--
-- UPDATE public.profiles
-- SET
--   role     = 'super_admin',
--   name     = 'Mateus Lucas',
--   initials = 'ML',
--   color    = '#2D6A4F'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'mateus@rbw.com'
-- );
-- ============================================================
