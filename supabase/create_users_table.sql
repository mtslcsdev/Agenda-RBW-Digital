-- ============================================================
-- Tabela de usuários do sistema RBW Digital
-- Execute no Supabase SQL Editor → New Query → Run
-- ============================================================
-- Cria uma tabela própria de usuários (independente do Supabase Auth)
-- Isso permite login de qualquer dispositivo sem depender do
-- supabase.auth.getSession() que travava o sistema.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id      text PRIMARY KEY,
  name    text NOT NULL,
  email   text UNIQUE NOT NULL,
  password text NOT NULL,
  role    text NOT NULL DEFAULT 'editor'
            CHECK (role IN ('super_admin','admin','editor','viewer')),
  initials text,
  color   text DEFAULT '#2D6A4F',
  created_at timestamptz DEFAULT now()
);

-- Acesso público (autenticação feita pela app, não pelo Supabase Auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rbw_public_access" ON users;
CREATE POLICY "rbw_public_access" ON users FOR ALL USING (true) WITH CHECK (true);

-- Usuário admin inicial
INSERT INTO users (id, name, email, password, role, initials, color)
VALUES ('u-rbw-admin', 'Mateus', 'mateus@rbw.com', 'rbw2024', 'super_admin', 'MA', '#2D6A4F')
ON CONFLICT (id) DO NOTHING;
