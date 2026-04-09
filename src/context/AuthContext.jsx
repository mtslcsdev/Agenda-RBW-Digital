import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const ROLES = {
  admin: { label: 'Admin', color: 'var(--accent2)', bg: 'var(--accent2-light)' },
  editor: { label: 'Editor', color: 'var(--accent3)', bg: 'var(--accent3-light)' },
  viewer: { label: 'Viewer', color: 'var(--text3)', bg: 'var(--surface2)' },
}

const SEED_USERS = [
  { id: 1, name: 'Mateus', email: 'mateus@rbw.com', role: 'admin', pin: '1234', initials: 'M', color: '#2D6A4F', createdAt: '2026-04-09' },
]

function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }

export function AuthProvider({ children }) {
  const [users, setUsersState] = useState(() => load('fd_users', SEED_USERS))
  const [currentUser, setCurrentUser] = useState(() => load('fd_currentUser', null))

  useEffect(() => { save('fd_users', users) }, [users])
  useEffect(() => { save('fd_currentUser', currentUser) }, [currentUser])

  function login(userId, pin) {
    const user = users.find(u => u.id === userId)
    if (!user) return { ok: false, error: 'Usuário não encontrado' }
    if (user.pin && user.pin !== pin) return { ok: false, error: 'PIN incorreto' }
    setCurrentUser(user)
    return { ok: true }
  }

  function logout() { setCurrentUser(null) }

  function addUser(data) {
    const newUser = {
      ...data,
      id: Date.now(),
      initials: data.name.slice(0, 2).toUpperCase(),
      color: ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5'][users.length % 6],
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setUsersState(prev => [...prev, newUser])
    return newUser
  }

  function updateUserRole(userId, role) {
    setUsersState(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, role }))
  }

  function removeUser(userId) {
    setUsersState(prev => prev.filter(u => u.id !== userId))
  }

  function updateUser(userId, data) {
    setUsersState(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u))
    if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, ...data }))
  }

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUserRole, removeUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
