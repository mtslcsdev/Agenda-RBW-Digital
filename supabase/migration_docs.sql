-- ============================================================
-- MIGRATION: Sistema de Docs e Pastas
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Pastas
CREATE TABLE IF NOT EXISTS folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  client_id  TEXT,
  color      TEXT DEFAULT '#2D6A4F',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Documentos
CREATE TABLE IF NOT EXISTS docs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL DEFAULT 'Sem título',
  content         TEXT DEFAULT '',
  folder_id       UUID REFERENCES folders(id) ON DELETE SET NULL,
  client_id       TEXT,
  linked_task_ids TEXT[] DEFAULT '{}',
  author_id       TEXT,
  author_name     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- RLS: acesso anon
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rbw_anon_folders" ON public.folders;
DROP POLICY IF EXISTS "rbw_anon_docs"    ON public.docs;

CREATE POLICY "rbw_anon_folders" ON public.folders FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "rbw_anon_docs"    ON public.docs    FOR ALL TO anon USING (true) WITH CHECK (true);
