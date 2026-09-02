import { useAuth } from '../context/AuthContext'

export function usePermission() {
  const { profile, effectiveUser, viewingAs } = useAuth()

  // Role efetivo (pode ser do usuário impersonado)
  const role = effectiveUser?.role || 'viewer'
  // Role real do usuário logado (nunca muda em modo "ver como")
  const actualRole = profile?.role || 'viewer'

  const isSuperAdmin   = actualRole === 'super_admin'
  const isActualAdmin  = actualRole === 'admin' || actualRole === 'super_admin'

  return {
    role,
    isAdmin:         role === 'admin' || role === 'super_admin',
    isEditor:        role === 'editor',
    isViewer:        role === 'viewer',
    canEdit:         role !== 'viewer',
    canDelete:       role !== 'viewer',
    canComment:      role !== 'viewer',

    // Ações exclusivas do admin real (não afetadas pelo "ver como")
    canArchive:      isActualAdmin,
    canManageUsers:  isActualAdmin,
    canSeeHidden:    isActualAdmin,
    isActualAdmin,
    isSuperAdmin,

    // Metadados do "ver como"
    isViewingAs:     !!viewingAs,
    viewingAsUser:   viewingAs,
  }
}
