import { useAuth } from '../context/AuthContext'

export function usePermission() {
  const { currentUser, effectiveUser, viewingAs } = useAuth()

  // role efetivo = role do usuário visualizado (ou do próprio usuário logado)
  const role = effectiveUser?.role || 'viewer'
  // role real do admin logado (nunca muda mesmo em modo "ver como")
  const actualRole = currentUser?.role || 'viewer'

  return {
    role,
    isAdmin:        role === 'admin',
    isEditor:       role === 'editor',
    isViewer:       role === 'viewer',
    canEdit:        role === 'admin' || role === 'editor',
    canDelete:      role === 'admin' || role === 'editor',
    canComment:     role === 'admin' || role === 'editor',

    // Ações exclusivas do admin real (não são afetadas pelo "ver como")
    canArchive:     actualRole === 'admin',
    canManageUsers: actualRole === 'admin',
    canSeeHidden:   actualRole === 'admin',
    isActualAdmin:  actualRole === 'admin',

    // Metadados do "ver como"
    isViewingAs:    !!viewingAs,
    viewingAsUser:  viewingAs,
  }
}
