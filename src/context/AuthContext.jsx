import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export const ROLES = {
  super_admin: { label: 'Super Admin', color: '#ef4444',        bg: '#fee2e2' },
  admin:       { label: 'Admin',       color: 'var(--accent2)', bg: 'var(--accent2-light)' },
  editor:      { label: 'Editor',      color: 'var(--accent3)', bg: 'var(--accent3-light)' },
  viewer:      { label: 'Viewer',      color: 'var(--text3)',   bg: 'var(--surface2)' },
}

const COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']
const LS_USERS   = 'rbw_users_v2'
const LS_SESSION = 'rbw_session_v2'

const SEED_USERS = [
  {
    id: 'user-rbw-admin',
    name: 'Mateus',
    email: 'mateus@rbw.com',
    password: 'rbw2024',
    role: 'super_admin',
    initials: 'MA',
    color: '#2D6A4F',
    createdAt: '2024-01-01',
  },
]

function loadUsers() {
  try {
    const stored = localStorage.getItem(LS_USERS)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  localStorage.setItem(LS_USERS, JSON.stringify(SEED_USERS))
  return SEED_USERS
}

function saveUsers(users) {
  try { localStorage.setItem(LS_USERS, JSON.stringify(users)) } catch {}
}

export function AuthProvider({ children }) {
  const [users, setUsersState] = useState(() => loadUsers())
  const [currentUserId, setCurrentUserId] = useState(() => {
    try { return localStorage.getItem(LS_SESSION) || null } catch { return null }
  })
  const [viewingAs, setViewingAs] = useState(null)

  // Synchronous localStorage — never blocks, always instant
  const authLoading = false

  function _setUsers(updated) {
    setUsersState(updated)
    saveUsers(updated)
  }

  const currentUser = users.find(u => u.id === currentUserId) || null

  const profile = currentUser
    ? { id: currentUser.id, name: currentUser.name, email: currentUser.email,
        role: currentUser.role, initials: currentUser.initials, color: currentUser.color }
    : null

  const effectiveUser = viewingAs || profile

  // ── Login ────────────────────────────────────────────────────
  function login(email, password) {
    const found = users.find(u =>
      u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    )
    if (!found) return { ok: false, error: 'E-mail ou senha incorretos.' }
    setCurrentUserId(found.id)
    try { localStorage.setItem(LS_SESSION, found.id) } catch {}
    return { ok: true }
  }

  // ── Logout ───────────────────────────────────────────────────
  function logout() {
    setCurrentUserId(null)
    setViewingAs(null)
    try { localStorage.removeItem(LS_SESSION) } catch {}
  }

  // ── Recarregar lista ─────────────────────────────────────────
  function fetchAllProfiles() {
    setUsersState(loadUsers())
  }

  // ── Criar usuário ─────────────────────────────────────────────
  function createInvitedUser(email, password, name, role) {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())
    if (existing) return { ok: false, error: 'E-mail já cadastrado.' }
    if (!password || password.length < 4) return { ok: false, error: 'Senha deve ter mínimo 4 caracteres.' }
    const newUser = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      initials: name.trim().slice(0, 2).toUpperCase(),
      color: COLORS[users.length % COLORS.length],
      createdAt: new Date().toISOString().slice(0, 10),
    }
    _setUsers([...users, newUser])
    return { ok: true }
  }

  // ── Atualizar papel ──────────────────────────────────────────
  function updateUserRole(userId, role) {
    _setUsers(users.map(u => u.id === userId ? { ...u, role } : u))
  }

  // ── Remover usuário ──────────────────────────────────────────
  function removeUser(userId) {
    _setUsers(users.filter(u => u.id !== userId))
  }

  // ── Renomear usuário ─────────────────────────────────────────
  function renameUser(userId, newName) {
    const name = newName.trim()
    if (!name) return { ok: false, error: 'Nome não pode ser vazio.' }
    const initials = name.slice(0, 2).toUpperCase()
    _setUsers(users.map(u => u.id === userId ? { ...u, name, initials } : u))
    return { ok: true }
  }

  // ── Reset de senha ───────────────────────────────────────────
  function resetUserPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 4) return { ok: false, error: 'Senha deve ter mínimo 4 caracteres.' }
    _setUsers(users.map(u => u.id === userId ? { ...u, password: newPassword } : u))
    return { ok: true }
  }

  // ── Verifica senha atual (para change-password modal) ────────
  function verifyPassword(userId, password) {
    const user = users.find(u => u.id === userId)
    return !!(user && user.password === password)
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
      superAdminEmail: SEED_USERS[0].email,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
