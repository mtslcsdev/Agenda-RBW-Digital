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
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // Listener de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
        fetchAllProfiles()
      } else {
        setCurrentUser(null)
        setUsers([])
      }
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return data
  }

  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    if (data) setUsers(data)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function signup(email, password, name) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

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
    // Cria usuário — trigger auto-cria o profile com role='viewer'
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { ok: false, error: error.message }

    // Atualiza role se não for viewer
    if (role !== 'viewer' && data?.user) {
      // Aguarda trigger criar o profile
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
      updateUserRole, removeUser, createInvitedUser,
      fetchAllProfiles,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
