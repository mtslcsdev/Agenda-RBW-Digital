import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Sidebar() {
  const { theme, toggleTheme } = useApp()

  return (
    <aside className="sidebar">
      <div className="logo">
        <h1>Flow<span>Desk</span></h1>
        <p>Gestão de Operações</p>
      </div>

      <nav className="nav-section">
        <div className="nav-label">Principal</div>
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">⬡</span> Dashboard
        </NavLink>
        <NavLink to="/agenda" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">📅</span> Agenda
          <span className="badge">3</span>
        </NavLink>
        <NavLink to="/tarefas" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">✓</span> Tarefas
        </NavLink>
      </nav>

      <nav className="nav-section" style={{ marginTop: '8px' }}>
        <div className="nav-label">Clientes</div>
        <NavLink to="/clientes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">◉</span> Todos os Clientes
        </NavLink>
        <NavLink to="/clientes/neoprop" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="icon">▸</span> Neoprop
        </NavLink>
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
