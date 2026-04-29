import './Sidebar.css'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export function Sidebar({ currentView, onNavigate }) {
  const { theme, toggleTheme } = useApp()
  const { user, logout } = useAuth()

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'tarefas', label: 'Tarefas', icon: '✓' },
    { id: 'agenda', label: 'Calendário', icon: '📅' },
    { id: 'equipe', label: 'Equipe', icon: '👨‍💼' },
    { id: 'financeiro', label: 'Financeiro', icon: '💰' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">RBW</div>
        <h1>Flow<span>Desk</span></h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button onClick={toggleTheme} className="theme-btn" title="Alternar tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {user && (
          <div className="user-card">
            <div className="user-avatar" style={{ background: user.avatar_color }}>
              {user.avatar_initial}
            </div>
            <div className="user-info">
              <p className="user-name">{user.name}</p>
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}

        <button onClick={logout} className="btn-logout">
          🚪 Sair
        </button>
      </div>
    </aside>
  )
}
