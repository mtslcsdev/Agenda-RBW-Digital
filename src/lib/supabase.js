import { createClient } from '@supabase/supabase-js'

// Chave da sessão no localStorage. Fica aqui (e não no AuthContext) porque o
// fetch abaixo precisa dela a cada requisição — assim não existem duas cópias
// da string podendo divergir.
export const LS_TOKEN = 'rbw_token_v4'

// A chave "publishable" do Supabase é pública por design — a proteção real vem das
// políticas RLS. Mantemos um fallback para o build nunca quebrar sem o arquivo .env.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://sqrwbgagdigluymfimup.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a767_LTfZTIiMw3R_9HkyQ_naKGxj76'

// Toda requisição leva o token da sessão. As policies do banco leem esse header
// (via request.headers) para saber quem está chamando e qual o papel — sem ele
// as tabelas não devolvem nada. Ler do localStorage a cada chamada garante que
// o token atual seja usado logo após login, logout ou troca de senha.
//
// O timeout de 15s evita requisições penduradas para sempre.
function fetchWithAuth(url, options = {}) {
  const headers = new Headers(options.headers || {})
  try {
    const token = localStorage.getItem(LS_TOKEN)
    if (token) headers.set('x-rbw-token', token)
  } catch {
    // localStorage indisponível (aba anônima, etc.) — segue sem token
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  return fetch(url, { ...options, headers, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: {
      fetch: fetchWithAuth,
    },
  }
)
