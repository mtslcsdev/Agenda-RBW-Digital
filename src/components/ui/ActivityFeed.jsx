import { useApp } from '../../context/AppContext'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

export default function ActivityFeed({ limit = 8 }) {
  const { activityLog } = useApp()

  if (activityLog.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '12px' }}>
        Nenhuma atividade ainda
      </div>
    )
  }

  return (
    <div className="activity-feed">
      {activityLog.slice(0, limit).map((entry, i) => (
        <div key={entry.id} className="activity-item">
          <div className="activity-avatar" style={{ background: entry.userColor }}>
            {entry.userName?.slice(0, 1).toUpperCase()}
          </div>
          <div className="activity-body">
            <span className="activity-actor">{entry.userName}</span>
            {' '}
            <span className="activity-action">{entry.action}</span>
            {' '}
            <span className="activity-target">"{entry.entityTitle}"</span>
          </div>
          <span className="activity-time">{timeAgo(entry.createdAt)}</span>
        </div>
      ))}
    </div>
  )
}
