import { useAuth } from '../context/AuthContext'

export function usePermission() {
  const { currentUser } = useAuth()
  const role = currentUser?.role || 'viewer'

  return {
    role,
    isAdmin: role === 'admin',
    isEditor: role === 'editor',
    isViewer: role === 'viewer',
    canEdit: role === 'admin' || role === 'editor',
    canDelete: role === 'admin' || role === 'editor',
    canManageUsers: role === 'admin',
    canComment: role === 'admin' || role === 'editor',
  }
}
