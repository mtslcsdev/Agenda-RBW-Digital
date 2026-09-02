-- ============================================================
-- RBW Digital — Camada de autenticação segura
-- Rode DEPOIS de schema_v3_full.sql
-- ============================================================
-- Por que este arquivo existe:
-- O site é estático e usa a chave "publishable" do Supabase, que é
-- pública por natureza (qualquer pessoa lê no JS da página). Portanto a
-- tabela de usuários NÃO pode ficar acessível por essa chave.
--
-- O desenho aqui é:
--   * senha guardada só como hash bcrypt (pgcrypto)
--   * `users` e `user_sessions` sem nenhum acesso para anon/authenticated
--   * login e gestão de usuários via funções SECURITY DEFINER
--   * cada função confere o papel de quem chamou, a partir de um token
--     de sessão gerado no servidor (não dá para forjar no navegador)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── Sessões ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  token      text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days'
);
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);

-- ── Tranca as tabelas sensíveis ──────────────────────────────
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rbw_public_access" ON public.users;
DROP POLICY IF EXISTS "rbw_public_access" ON public.user_sessions;
REVOKE ALL ON public.users         FROM anon, authenticated;
REVOKE ALL ON public.user_sessions FROM anon, authenticated;

-- ── Helpers (privados: anon não pode chamar) ─────────────────
CREATE OR REPLACE FUNCTION public.rbw_actor(p_token text)
RETURNS public.users
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
  SELECT u.* FROM public.users u
  JOIN public.user_sessions s ON s.user_id = u.id
  WHERE s.token = p_token AND s.expires_at > now();
$$;

CREATE OR REPLACE FUNCTION public.rbw_profile(u public.users)
RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', u.id, 'name', u.name, 'email', u.email,
    'role', u.role, 'initials', u.initials, 'color', u.color);
$$;

-- ── Login / sessão ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rbw_login(p_email text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE u public.users; t text;
BEGIN
  SELECT * INTO u FROM public.users
  WHERE email = lower(trim(p_email))
    AND password_hash = extensions.crypt(p_password, password_hash);

  IF u.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'E-mail ou senha incorretos.');
  END IF;

  t := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.user_sessions (token, user_id) VALUES (t, u.id);
  DELETE FROM public.user_sessions WHERE expires_at < now();

  RETURN jsonb_build_object('ok', true, 'token', t, 'user', public.rbw_profile(u));
END $$;

CREATE OR REPLACE FUNCTION public.rbw_session(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE u public.users;
BEGIN
  u := public.rbw_actor(p_token);
  IF u.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', true, 'user', public.rbw_profile(u));
END $$;

CREATE OR REPLACE FUNCTION public.rbw_logout(p_token text)
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.user_sessions WHERE token = p_token;
$$;

-- ── Gestão de usuários (o papel é conferido no servidor) ─────
CREATE OR REPLACE FUNCTION public.rbw_list_users(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users;
BEGIN
  me := public.rbw_actor(p_token);
  IF me.id IS NULL OR me.role NOT IN ('admin','super_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  RETURN jsonb_build_object('ok', true, 'users', COALESCE((
    SELECT jsonb_agg(public.rbw_profile(u) ORDER BY u.created_at)
    FROM public.users u), '[]'::jsonb));
END $$;

CREATE OR REPLACE FUNCTION public.rbw_create_user(
  p_token text, p_name text, p_email text, p_password text, p_role text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users; new_id text;
BEGIN
  me := public.rbw_actor(p_token);
  IF me.id IS NULL OR me.role NOT IN ('admin','super_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  IF p_role = 'super_admin' AND me.role <> 'super_admin' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Somente um super admin pode criar outro.');
  END IF;
  IF length(coalesce(p_password,'')) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Senha deve ter no mínimo 4 caracteres.');
  END IF;

  new_id := 'u-' || encode(extensions.gen_random_bytes(8), 'hex');
  BEGIN
    INSERT INTO public.users (id, name, email, password_hash, role, initials, color)
    VALUES (new_id, trim(p_name), lower(trim(p_email)),
            extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
            p_role, upper(left(trim(p_name), 2)), '#2D6A4F');
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'E-mail já cadastrado.');
  END;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.rbw_update_role(p_token text, p_user_id text, p_role text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users; target public.users;
BEGIN
  me := public.rbw_actor(p_token);
  SELECT * INTO target FROM public.users WHERE id = p_user_id;
  IF me.id IS NULL OR me.role NOT IN ('admin','super_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  IF target.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuário não encontrado.');
  END IF;
  IF (target.role = 'super_admin' OR p_role = 'super_admin') AND me.role <> 'super_admin' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Somente um super admin pode alterar isso.');
  END IF;
  UPDATE public.users SET role = p_role WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.rbw_rename_user(p_token text, p_user_id text, p_name text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users; target public.users;
BEGIN
  me := public.rbw_actor(p_token);
  SELECT * INTO target FROM public.users WHERE id = p_user_id;
  IF me.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Sessão inválida.'); END IF;
  IF trim(coalesce(p_name,'')) = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Nome não pode ser vazio.');
  END IF;
  IF me.id <> p_user_id AND me.role NOT IN ('admin','super_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  IF target.role = 'super_admin' AND me.id <> target.id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  UPDATE public.users
  SET name = trim(p_name), initials = upper(left(trim(p_name), 2))
  WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.rbw_delete_user(p_token text, p_user_id text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users; target public.users;
BEGIN
  me := public.rbw_actor(p_token);
  SELECT * INTO target FROM public.users WHERE id = p_user_id;
  IF me.id IS NULL OR me.role NOT IN ('admin','super_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  IF me.id = p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Você não pode remover a si mesmo.');
  END IF;
  IF target.role = 'super_admin' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Não é possível remover um super admin.');
  END IF;
  DELETE FROM public.users WHERE id = p_user_id;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.rbw_set_password(p_token text, p_user_id text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users; target public.users;
BEGIN
  me := public.rbw_actor(p_token);
  SELECT * INTO target FROM public.users WHERE id = p_user_id;
  IF me.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Sessão inválida.'); END IF;
  IF length(coalesce(p_password,'')) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Senha deve ter no mínimo 4 caracteres.');
  END IF;
  IF me.id <> p_user_id AND me.role NOT IN ('admin','super_admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  IF target.role = 'super_admin' AND me.id <> target.id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão.');
  END IF;
  UPDATE public.users
  SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 10))
  WHERE id = p_user_id;
  DELETE FROM public.user_sessions WHERE user_id = p_user_id AND token <> p_token;
  RETURN jsonb_build_object('ok', true);
END $$;

CREATE OR REPLACE FUNCTION public.rbw_verify_password(p_token text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE me public.users;
BEGIN
  me := public.rbw_actor(p_token);
  IF me.id IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  RETURN jsonb_build_object('ok', me.password_hash = extensions.crypt(p_password, me.password_hash));
END $$;

-- ── Permissões: só as funções públicas são chamáveis ─────────
REVOKE ALL ON FUNCTION public.rbw_actor(text)                 FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.rbw_profile(public.users)       FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.rbw_login(text, text)                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_session(text)                         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_logout(text)                          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_list_users(text)                      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_create_user(text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_update_role(text,text,text)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_rename_user(text,text,text)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_delete_user(text,text)                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_set_password(text,text,text)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rbw_verify_password(text,text)            TO anon, authenticated;
