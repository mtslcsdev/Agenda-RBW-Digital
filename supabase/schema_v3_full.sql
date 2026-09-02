-- ============================================================
-- RBW Digital — Schema v3 (completo)
-- Substitui os migrations antigos que dependiam do Supabase Auth.
-- A autenticação é feita pela tabela `users` (login próprio da app),
-- por isso os IDs de usuário são `text` e as policies liberam `anon`.
-- ============================================================

-- 1. users (login da aplicação)
-- ATENÇÃO: a senha nunca é gravada em texto puro — só o hash bcrypt.
-- As tabelas `users` e `user_sessions` NÃO são acessíveis pela chave pública;
-- todo o login e a gestão de usuários passam pelas funções em auth_secure.sql.
CREATE TABLE IF NOT EXISTS public.users (
  id            text PRIMARY KEY,
  name          text NOT NULL,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'editor'
                  CHECK (role IN ('super_admin','admin','editor','viewer')),
  initials      text,
  color         text DEFAULT '#2D6A4F',
  created_at    timestamptz DEFAULT now()
);

-- 2. clients
CREATE TABLE IF NOT EXISTS public.clients (
  id            bigserial PRIMARY KEY,
  initials      text    DEFAULT '',
  name          text    NOT NULL,
  segment       text    DEFAULT '',
  email         text    DEFAULT '',
  status        text    DEFAULT 'Ativo',
  status_color  text    DEFAULT 'green',
  tags          text[]  DEFAULT '{}',
  color         text    DEFAULT '#2D6A4F',
  archived      boolean DEFAULT false,
  hidden        boolean DEFAULT false,
  responsible   text    DEFAULT '',
  contract      text    DEFAULT '',
  monthly_value text    DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

-- 3. tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id            bigserial PRIMARY KEY,
  title         text NOT NULL,
  client        text    DEFAULT '',
  client_id     bigint  REFERENCES public.clients(id) ON DELETE SET NULL,
  tag           text    DEFAULT '',
  tag_color     text    DEFAULT 'green',
  priority      text    DEFAULT 'Normal',
  date          text    DEFAULT '',
  notes         text    DEFAULT '',
  done          boolean DEFAULT false,
  task_status   text    DEFAULT 'pendente',
  archived      boolean DEFAULT false,
  assignee_name text    DEFAULT '',
  assignee_id   text,
  created_by    text,
  created_at    timestamptz DEFAULT now()
);

-- 4. notes
CREATE TABLE IF NOT EXISTS public.notes (
  id         bigserial PRIMARY KEY,
  title      text NOT NULL,
  content    text    DEFAULT '',
  project    text    DEFAULT '',
  color      text    DEFAULT 'yellow',
  date       text    DEFAULT '',
  type       text    DEFAULT 'text',
  items      jsonb   DEFAULT '[]',
  pinned     boolean DEFAULT false,
  archived   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. comments
CREATE TABLE IF NOT EXISTS public.comments (
  id            bigserial PRIMARY KEY,
  task_id       bigint REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id       text,
  user_name     text DEFAULT '',
  user_color    text DEFAULT '#6B6960',
  user_initials text DEFAULT '',
  text          text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

-- 6. time_entries
CREATE TABLE IF NOT EXISTS public.time_entries (
  id         bigserial PRIMARY KEY,
  task_id    bigint REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_title text DEFAULT '',
  user_id    text,
  start_time bigint,
  end_time   bigint,
  duration   bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. activity_log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id           bigserial PRIMARY KEY,
  user_id      text,
  user_name    text DEFAULT '',
  user_color   text DEFAULT '#6B6960',
  action       text NOT NULL,
  entity_type  text DEFAULT '',
  entity_title text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

-- 8. folders
CREATE TABLE IF NOT EXISTS public.folders (
  id         bigserial PRIMARY KEY,
  name       text NOT NULL,
  client_id  bigint REFERENCES public.clients(id) ON DELETE SET NULL,
  color      text DEFAULT '#2D6A4F',
  created_at timestamptz DEFAULT now()
);

-- 9. docs
CREATE TABLE IF NOT EXISTS public.docs (
  id              bigserial PRIMARY KEY,
  title           text  DEFAULT 'Sem título',
  content         text  DEFAULT '',
  folder_id       bigint REFERENCES public.folders(id) ON DELETE SET NULL,
  client_id       bigint REFERENCES public.clients(id) ON DELETE SET NULL,
  linked_task_ids jsonb DEFAULT '[]',
  author_id       text  DEFAULT '',
  author_name     text  DEFAULT '',
  author_color    text  DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- RLS — tabelas de dados acessíveis via chave publishable (anon).
-- `users` e `user_sessions` ficam de fora de propósito: são trancadas
-- em auth_secure.sql e só podem ser tocadas pelas funções de login.
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','tasks','notes','comments',
    'time_entries','activity_log','folders','docs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "rbw_public_access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "rbw_public_access" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Admin inicial (senha gravada como hash bcrypt, nunca em texto puro).
-- Troque a senha no primeiro acesso pelo menu do usuário.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

INSERT INTO public.users (id, name, email, password_hash, role, initials, color)
VALUES ('u-rbw-admin', 'Mateus', 'mateus@rbw.com',
        extensions.crypt('rbw2024', extensions.gen_salt('bf', 10)),
        'super_admin', 'MA', '#2D6A4F')
ON CONFLICT (id) DO NOTHING;

-- Em seguida rode auth_secure.sql para criar as funções de login e
-- trancar as tabelas de usuários.
