import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TaskTag from '../components/ui/TaskTag'

export default function Clientes({ onNew }) {
  const { clients } = useApp()
  const navigate = useNavigate()

  return (
    <div className="page-clients">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={onNew}>+ Novo Cliente</button>
        <div className="search-bar" style={{ maxWidth: '220px' }}>
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input placeholder="Buscar cliente..." />
        </div>
      </div>

      {clients.map(client => (
        <div
          key={client.id}
          className="client-row"
          onClick={() => client.name === 'Neoprop' ? navigate('/clientes/neoprop') : undefined}
        >
          <div className="client-avatar" style={{ background: client.color, borderRadius: '8px' }}>
            {client.initials}
          </div>
          <div className="name">{client.name}</div>
          <div className="detail">{client.segment}</div>
          <div className="detail">{client.email}</div>
          <div className="tags">
            <TaskTag label={client.status} color={client.statusColor} />
            {client.tags.map(tag => (
              <TaskTag key={tag} label={tag} color="green" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
