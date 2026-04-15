import { supabase } from '../lib/supabase'

// ─── Session / Auth ───────────────────────────────────────────────────────────

export async function getSession() {
  return supabase.auth.getSession()
}

// Inscreve um callback nas mudanças de estado de autenticação (login/logout/refresh)
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

// Retorna { ok: true } em sucesso ou { ok: false, error } em falha
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error }
  return { ok: true, data }
}

export async function signOut() {
  return supabase.auth.signOut()
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

// Atualiza campos editáveis do perfil; apenas os campos enviados em `data` são tocados
export async function updateProfile(userId, data) {
  const { name, initials, color, role } = data
  return supabase
    .from('profiles')
    .update({ name, initials, color, role })
    .eq('id', userId)
}

export async function getAllProfiles() {
  return supabase
    .from('profiles')
    .select('*')
    .order('created_at')
}

// ─── Admin: criação / reset / exclusão ───────────────────────────────────────

/**
 * Cria um novo usuário via signUp.
 * ATENÇÃO: Em apps frontend-only, signUp cria a sessão do novo usuário no cliente.
 * Para criação administrativa sem trocar de sessão, use uma Edge Function com service_role.
 * Retorna { ok, error, userId }.
 */
export async function createUser(email, password, name, role) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  })

  if (error) return { ok: false, error, userId: null }

  const userId = data?.user?.id ?? null
  return { ok: true, error: null, userId }
}

/**
 * Redefine a senha de um usuário.
 * NOTA: A API de admin (auth.admin.updateUserById) exige service_role e não deve ser
 * chamada do frontend. Em produção, delegue para uma Edge Function.
 * Esta implementação atualiza apenas o metadata de profile como indicação de pendência.
 */
export async function resetPassword(userId, newPassword) {
  // Registra no profile que uma redefinição foi solicitada.
  // Para alterar a senha de fato, use uma Edge Function com privilégio de service_role.
  return supabase
    .from('profiles')
    .update({ password_reset_pending: true })
    .eq('id', userId)
}

/**
 * Deleta o registro em `profiles`.
 * O registro correspondente em auth.users é removido via DELETE CASCADE configurado no banco.
 */
export async function deleteProfile(userId) {
  return supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
}
