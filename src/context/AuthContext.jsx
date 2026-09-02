import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const ROLES = {
  super_admin: { label: 'Super Admin', color: '#ef4444',        bg: '#fee2e2' },
  admin:       { label: 'Admin',       color: 'var(--accent2)', bg: 'var(--accent2-light)' },
  editor:      { label: 'Editor',      color: 'var(--accent3)', bg: 'var(--accent3-light)' },
  viewer:      { label: 'Viewer',      color: 'var(--text3)',   bg: 'var(--surface2)' },
}

const LS_TOKEN      = 'rbw_token_v4'
const LS_USER_CACHE = 'rbw_user_v4'

// Garante que nenhuma chamada ao Supabase trave a interface para sempre
function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

function saveCache(user) {
  try { localStorage.setItem(LS_USER_CACHE, JSON.stringify(user)) } catch {}
}
function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_USER_CACHE)) } catch { return null }
}
function clearSession() {
  try {
    localStorage.removeItem(LS_TOKEN)
    localStorage.removeItem(LS_USER_CACHE)
  } catch {}
}

// Chama uma função RPC do banco. Toda a autenticação vive no servidor:
// a tabela de usuários não é legível pela chave pública do site.
async function rpc(fn, args) {
  const { data, error } = await withTimeout(supabase.rpc(fn, args))
  if (error) return { ok: false, error: error.message }
  return data || { ok: false, error: 'Resposta vazia do servidor.' }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers]             = useState([])
  const [viewingAs, setViewingAs]     = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // ── Restaura sessão ao abrir o app ───────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(LS_TOKEN)
    if (!token) { setAuthLoading(false); return }

    rpc('rbw_session', { p_token: token })
      .then(res => {
        if (res.ok && res.user) {
          setCurrentUser(res.user)
          saveCache(res.user)
        } else {
          // Sessão expirada ou revogada
          clearSession()
        }
      })
      .catch(() => {
        // Servidor lento/offline → segue com o perfil em cache
        const cached = loadCache()
        if (cached) setCurrentUser(cached)
        else clearSession()
      })
      .finally(() => setAuthLoading(false))
  }, [])

  const profile       = currentUser
  const effectiveUser = viewingAs || profile
  const token         = () => localStorage.getItem(LS_TOKEN)

  // ── Login ────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      const res = await rpc('rbw_login', {
        p_email: email.toLowerCase().trim(),
        p_password: password,
      })
      if (!res.ok) return { ok: false, error: res.error || 'E-mail ou senha incorretos.' }

      localStorage.setItem(LS_TOKEN, res.token)
      setCurrentUser(res.user)
      saveCache(res.user)
      return { ok: true }
    } catch (e) {
      if (e.message === 'timeout')
        return { ok: false, error: 'Servidor demorando a responder. Tente novamente em alguns segundos.' }
      return { ok: false, error: 'Erro de conexão.' }
    }
  }

  // ── Logout ───────────────────────────────────────────────────
  function logout() {
    const t = token()
    setCurrentUser(null)
    setViewingAs(null)
    setUsers([])
    clearSession()
    if (t) rpc('rbw_logout', { p_token: t }).catch(() => {})
  }

  // ── Listar usuários (admin) ──────────────────────────────────
  async function fetchAllProfiles() {
    const res = await rpc('rbw_list_users', { p_token: token() })
    if (res.ok && res.users) setUsers(res.users)
  }

  // ── Criar usuário ────────────────────────────────────────────
  async function createInvitedUser(email, password, name, role) {
    const res = await rpc('rbw_create_user', {
      p_token: token(), p_name: name, p_email: email, p_password: password, p_role: role,
    })
    if (res.ok) await fetchAllProfiles()
    return res
  }

  // ── Atualizar papel ──────────────────────────────────────────
  async function updateUserRole(userId, role) {
    const res = await rpc('rbw_update_role', {
      p_token: token(), p_user_id: userId, p_role: role,
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      if (profile?.id === userId) {
        const updated = { ...profile, role }
        setCurrentUser(updated)
        saveCache(updated)
      }
    } else {
      await fetchAllProfiles()
    }
    return res
  }

  // ── Remover usuário ──────────────────────────────────────────
  async function removeUser(userId) {
    const res = await rpc('rbw_delete_user', { p_token: token(), p_user_id: userId })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
    else await fetchAllProfiles()
    return res
  }

  // ── Renomear usuário ─────────────────────────────────────────
  async function renameUser(userId, newName) {
    const name = newName.trim()
    const res = await rpc('rbw_rename_user', {
      p_token: token(), p_user_id: userId, p_name: name,
    })
    if (!res.ok) return res

    const initials = name.slice(0, 2).toUpperCase()
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, name, initials } : u))
    if (profile?.id === userId) {
      const updated = { ...profile, name, initials }
      setCurrentUser(updated)
      saveCache(updated)
    }
    return res
  }

  // ── Definir senha ────────────────────────────────────────────
  async function resetUserPassword(userId, newPassword) {
    return rpc('rbw_set_password', {
      p_token: token(), p_user_id: userId, p_password: newPassword,
    })
  }

  // ── Confere a senha atual do usuário logado ──────────────────
  async function verifyPassword(_userId, password) {
    const res = await rpc('rbw_verify_password', { p_token: token(), p_password: password })
    return res.ok === true
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
