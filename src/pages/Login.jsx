import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, signup } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (tab === 'login') {
      const { ok, error: err } = await login(form.email, form.password)
      if (!ok) setError(err || 'Erro ao entrar')
    } else {
      if (!form.name.trim()) { setError('Nome obrigatório'); setLoading(false); return }
      const { ok, error: err } = await signup(form.email, form.password, form.name)
      if (!ok) setError(err || 'Erro ao criar conta')
      else setError('Conta criada! Verifique seu e-mail se necessário.')
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img
            src={`${import.meta.env.BASE_URL}rbw-logo.svg`}
            alt="RBW Digital"
            style={{ width: '140px', height: '140px', borderRadius: '24px', display: 'block', margin: '0 auto 12px' }}
          />
          <div className="login-brand-name">RBW Digital</div>
          <div className="login-brand-sub">Gestão de Operações</div>
        </div>

        <div className="tabs" style={{ marginBottom: '20px' }}>
          <div className={`tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Entrar</div>
          <div className={`tab${tab === 'signup' ? ' active' : ''}`} onClick={() => { setTab('signup'); setError('') }}>Criar conta</div>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <div className="form-group">
              <label>NOME</label>
              <input
                placeholder="Seu nome completo"
                value={form.name}
                onChange={set('name')}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="form-group">
            <label>E-MAIL</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>SENHA</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div style={{
              fontSize: '12px',
              padding: '8px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              background: error.startsWith('Conta criada') ? 'var(--accent-light)' : 'var(--red-light, #fee2e2)',
              color: error.startsWith('Conta criada') ? 'var(--accent)' : 'var(--red)',
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
            {loading ? '...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
