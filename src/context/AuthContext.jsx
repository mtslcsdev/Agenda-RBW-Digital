import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

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

  async function login(username, password) {
    const email = usernameToEmail(username)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        const msg = error.message || ''
        if (msg.toLowerCase().includes('invalid') || msg.includes('credentials')) {
          return { ok: false, error: 'Usuário ou senha incorretos.' }
        }
        if (msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
          return { ok: false, error: 'Tempo esgotado (15s). Verifique sua conexão e tente novamente.' }
        }
        return { ok: false, error: msg || 'Erro ao entrar.' }
      }
      return { ok: true }
    } catch (e) {
      const msg = e?.message || ''
      return {
        ok: false,
        error: msg.toLowerCase().includes('abort')
          ? 'Tempo esgotado (15s). Verifique sua conexão e tente novamente.'
          : 'Erro de conexão: ' + (msg || ''),
      }
    }
  }

  async function setupFirstAdmin(username, password, name) {
    const email = usernameToEmail(username)
    try {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { name } },
      })
      if (error) return { ok: false, error: error.message || 'Erro ao criar conta.' }
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e?.message?.toLowerCase().includes('abort')
          ? 'Tempo esgotado. Tente novamente.'
          : 'Erro: ' + (e?.message || ''),
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
    const email = usernameToEmail(username)
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { name } },
      })
      if (error) return { ok: false, error: error.message || 'Erro ao criar usuário.' }
      if (data?.user?.id) {
        await new Promise(r => setTimeout(r, 800))
        await supabase.from('profiles').update({
          role, name,
          initials: name.slice(0, 2).toUpperCase(),
          email: username,
        }).eq('id', data.user.id)
      }
      await fetchAllProfiles()
      return { ok: true }
    } catch (e) {
      return {
        ok: false,
        error: e?.message?.toLowerCase().includes('abort')
          ? 'Tempo esgotado. Tente novamente.'
          : 'Erro: ' + (e?.message || ''),
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
