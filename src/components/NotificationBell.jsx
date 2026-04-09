import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function NotificationBell() {
  const { notifications, markNotificationRead, markAllRead, unreadCount } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleOpen() {
    setOpen(o => !o)
  }

  function handleClick(n) {
    markNotificationRead(n.id)
  }

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={handleOpen} title="Notificações">
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notificações</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Marcar todas lidas
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">Nenhuma notificação</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-icon">{n.icon}</span>
                  <div className="notif-body">
                    <span className="notif-message">{n.message}</span>
                    <span className="notif-time">{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
