import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const ROLES = {
  super_admin: { label: 'Super Admin', color: '#ef4444',        bg: '#fee2e2' },
  admin:       { label: 'Admin',       color: 'var(--accent2)', bg: 'var(--accent2-light)' },
  editor:      { label: 'Editor',      color: 'var(--accent3)', bg: 'var(--accent3-light)' },
  viewer:      { label: 'Viewer',      color: 'var(--text3)',   bg: 'var(--surface2)' },
}

const COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']
const LS_SESSION    = 'rbw_session_v3'
const LS_USER_CACHE = 'rbw_user_v3'

// Garante que a query Supabase não trave para sempre
function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    initials: row.initials || row.name?.slice(0, 2).toUpperCase() || '?',
    color: row.color || '#2D6A4F',
  }
}

function saveCache(user) {
  try { localStorage.setItem(LS_USER_CACHE, JSON.stringify(user)) } catch {}
}
function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_USER_CACHE)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers]             = useState([])
  const [viewingAs, setViewingAs]     = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Restaura sessão ao abrir o app ───────────────────────────
  useEffect(() => {
    const savedId = localStorage.getItem(LS_SESSION)
    if (!savedId) { setAuthLoading(false); return }

    withTimeout(
      supabase.from('users').select('*').eq('id', savedId).single()
    )
      .then(({ data, error }) => {
        if (data && !error) {
          const u = mapUser(data)
          setCurrentUser(u)
          saveCache(u)
        } else {
          // Usuário removido do banco — limpa sessão
          localStorage.removeItem(LS_SESSION)
          localStorage.removeItem(LS_USER_CACHE)
        }
      })
      .catch(() => {
        // Supabase lento/offline → usa perfil em cache
        const cached = loadCache()
        if (cached) setCurrentUser(cached)
        else {
          localStorage.removeItem(LS_SESSION)
          localStorage.removeItem(LS_USER_CACHE)
        }
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const profile      = currentUser
  const effectiveUser = viewingAs || profile

  // ── Login ────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase().trim())
          .eq('password', password)
          .single()
      )
      if (error || !data) return { ok: false, error: 'E-mail ou senha incorretos.' }
      const u = mapUser(data)
      setCurrentUser(u)
      saveCache(u)
      localStorage.setItem(LS_SESSION, data.id)
      return { ok: true }
    } catch (e) {
      if (e.message === 'timeout')
        return { ok: false, error: 'Servidor demorando a responder. Tente novamente em alguns segundos.' }
      return { ok: false, error: 'Erro de conexão.' }
    }
  }

  // ── Logout ───────────────────────────────────────────────────
  function logout() {
    setCurrentUser(null)
    setViewingAs(null)
    localStorage.removeItem(LS_SESSION)
    localStorage.removeItem(LS_USER_CACHE)
  }

  // ── Carregar todos os usuários (admin) ───────────────────────
  async function fetchAllProfiles() {
    const { data } = await supabase.from('users').select('*').order('created_at')
    if (data) setUsers(data.map(mapUser))
  }

  // ── Criar usuário ────────────────────────────────────────────
  async function createInvitedUser(email, password, name, role) {
    const { error } = await supabase.from('users').insert({
      id: 'u-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      initials: name.trim().slice(0, 2).toUpperCase(),
      color: COLORS[users.length % COLORS.length],
    })
    if (error) {
      if (error.code === '23505') return { ok: false, error: 'E-mail já cadastrado.' }
      return { ok: false, error: error.message }
    }
    await fetchAllProfiles()
    return { ok: true }
  }

  // ── Atualizar papel ──────────────────────────────────────────
  async function updateUserRole(userId, role) {
    await supabase.from('users').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    if (profile?.id === userId) setCurrentUser(u => ({ ...u, role }))
  }

  // ── Remover usuário ──────────────────────────────────────────
  async function removeUser(userId) {
    await supabase.from('users').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  // ── Renomear usuário ─────────────────────────────────────────
  async function renameUser(userId, newName) {
    const name = newName.trim()
    if (!name) return { ok: false, error: 'Nome não pode ser vazio.' }
    const initials = name.slice(0, 2).toUpperCase()
    const { error } = await supabase.from('users').update({ name, initials }).eq('id', userId)
    if (error) return { ok: false, error: error.message }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name, initials } : u))
    if (profile?.id === userId) {
      const updated = { ...profile, name, initials }
      setCurrentUser(updated)
      saveCache(updated)
    }
    return { ok: true }
  }

  // ── Reset de senha ───────────────────────────────────────────
  async function resetUserPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 4)
      return { ok: false, error: 'Senha deve ter mínimo 4 caracteres.' }
    const { error } = await supabase
      .from('users').update({ password: newPassword }).eq('id', userId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  // ── Verifica senha atual ──────────────────────────────────────
  async function verifyPassword(userId, password) {
    const { data } = await supabase
      .from('users').select('id').eq('id', userId).eq('password', password).single()
    return !!data
  }

  // ── Impersonação ─────────────────────────────────────────────
  function startViewingAs(user) { setViewingAs(user) }
  function stopViewingAs()      { setViewingAs(null) }

  return (
    <AuthContext.Provider value={{
      currentUser: profile,
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
      verifyPassword,
      isSuperAdmin: profile?.role === 'super_admin' || profile?.role === 'admin',
      superAdminEmail: 'mateus@rbw.com',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
