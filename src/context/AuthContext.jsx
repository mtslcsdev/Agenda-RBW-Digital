import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const ROLES = {
  super_admin: { label: 'Super Admin', color: '#ef4444',       bg: '#fee2e2' },
  admin:       { label: 'Admin',       color: 'var(--accent2)', bg: 'var(--accent2-light)' },
  editor:      { label: 'Editor',      color: 'var(--accent3)', bg: 'var(--accent3-light)' },
  viewer:      { label: 'Viewer',      color: 'var(--text3)',   bg: 'var(--surface2)' },
}

// ID fixo do super_admin — preenchido após rodar migration_v2.sql
// Substitua este valor pelo UUID real após criar o usuário no Supabase Auth Dashboard
const SUPER_ADMIN_EMAIL = 'mateus@rbw.com'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null)   // auth.User do Supabase
  const [profile, setProfile]           = useState(null)   // linha da tabela profiles
  const [users, setUsers]               = useState([])     // todos os profiles (para admin)
  const [viewingAs, setViewingAs]       = useState(null)   // impersonação
  const [authLoading, setAuthLoading]   = useState(true)

  // ── Carrega profile a partir do userId ──────────────────────
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) setProfile(data)
    return data
  }

  // ── Inicializa sessão e escuta mudanças ──────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user)
        loadProfile(session.user.id).finally(() => setAuthLoading(false))
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user)
          await loadProfile(session.user.id)
        } else {
          setCurrentUser(null)
          setProfile(null)
          setViewingAs(null)
        }
        setAuthLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Login ────────────────────────────────────────────────────
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data }
  }

  // ── Logout ───────────────────────────────────────────────────
  async function logout() {
    setViewingAs(null)
    await supabase.auth.signOut()
  }

  // ── Carregar todos os perfis (admin) ─────────────────────────
  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    if (data) setUsers(data)
  }

  // ── Criar usuário convidado ───────────────────────────────────
  // NOTA: signUp em apps frontend-only substitui a sessão atual.
  // Para ambiente de produção, use uma Supabase Edge Function com service_role key.
  // Esta implementação salva a sessão do admin e a restaura após criar o usuário.
  async function createInvitedUser(email, password, name, role) {
    // Salva sessão do admin
    const { data: { session: adminSession } } = await supabase.auth.getSession()
    if (!adminSession) return { ok: false, error: 'Sessão expirada' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })

    if (error) {
      // Restaura sessão do admin em caso de erro
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      })
      return { ok: false, error: error.message }
    }

    const newUserId = data?.user?.id

    // Restaura sessão do admin imediatamente
    await supabase.auth.setSession({
      access_token: adminSession.access_token,
      refresh_token: adminSession.refresh_token,
    })

    // Atualiza o profile criado pelo trigger com role correto
    if (newUserId) {
      await supabase.from('profiles').upsert({
        id: newUserId,
        name: name.trim(),
        initials: name.trim().slice(0, 2).toUpperCase(),
        role,
        color: '#3A7CA5',
      })
      await fetchAllProfiles()
    }

    return { ok: true }
  }

  // ── Atualizar papel ──────────────────────────────────────────
  async function updateUserRole(userId, role) {
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    if (profile?.id === userId) setProfile(p => ({ ...p, role }))
  }

  // ── Remover usuário ──────────────────────────────────────────
  async function removeUser(userId) {
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  // ── Renomear usuário ─────────────────────────────────────────
  async function renameUser(userId, newName) {
    const name = newName.trim()
    if (!name) return { ok: false, error: 'Nome não pode ser vazio.' }
    const initials = name.slice(0, 2).toUpperCase()
    await supabase.from('profiles').update({ name, initials }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name, initials } : u))
    if (profile?.id === userId) setProfile(p => ({ ...p, name, initials }))
    return { ok: true }
  }

  // ── Reset de senha (UI-level; real reset requer Edge Function) ─
  // Fluxo prático: admin chama resetPasswordForEmail, usuário recebe email
  async function resetUserPassword(userId, _newPassword) {
    // Encontra email do usuário nos profiles carregados
    const userProfile = users.find(u => u.id === userId)
    if (!userProfile) return { ok: false, error: 'Usuário não encontrado' }

    // Nota: alterar senha de outro usuário requer service_role (Edge Function).
    // Por ora, envia email de redefinição para o usuário.
    // Para alterar diretamente, implemente: POST /functions/v1/reset-password
    return { ok: false, error: 'Redefinição direta requer Edge Function com service_role. Envie o email de reset para o usuário.' }
  }

  // ── Impersonação ─────────────────────────────────────────────
  function startViewingAs(user) { setViewingAs(user) }
  function stopViewingAs() { setViewingAs(null) }

  // ── effectiveUser combina auth.User + profile (ou viewingAs) ─
  const baseUser = currentUser && profile
    ? { ...profile, email: currentUser.email, id: profile.id }
    : null

  const effectiveUser = viewingAs || baseUser

  return (
    <AuthContext.Provider value={{
      currentUser,
      profile,
      effectiveUser,
      users,
      authLoading,
      viewingAs,
      startViewingAs,
      stopViewingAs,
      login,
      logout,
      fetchAllProfiles,
      createInvitedUser,
      updateUserRole,
      removeUser,
      renameUser,
      resetUserPassword,
      isSuperAdmin: profile?.role === 'super_admin',
      superAdminEmail: SUPER_ADMIN_EMAIL,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
