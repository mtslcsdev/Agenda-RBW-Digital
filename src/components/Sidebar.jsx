import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth, ROLES } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import rbwLogo from '../assets/rbw-logo.svg'

export default function Sidebar({ open, onClose }) {
  const { theme, toggleTheme, tasks, docs } = useApp()
  const { effectiveUser } = useAuth()
  const { isActualAdmin } = usePermission()
  const today = new Date().toISOString().slice(0, 10)
  const overdueCount = tasks.filter(t => t.date < today && !t.done).length
  const todayCount = tasks.filter(t => t.date === today && !t.done).length

  const handleNav = () => { if (onClose) onClose() }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={rbwLogo} alt="RBW Digital" className="logo-img" />
            <div>
              <h1>RBW <span>DIGITAL</span></h1>
              <p>Gestão de Operações</p>
            </div>
          </div>
        </div>

        <nav className="nav-section">
          <div className="nav-label">Principal</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
            <span className="icon">⬡</span> Dashboard
          </NavLink>
          <NavLink to="/agenda" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
            <span className="icon">📅</span> Agenda
            {todayCount > 0 && <span className="badge">{todayCount}</span>}
          </NavLink>
          <NavLink to="/tarefas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
            <span className="icon">✓</span> Tarefas
            {overdueCount > 0 && (
              <span className="badge" style={{ background: 'var(--red)' }}>{overdueCount}</span>
            )}
          </NavLink>
        </nav>

        <nav className="nav-section" style={{ marginTop: '8px' }}>
          <div className="nav-label">Clientes</div>
          <NavLink to="/clientes" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
            <span className="icon">◉</span> Todos os Clientes
          </NavLink>
        </nav>

        <nav className="nav-section" style={{ marginTop: '8px' }}>
          <div className="nav-label">Organização</div>
          <NavLink to="/docs" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
            <span className="icon">📄</span> Documentos
            {docs.length > 0 && <span className="badge" style={{ background: 'rgba(255,255,255,0.15)' }}>{docs.length}</span>}
          </NavLink>
        </nav>

        {isActualAdmin && (
          <nav className="nav-section" style={{ marginTop: '8px' }}>
            <div className="nav-label">Administração</div>
            <NavLink to="/admin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
              <span className="icon">⚙️</span> Usuários
            </NavLink>
          </nav>
        )}

        <div className="sidebar-bottom">
          <div className="theme-toggle">
            <span>Tema</span>
            <button className="btn-icon" onClick={toggleTheme} style={{ width: '28px', height: '28px', fontSize: '13px' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          {effectiveUser && (
            <div className="user-card">
              <div className="user-avatar" style={{ background: effectiveUser.color }}>{effectiveUser.initials}</div>
              <div className="user-info">
                <p>{effectiveUser.name}</p>
                <span style={{ color: ROLES[effectiveUser.role]?.color }}>{ROLES[effectiveUser.role]?.label}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
