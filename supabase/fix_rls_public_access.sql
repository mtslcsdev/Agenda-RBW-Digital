-- ============================================================
-- FIX: Habilitar acesso público às tabelas (sem Supabase Auth)
-- Execute no Supabase SQL Editor → New Query → Run
-- ============================================================
-- O sistema agora usa autenticação local (localStorage).
-- Sem supabase.auth, auth.uid() retorna NULL e as políticas
-- bloqueiam todo acesso. Este script remove esse bloqueio.
-- ============================================================

-- Função auxiliar: recria política "allow_all" em cada tabela
DO $$
DECLARE
  tbl  text;
  pol  record;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY['tasks','clients','notes','comments',
                        'activity_log','time_entries','docs',
                        'folders','profiles'])
  LOOP
    -- Remove todas as políticas existentes da tabela
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, tbl);
    END LOOP;

    -- Cria política única: acesso total para anon e authenticated
    EXECUTE format(
      'CREATE POLICY "rbw_public_access" ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl
    );
  END LOOP;
END $$;

-- Garante que RLS está habilitado (políticas só funcionam com RLS ativo)
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
