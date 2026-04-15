import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email.trim()) { setError('Digite seu e-mail'); return }
    if (!form.password)     { setError('Digite sua senha'); return }
    setLoading(true)
    try {
      const { ok, error: err } = await login(form.email.trim(), form.password)
      if (!ok) setError(err || 'E-mail ou senha incorretos.')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img
            src={`${import.meta.env.BASE_URL}rbw-logo.svg`}
            alt="RBW Digital"
            style={{ width: '120px', height: '120px', borderRadius: '24px', display: 'block', margin: '0 auto 16px' }}
          />
          <div className="login-brand-name">RBW Digital</div>
          <div className="login-brand-sub">Gestão de Operações</div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
          <div className="form-group">
            <label htmlFor="login-email">E-MAIL</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              autoCapitalize="none"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">SENHA</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                style={{ paddingRight: '60px' }}
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', padding: '2px 8px' }}
                onClick={() => setShowPwd(s => !s)}
              >
                {showPwd ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px',
              background: 'var(--red-light, #fee2e2)', color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '14px' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '11px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
          Acesso restrito à equipe RBW Digital.<br />
          Solicite suas credenciais ao administrador.
        </div>
      </div>
    </div>
  )
}
