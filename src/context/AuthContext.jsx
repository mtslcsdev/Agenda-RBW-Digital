import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const ROLES = {
  admin: { label: 'Admin', color: 'var(--accent2)', bg: 'var(--accent2-light)' },
  editor: { label: 'Editor', color: 'var(--accent3)', bg: 'var(--accent3-light)' },
  viewer: { label: 'Viewer', color: 'var(--text3)', bg: 'var(--surface2)' },
}

const COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setCurrentUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setCurrentUser(data)
      loadAllProfiles()
    }
    setLoading(false)
  }

  async function loadAllProfiles() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    if (data) setUsers(data)
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  // Admin cria usuário: gera senha temporária e mostra pro admin compartilhar
  async function inviteUser(data) {
    const tempPassword = generatePassword()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: tempPassword,
      options: { data: { name: data.name } },
    })
    if (error) return { ok: false, error: error.message }

    // Aguarda o trigger criar o profile e então atualiza o role
    await new Promise(r => setTimeout(r, 1500))
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .single()

    if (profile) {
      await supabase.from('profiles').update({
        role: data.role,
        color: COLORS[users.length % COLORS.length],
      }).eq('id', profile.id)
    }

    await loadAllProfiles()
    return { ok: true, tempPassword }
  }

  async function updateUserRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) return
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, role }))
  }

  async function removeUser(userId) {
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', color: 'var(--text3)',
        fontSize: '13px', gap: '8px',
      }}>
        <div style={{ width: '16px', height: '16px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Carregando...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, inviteUser, updateUserRole, removeUser, loadAllProfiles }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
