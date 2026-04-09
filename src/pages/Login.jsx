import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, setupFirstAdmin } = useAuth()
  const [tab, setTab] = useState('login') // 'login' | 'setup'
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        if (!form.username.trim()) { setError('Digite seu usuário'); return }
        const { ok, error: err } = await login(form.username, form.password)
        if (!ok) setError(err || 'Erro ao entrar')
      } else {
        if (!form.name.trim())     { setError('Nome obrigatório'); return }
        if (!form.username.trim()) { setError('Nome de usuário obrigatório'); return }
        if (form.password.length < 6) { setError('Senha: mínimo 6 caracteres'); return }
        const { ok, error: err } = await setupFirstAdmin(form.username, form.password, form.name)
        if (!ok) setError(err || 'Erro ao criar conta')
        else setError('Admin criado! Faça login agora.')
      }
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
            style={{ width: '140px', height: '140px', borderRadius: '24px', display: 'block', margin: '0 auto 12px' }}
          />
          <div className="login-brand-name">RBW Digital</div>
          <div className="login-brand-sub">Gestão de Operações</div>
        </div>

        <div className="tabs" style={{ marginBottom: '20px' }}>
          <div className={`tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError('') }}>
            Entrar
          </div>
          <div className={`tab${tab === 'setup' ? ' active' : ''}`} onClick={() => { setTab('setup'); setError('') }}>
            Criar Admin
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'setup' && (
            <div className="form-group">
              <label htmlFor="login-name">NOME COMPLETO</label>
              <input
                id="login-name"
                name="name"
                placeholder="Ex: Mateus Lucas"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-username">USUÁRIO</label>
            <input
              id="login-username"
              name="username"
              placeholder={tab === 'login' ? 'Seu nome de usuário' : 'Ex: mateus (sem espaços)'}
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">SENHA</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div style={{
              fontSize: '12px', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px',
              background: error.startsWith('Admin criado') ? 'var(--accent-light)' : 'var(--red-light, #fee2e2)',
              color: error.startsWith('Admin criado') ? 'var(--accent)' : 'var(--red)',
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
            {loading ? '...' : tab === 'login' ? 'Entrar' : 'Criar Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
