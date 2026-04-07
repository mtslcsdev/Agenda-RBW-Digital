import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { clientSlug } from '../pages/ClientDetail'

export default function Sidebar() {
  const { theme, toggleTheme, clients, tasks } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const overdueCount = tasks.filter(t => t.date < today && !t.done).length
  const todayCount = tasks.filter(t => t.date === today && !t.done).length

  return (
    <aside className="sidebar">
      <div className="logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-globe">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <ellipse cx="12" cy="12" rx="4.5" ry="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="3.5" y1="7" x2="20.5" y2="7"/>
              <line x1="3.5" y1="17" x2="20.5" y2="17"/>
            </svg>
          </div>
          <div>
            <h1>RBW <span>DIGITAL</span></h1>
            <p>Gestão de Operações</p>
          </div>
        </div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Principal</div>
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">⬡</span> Dashboard
        </NavLink>
        <NavLink to="/agenda" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">📅</span> Agenda
          {todayCount > 0 && <span className="badge">{todayCount}</span>}
        </NavLink>
        <NavLink to="/tarefas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">✓</span> Tarefas
          {overdueCount > 0 && (
            <span className="badge" style={{ background: 'var(--red)' }}>{overdueCount}</span>
          )}
        </NavLink>
      </nav>

      <nav className="nav-section" style={{ marginTop: '8px' }}>
        <div className="nav-label">Clientes</div>
        <NavLink to="/clientes" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">◉</span> Todos os Clientes
        </NavLink>
        {clients.map(client => (
          <NavLink
            key={client.id}
            to={`/clientes/${clientSlug(client.name)}`}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="icon">▸</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {client.name}
            </span>
          </NavLink>
        ))}
      </nav>

      <nav className="nav-section" style={{ marginTop: '8px' }}>
        <div className="nav-label">Organização</div>
        <NavLink to="/notas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">◻</span> Notas & Docs
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="theme-toggle">
          <span>Tema</span>
          <button className="btn-icon" onClick={toggleTheme} style={{ width: '28px', height: '28px', fontSize: '13px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="user-card">
          <div className="user-avatar">M</div>
          <div className="user-info">
            <p>Mateus</p>
            <span>Ops. Assistant</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
