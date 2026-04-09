import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const ROLES = {
  admin:  { label: 'Admin',  color: 'var(--accent2)',  bg: 'var(--accent2-light)' },
  editor: { label: 'Editor', color: 'var(--accent3)',  bg: 'var(--accent3-light)' },
  viewer: { label: 'Viewer', color: 'var(--text3)',    bg: 'var(--surface2)' },
}

const COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']

// Usuário admin padrão (primeira vez)
const DEFAULT_ADMIN = {
  id: 'u1', name: 'Admin', username: 'admin', password: 'rbw2024',
  role: 'admin', initials: 'AD', color: '#2D6A4F', email: 'admin',
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem('rbw_users')) || [DEFAULT_ADMIN] }
  catch { return [DEFAULT_ADMIN] }
}
function saveUsers(list) { localStorage.setItem('rbw_users', JSON.stringify(list)) }
function loadSession() {
  try { return JSON.parse(localStorage.getItem('rbw_session')) || null }
  catch { return null }
}

// mantido para compatibilidade com código existente
export function usernameToEmail(username) {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') + '@rbw.app'
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(loadSession)
  const [users, setUsers] = useState(loadUsers)
  const [viewingAs, setViewingAs] = useState(null)
  const authLoading = false

  async function login(username, password) {
    const list = loadUsers()
    const found = list.find(u => u.username === username.trim() && u.password === password)
    if (!found) return { ok: false, error: 'Usuário ou senha incorretos.' }
    const session = { id: found.id, name: found.name, role: found.role, initials: found.initials, color: found.color, email: found.username }
    localStorage.setItem('rbw_session', JSON.stringify(session))
    setCurrentUser(session)
    return { ok: true }
  }

  // Cria o primeiro admin (aba "Criar Admin" no Login)
  async function setupFirstAdmin(username, password, name) {
    if (password.length < 6) return { ok: false, error: 'Senha deve ter mínimo 6 caracteres.' }
    const list = loadUsers()
    if (list.find(u => u.username === username.trim())) return { ok: false, error: 'Usuário já existe.' }
    const newUser = {
      id: Date.now().toString(), name: name.trim(), username: username.trim(),
      password, role: 'admin', initials: name.slice(0, 2).toUpperCase(),
      color: COLORS[0], email: username.trim(),
    }
    const updated = [...list, newUser]
    saveUsers(updated)
    setUsers(updated)
    return { ok: true }
  }

  function logout() {
    setViewingAs(null)
    localStorage.removeItem('rbw_session')
    setCurrentUser(null)
  }

  function startViewingAs(user) { setViewingAs(user) }
  function stopViewingAs() { setViewingAs(null) }

  async function updateUserRole(userId, role) {
    const updated = users.map(u => u.id === userId ? { ...u, role } : u)
    saveUsers(updated)
    setUsers(updated)
    if (currentUser?.id === userId) {
      const upd = { ...currentUser, role }
      localStorage.setItem('rbw_session', JSON.stringify(upd))
      setCurrentUser(upd)
    }
    return true
  }

  async function removeUser(userId) {
    const updated = users.filter(u => u.id !== userId)
    saveUsers(updated)
    setUsers(updated)
  }

  async function createInvitedUser(username, password, name, role) {
    if (password.length < 6) return { ok: false, error: 'Senha deve ter mínimo 6 caracteres.' }
    const list = loadUsers()
    if (list.find(u => u.username === username.trim())) return { ok: false, error: 'Usuário já existe.' }
    const newUser = {
      id: Date.now().toString(), name: name.trim(), username: username.trim(),
      password, role, initials: name.slice(0, 2).toUpperCase(),
      color: COLORS[list.length % COLORS.length], email: username.trim(),
    }
    const updated = [...list, newUser]
    saveUsers(updated)
    setUsers(updated)
    return { ok: true }
  }

  async function fetchAllProfiles() { setUsers(loadUsers()) }

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
