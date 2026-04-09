import { useState } from 'react'
import { useAuth, ROLES } from '../context/AuthContext'
import rbwLogo from '../assets/rbw-logo.svg'

export default function Login() {
  const { users, login } = useAuth()
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  function handleSelect(user) {
    setSelected(user)
    setPin('')
    setError('')
  }

  function handleLogin(e) {
    e.preventDefault()
    if (!selected) return
    const result = login(selected.id, pin)
    if (!result.ok) setError(result.error)
  }

  function handlePinInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)
    setError('')
    if (val.length === 4) {
      const result = login(selected.id, val)
      if (!result.ok) setError(result.error)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={rbwLogo} alt="RBW Digital" className="logo-img" />
          <div>
            <h1>RBW <span>DIGITAL</span></h1>
            <p>Gestão de Operações</p>
          </div>
        </div>

        {!selected ? (
          <>
            <div className="login-title">Quem está entrando?</div>
            <div className="login-users">
              {users.map(user => (
                <div
                  key={user.id}
                  className="login-user-card"
                  onClick={() => handleSelect(user)}
                >
                  <div className="login-avatar" style={{ background: user.color }}>
                    {user.initials}
                  </div>
                  <div className="login-user-info">
                    <span className="login-user-name">{user.name}</span>
                    <span className="login-user-email">{user.email}</span>
                  </div>
                  <span
                    className="login-role-badge"
                    style={{ color: ROLES[user.role]?.color, background: ROLES[user.role]?.bg }}
                  >
                    {ROLES[user.role]?.label}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <form className="login-pin-form" onSubmit={handleLogin}>
            <button
              type="button"
              className="login-back"
              onClick={() => { setSelected(null); setPin(''); setError('') }}
            >
              ← Voltar
            </button>
            <div className="login-avatar large" style={{ background: selected.color }}>
              {selected.initials}
            </div>
            <div className="login-pin-name">{selected.name}</div>
            <div className="login-pin-label">Digite o PIN (4 dígitos)</div>
            <div className="login-pin-dots">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`pin-dot${pin.length > i ? ' filled' : ''}`} />
              ))}
            </div>
            <input
              className="login-pin-input"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={handlePinInput}
              autoFocus
              placeholder="••••"
              maxLength={4}
            />
            {error && <div className="login-error">{error}</div>}
          </form>
        )}

        <div className="login-footer">
          RBW Digital · Plataforma de Gestão
        </div>
      </div>
    </div>
  )
}
