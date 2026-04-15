import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth, ROLES } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { supabase } from '../lib/supabase'
import NotificationBell from './NotificationBell'
import { ActiveTimerBar } from './ui/TimerButton'

function ChangePasswordModal({ onClose }) {
  const { currentUser } = useAuth()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setError('')
    if (!form.current) return setError('Digite sua senha atual.')
    if (form.next.length < 6) return setError('Nova senha deve ter mínimo 6 caracteres.')
    if (form.next !== form.confirm) return setError('As senhas não coincidem.')
    setLoading(true)
    // Verifica senha atual fazendo login temporário
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: currentUser?.email, password: form.current,
    })
    if (verifyErr) { setError('Senha atual incorreta.'); setLoading(false); return }
    // Atualiza a senha
    const { error: updErr } = await supabase.auth.updateUser({ password: form.next })
    setLoading(false)
    if (updErr) { setError(updErr.message); return }
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
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AvatarDisplay({ user, size = 32, style = {} }) {
  const [avatar, setAvatar] = useState(null)

  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`rbw_avatar_${user.id}`)
      setAvatar(stored || null)
    }
  }, [user?.id])

  const baseStyle = {
    width: size, height: size, borderRadius: '50%',
    background: user?.color || 'var(--accent)',
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: Math.floor(size * 0.36) + 'px', flexShrink: 0,
    overflow: 'hidden', ...style,
  }

  if (avatar) {
    return (
      <div style={baseStyle}>
        <img src={avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      </div>
    )
  }
  return <div style={baseStyle}>{user?.initials || '?'}</div>
}

function SearchDropdown({ query, onClose }) {
  const { tasks, clients, notes } = useApp()
  const navigate = useNavigate()

  const q = query.toLowerCase().trim()
  if (!q || q.length < 2) return null

  const matchedTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(q) || (t.client || '').toLowerCase().includes(q)
  ).slice(0, 5)

  const matchedClients = clients.filter(c =>
    c.name.toLowerCase().includes(q) || (c.segment || '').toLowerCase().includes(q)
  ).slice(0, 3)

  const matchedNotes = notes.filter(n =>
    n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
  ).slice(0, 3)

  const total = matchedTasks.length + matchedClients.length + matchedNotes.length
  if (total === 0) {
    return (
      <div className="search-dropdown">
        <div style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
          Nenhum resultado para "{query}"
        </div>
      </div>
    )
  }

  function go(path) {
    onClose()
    navigate(path)
  }

  return (
    <div className="search-dropdown">
      {matchedTasks.length > 0 && (
        <>
          <div className="search-dropdown-section">TAREFAS</div>
          {matchedTasks.map(t => (
            <div key={t.id} className="search-dropdown-item" onClick={() => go('/tarefas')}>
              <span style={{ color: t.done ? 'var(--text3)' : 'var(--accent)' }}>{t.done ? '✓' : '○'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text3)' : 'var(--text)' }}>{t.title}</div>
                {t.client && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{t.client}</div>}
              </div>
              {t.priority && t.priority !== 'Normal' && (
                <span style={{ fontSize: '10px', color: t.priority === 'Urgente' ? 'var(--red)' : 'var(--accent2)', fontWeight: 600, flexShrink: 0 }}>{t.priority}</span>
              )}
            </div>
          ))}
        </>
      )}
      {matchedClients.length > 0 && (
        <>
          <div className="search-dropdown-section">CLIENTES</div>
          {matchedClients.map(c => (
            <div key={c.id} className="search-dropdown-item" onClick={() => go(`/clientes/${c.id}`)}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0 }}>{c.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                {c.segment && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{c.segment}</div>}
              </div>
            </div>
          ))}
        </>
      )}
      {matchedNotes.length > 0 && (
        <>
          <div className="search-dropdown-section">NOTAS</div>
          {matchedNotes.map(n => (
            <div key={n.id} className="search-dropdown-item" onClick={() => go('/notas')}>
              <span>📝</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                {n.project && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{n.project}</div>}
              </div>
            </div>
          ))}
        </>
      )}
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
  const [searchFocused, setSearchFocused] = useState(false)
  const dropRef = useRef()
  const searchRef = useRef()
  const fileRef = useRef()
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleStopViewingAs() {
    stopViewingAs()
    navigate('/admin')
  }

  function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !currentUser?.id) return
    const reader = new FileReader()
    reader.onload = ev => {
      localStorage.setItem(`rbw_avatar_${currentUser.id}`, ev.target.result)
      forceUpdate(n => n + 1)
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAvatar() {
    if (!currentUser?.id) return
    localStorage.removeItem(`rbw_avatar_${currentUser.id}`)
    forceUpdate(n => n + 1)
  }

  const hasAvatar = currentUser?.id && !!localStorage.getItem(`rbw_avatar_${currentUser.id}`)

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

        {/* Search bar com dropdown */}
        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <div className="search-bar">
            <span style={{ color: 'var(--text3)' }}>🔍</span>
            <input
              placeholder="Buscar tarefas, clientes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearchQuery(''); setSearchFocused(false) } }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchFocused(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '14px', padding: 0 }}>✕</button>
            )}
          </div>
          {searchFocused && searchQuery.length >= 2 && (
            <SearchDropdown query={searchQuery} onClose={() => { setSearchQuery(''); setSearchFocused(false) }} />
          )}
        </div>

        <NotificationBell />

        {onNew && <button className="btn btn-primary" onClick={onNew}>{newLabel}</button>}

        {effectiveUser && (
          <div className="user-menu" ref={dropRef}>
            <button className="user-menu-trigger" onClick={() => setUserOpen(o => !o)}>
              <AvatarDisplay user={effectiveUser} size={32} />
              <span className="topbar-username">{effectiveUser.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>▾</span>
            </button>
            {userOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <AvatarDisplay user={effectiveUser} size={44} />
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
                  <>
                    <button className="user-dropdown-item" onClick={() => fileRef.current?.click()}>
                      📷 Alterar Foto
                    </button>
                    {hasAvatar && (
                      <button className="user-dropdown-item" style={{ color: 'var(--red)' }} onClick={() => { handleRemoveAvatar(); setUserOpen(false) }}>
                        🗑 Remover Foto
                      </button>
                    )}
                    <button className="user-dropdown-item" onClick={() => { setUserOpen(false); setPwdOpen(true) }}>
                      🔑 Alterar Senha
                    </button>
                  </>
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

    {/* Hidden file input for avatar */}
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      onChange={handleAvatarUpload}
    />

    {pwdOpen && <ChangePasswordModal onClose={() => setPwdOpen(false)} />}
    </div>
  )
}
