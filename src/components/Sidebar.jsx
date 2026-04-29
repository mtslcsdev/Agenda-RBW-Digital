import styles from './Sidebar.module.css'

export function Sidebar({ currentView, onNavigate, user, theme, onThemeToggle, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clientes', label: 'Clientes', icon: '👥' },
    { id: 'tarefas', label: 'Tarefas', icon: '✓' },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.badge}>RBW</div>
        <h1>Flow<span>Desk</span></h1>
        <p>Gestão de Ops</p>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${currentView === item.id ? styles.active : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.themeToggle}>
          <button onClick={onThemeToggle} className={styles.themeBtn} title="Alternar tema">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        {user && (
          <div className={styles.userCard}>
            <div
              className={styles.avatar}
              style={{ background: user.avatar_color }}
            >
              {user.avatar_initial}
            </div>
            <div className={styles.userInfo}>
              <p>{user.name}</p>
              <span>{user.role}</span>
            </div>
          </div>
        )}

        <button onClick={onLogout} className={styles.logout}>
          🚪 Sair
        </button>
      </div>
    </aside>
  )
}
