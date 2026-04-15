// Re-exporta useAuth do AuthContext para uso direto nos componentes
// Permite que o código use `import { useAuth } from '../hooks/useAuth'`
// sem depender do path do context
export { useAuth } from '../context/AuthContext'
