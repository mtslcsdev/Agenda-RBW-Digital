import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth, ROLES } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import NotificationBell from './NotificationBell'
import { ActiveTimerBar } from './ui/TimerButton'

function ChangePasswordModal({ onClose }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleSave() {
    setError('')
    if (!form.current) return setError('Digite sua senha atual.')
    if (form.next.length < 6) return setError('Nova senha deve ter mínimo 6 caracteres.')
    if (form.next !== form.confirm) return setError('As senhas não coincidem.')

    // Verifica senha atual
    const users = JSON.parse(localStorage.getItem('rbw_users') || '[]')
    const user = users.find(u => u.id === currentUser?.id)
    if (!user || user.password !== form.current) return setError('Senha atual incorreta.')

    // Atualiza
    const updated = users.map(u => u.id === currentUser.id ? { ...u, password: form.next } : u)
    localStorage.setItem('rbw_users', JSON.stringify(updated))
    setSuccess(true)
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '360px' }}>
        <h3 style={{ marginBottom: '20px' }}>🔑 Alterar Senha</h3>
        {success ? (
          <>
            <div style={{ fontSize: '13px', color: 'var(--accent)', background: 'var(--accent-light)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              Senha alterada com sucesso!
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Fechar</button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>SENHA ATUAL</label>
              <input type="password" placeholder="••••••••" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>NOVA SENHA</label>
              <input type="password" placeholder="Mínimo 6 caracteres" value={form.next} onChange={e => setForm(f => ({ ...f, next: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>CONFIRMAR NOVA SENHA</label>
              <input type="password" placeholder="Repita a nova senha" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>
            {error && <div style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '12px' }}>{error}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Topbar({ title, onNew, newLabel = '+ Novo', onMenuToggle }) {
  const { searchQuery, setSearchQuery } = useApp()
  const { currentUser, effectiveUser, viewingAs, stopViewingAs, logout } = useAuth()
  const { isViewingAs } = usePermission()
  const navigate = useNavigate()
  const [userOpen, setUserOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const dropRef = useRef()

  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleStopViewingAs() {
    stopViewingAs()
    navigate('/admin')
  }

  return (
    <div className="topbar-wrapper">
    <ActiveTimerBar />
    {isViewingAs && viewingAs && (
      <div style={{
        background: '#1a1a2e', color: '#e0e0ff', padding: '8px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', fontWeight: 500, gap: '12px',
      }}>
        <span>
          👁 Visualizando como <strong>{viewingAs.name}</strong>
          <span style={{
            marginLeft: '8px', fontSize: '10px', fontWeight: 600,
            background: ROLES[viewingAs.role]?.bg, color: ROLES[viewingAs.role]?.color,
            padding: '1px 7px', borderRadius: '10px',
          }}>
            {ROLES[viewingAs.role]?.label}
          </span>
        </span>
        <button onClick={handleStopViewingAs} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          color: 'white', borderRadius: '6px', padding: '3px 12px',
          fontSize: '11px', cursor: 'pointer', fontWeight: 600,
        }}>
          ← Voltar ao Admin
        </button>
      </div>
    )}
    <div className="topbar">
      <button className="hamburger" onClick={onMenuToggle} aria-label="Menu">☰</button>
      {title && <h2>{title}</h2>}
      <div className="topbar-actions">
        <div className="search-bar">
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input
            placeholder="Buscar tarefas, clientes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '14px', padding: 0 }}>✕</button>
          )}
        </div>

        <NotificationBell />

        {onNew && <button className="btn btn-primary" onClick={onNew}>{newLabel}</button>}

        {effectiveUser && (
          <div className="user-menu" ref={dropRef}>
            <button className="user-menu-trigger" onClick={() => setUserOpen(o => !o)}>
              <div className="topbar-avatar" style={{ background: effectiveUser.color }}>
                {effectiveUser.initials}
              </div>
              <span className="topbar-username">{effectiveUser.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>▾</span>
            </button>
            {userOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="topbar-avatar large" style={{ background: effectiveUser.color }}>
                    {effectiveUser.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{effectiveUser.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{effectiveUser.email}</div>
                    <span style={{
                      fontSize: '10px', padding: '1px 7px', borderRadius: '10px', fontWeight: 600,
                      color: ROLES[effectiveUser.role]?.color, background: ROLES[effectiveUser.role]?.bg,
                    }}>
                      {ROLES[effectiveUser.role]?.label}
                    </span>
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                {!isViewingAs && (
                  <button className="user-dropdown-item" onClick={() => { setUserOpen(false); setPwdOpen(true) }}>
                    🔑 Alterar Senha
                  </button>
                )}
                <div className="user-dropdown-divider" />
                {!isViewingAs && (
                  <button className="user-dropdown-item danger" onClick={() => { setUserOpen(false); logout() }}>
                    ↩ Sair
                  </button>
                )}
                {isViewingAs && (
                  <button className="user-dropdown-item" onClick={() => { setUserOpen(false); handleStopViewingAs() }}>
                    ← Voltar ao Admin
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} />}
    </div>
  )
}
