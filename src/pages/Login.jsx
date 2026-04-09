import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    const result = await login(email.trim(), password)
    if (!result.ok) {
      setError(result.error === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : result.error)
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="#2D6A4F"/>
            <text x="20" y="27" textAnchor="middle" fill="white" fontSize="16" fontWeight="800" fontFamily="Poppins,sans-serif">R</text>
          </svg>
          <div>
            <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px' }}>RBW Digital</div>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Gestão de Operações</div>
          </div>
        </div>

        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Bem-vindo de volta</h2>
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '24px' }}>
          Entre com seu e-mail e senha para acessar.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>E-MAIL</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>SENHA</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: 'var(--red)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '16px',
              border: '1px solid var(--red)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', height: '42px', fontSize: '14px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Entrando...
              </span>
            ) : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--text3)' }}>
          Não tem acesso? Peça ao administrador para criar sua conta.
        </div>
      </div>
    </div>
  )
}
