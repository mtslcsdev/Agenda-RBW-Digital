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

  // Login usando fetch direto com AbortController (não trava indefinidamente)
  async function login(username, password) {
    try {
      const email = usernameToEmail(username)
      const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`
      const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 20000)

      let res
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      const data = await res.json()

      if (!res.ok) {
        const msg = (data.error_description || data.msg || data.message || '')
        if (msg.includes('Invalid login') || msg.includes('invalid_grant')) {
          return { ok: false, error: 'Usuário ou senha incorretos.' }
        }
        return { ok: false, error: msg || 'Erro ao entrar.' }
      }

      // Registra a sessão no cliente Supabase (dispara onAuthStateChange)
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })

      return { ok: true }
    } catch (e) {
      if (e.name === 'AbortError') {
        return { ok: false, error: 'Servidor não respondeu em 20s. Verifique sua internet ou tente novamente.' }
      }
      return { ok: false, error: 'Erro de conexão: ' + (e.message || 'desconhecido') }
    }
  }

  // Criar o primeiro admin (auto-cadastro, só funciona se não houver perfis)
  async function setupFirstAdmin(username, password, name) {
    const email = usernameToEmail(username)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
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
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    })
    if (error) return { ok: false, error: error.message }
    if (data?.user) {
      await new Promise(r => setTimeout(r, 800))
      await supabase.from('profiles').update({
        role, name,
        initials: name.slice(0, 2).toUpperCase(),
        email: username, // guarda o nome de usuário no campo email para exibição
      }).eq('id', data.user.id)
    }
    await fetchAllProfiles()
    return { ok: true }
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
