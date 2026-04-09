import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Email interno gerado a partir do nome de usuário (nunca exposto ao usuário)
const DOMAIN = '@rbw.app'
export function usernameToEmail(username) {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') + DOMAIN
}

export const ROLES = {
  admin:  { label: 'Admin',  color: 'var(--accent2)',  bg: 'var(--accent2-light)' },
  editor: { label: 'Editor', color: 'var(--accent3)',  bg: 'var(--accent3-light)' },
  viewer: { label: 'Viewer', color: 'var(--text3)',    bg: 'var(--surface2)' },
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [viewingAs, setViewingAs] = useState(null)
  const [authLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
        fetchAllProfiles()
      }
    }).catch(() => {})

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
        fetchAllProfiles()
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setUsers([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      return data
    } catch { return null }
  }

  async function fetchAllProfiles() {
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at')
      if (data) setUsers(data)
    } catch {}
  }

  // Helper: fetch para auth com timeout e AbortController
  // isTokenEndpoint=true → omite Authorization header (conflito com sb_publishable_ key)
  async function authFetch(endpoint, body, isTokenEndpoint = false) {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/${endpoint}`
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const headers = {
        'Content-Type': 'application/json',
        'apikey': key,
      }
      if (!isTokenEndpoint) {
        headers['Authorization'] = `Bearer ${key}`
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      const data = await res.json().catch(() => ({}))
      return { res, data }
    } finally {
      clearTimeout(timer)
    }
  }

  // Login usando fetch direto com AbortController
  async function login(username, password) {
    try {
      const email = usernameToEmail(username)
      // grant_type no body (não na URL), sem Authorization header
      const { res, data } = await authFetch('token', { email, password, grant_type: 'password' }, true)
      if (!res.ok) {
        const msg = data.error_description || data.msg || data.message || `Erro ${res.status}`
        return {
          ok: false,
          error: (msg.includes('Invalid login') || msg.includes('invalid_grant'))
            ? 'Usuário ou senha incorretos.'
            : msg || 'Erro ao entrar.',
        }
      }
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e.name === 'AbortError'
          ? 'Servidor não respondeu em 20s. Tente novamente ou verifique sua internet.'
          : 'Erro de conexão: ' + (e.message || ''),
      }
    }
  }

  // Criar o primeiro admin (auto-cadastro)
  async function setupFirstAdmin(username, password, name) {
    try {
      const email = usernameToEmail(username)
      const { res, data } = await authFetch('signup', {
        email, password, data: { name },
      })
      if (!res.ok) {
        const msg = data.error_description || data.msg || data.message || ''
        return { ok: false, error: msg || 'Erro ao criar conta.' }
      }
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e.name === 'AbortError'
          ? 'Servidor não respondeu. Tente novamente.'
          : 'Erro: ' + (e.message || ''),
      }
    }
  }

  async function logout() {
    setViewingAs(null)
    try { await supabase.auth.signOut() } catch {}
  }

  function startViewingAs(user) { setViewingAs(user) }
  function stopViewingAs()      { setViewingAs(null) }

  async function updateUserRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, role }))
    }
    return !error
  }

  async function removeUser(userId) {
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  async function createInvitedUser(username, password, name, role) {
    try {
      const email = usernameToEmail(username)
      const { res, data } = await authFetch('signup', {
        email, password, data: { name },
      })
      if (!res.ok) {
        const msg = data.error_description || data.msg || data.message || ''
        return { ok: false, error: msg || 'Erro ao criar usuário.' }
      }
      if (data?.user?.id) {
        await new Promise(r => setTimeout(r, 800))
        await supabase.from('profiles').update({
          role, name,
          initials: name.slice(0, 2).toUpperCase(),
          email: username, // guarda username no campo email para exibição
        }).eq('id', data.user.id)
      }
      await fetchAllProfiles()
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e.name === 'AbortError'
          ? 'Servidor não respondeu. Tente novamente.'
          : 'Erro: ' + (e.message || ''),
      }
    }
  }

  const effectiveUser = viewingAs || currentUser

  return (
    <AuthContext.Provider value={{
      currentUser, effectiveUser, users, authLoading,
      viewingAs, startViewingAs, stopViewingAs,
      login, setupFirstAdmin, logout,
      updateUserRole, removeUser, createInvitedUser, fetchAllProfiles,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
