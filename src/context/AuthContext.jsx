import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const ROLES = {
  admin:  { label: 'Admin',  color: 'var(--accent2)',  bg: 'var(--accent2-light)' },
  editor: { label: 'Editor', color: 'var(--accent3)',  bg: 'var(--accent3-light)' },
  viewer: { label: 'Viewer', color: 'var(--text3)',    bg: 'var(--surface2)' },
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  // Sem loading screen — login aparece imediatamente
  const [authLoading] = useState(false)

  useEffect(() => {
    // Verifica sessão em background (sem travar a UI)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
        fetchAllProfiles()
      }
    }).catch(() => {}) // ignora erros de rede silenciosamente

    // Listener para login/logout
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

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function signup(email, password, name) {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function logout() { await supabase.auth.signOut() }

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

  async function createInvitedUser(email, password, name, role) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) return { ok: false, error: error.message }
    if (role !== 'viewer' && data?.user) {
      await new Promise(r => setTimeout(r, 800))
      await supabase.from('profiles').update({ role, name, initials: name.slice(0, 2).toUpperCase() }).eq('id', data.user.id)
    }
    await fetchAllProfiles()
    return { ok: true }
  }

  return (
    <AuthContext.Provider value={{
      currentUser, users, authLoading,
      login, signup, logout,
      updateUserRole, removeUser, createInvitedUser, fetchAllProfiles,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
