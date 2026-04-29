import './TopBar.css'
import { useApp } from '../context/AppContext'

export function TopBar({ title }) {
  const { search, setSearch, notifications } = useApp()

  return (
    <div className="topbar">
      <h2>{title}</h2>
      <div className="topbar-right">
        <input
          type="text"
          placeholder="🔍 Buscar clientes, tarefas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="topbar-search"
        />
        <div className="notification-bell">
          {notifications.length > 0 && (
            <span className="notification-badge">{notifications.length}</span>
          )}
          🔔
        </div>
      </div>
    </div>
  )
}
