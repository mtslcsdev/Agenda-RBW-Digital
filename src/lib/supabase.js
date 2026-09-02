import { createClient } from '@supabase/supabase-js'

// Wrapper de fetch com timeout de 15s — evita que requisições fiquem penduradas para sempre
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

// A chave "publishable" do Supabase é pública por design — a proteção real vem das
// políticas RLS. Mantemos um fallback para o build nunca quebrar sem o arquivo .env.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://sqrwbgagdigluymfimup.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a767_LTfZTIiMw3R_9HkyQ_naKGxj76'

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
      fetch: fetchWithTimeout,
    },
  }
)
