import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth, ROLES } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import { ActiveTimerBar } from './ui/TimerButton'

export default function Topbar({ title, onNew, newLabel = '+ Novo', onMenuToggle }) {
  const { searchQuery, setSearchQuery } = useApp()
  const { currentUser, logout } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const dropRef = useRef()

  useEffect(() => {
    function handler(e) { if (dropRef.current && !dropRef.current.contains(e.target)) setUserOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="topbar-wrapper">
    <ActiveTimerBar />
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
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '14px', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>

        <NotificationBell />

        {onNew && (
          <button className="btn btn-primary" onClick={onNew}>{newLabel}</button>
        )}

        {currentUser && (
          <div className="user-menu" ref={dropRef}>
            <button className="user-menu-trigger" onClick={() => setUserOpen(o => !o)}>
              <div className="topbar-avatar" style={{ background: currentUser.color }}>
                {currentUser.initials}
              </div>
              <span className="topbar-username">{currentUser.name}</span>
              <span style={{ fontSize: '10px', color: 'var(--text3)' }}>▾</span>
            </button>
            {userOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="topbar-avatar large" style={{ background: currentUser.color }}>
                    {currentUser.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{currentUser.email}</div>
                    <span
                      style={{
                        fontSize: '10px', padding: '1px 7px', borderRadius: '10px', fontWeight: 600,
                        color: ROLES[currentUser.role]?.color,
                        background: ROLES[currentUser.role]?.bg,
                      }}
                    >
                      {ROLES[currentUser.role]?.label}
                    </span>
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  className="user-dropdown-item danger"
                  onClick={() => { setUserOpen(false); logout() }}
                >
                  ↩ Sair
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
