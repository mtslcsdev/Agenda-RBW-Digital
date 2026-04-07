import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TaskTag from '../components/ui/TaskTag'
import { clientSlug } from './ClientDetail'

export default function Clientes({ onNew, onEdit }) {
  const { clients, searchQuery } = useApp()
  const navigate = useNavigate()

  const filtered = searchQuery
    ? clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.segment?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clients

  return (
    <div className="page-clients">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={onNew}>+ Novo Cliente</button>
        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>
          Nenhum cliente encontrado
        </div>
      ) : (
        filtered.map(client => (
          <div
            key={client.id}
            className="client-row"
            onClick={() => navigate(`/clientes/${clientSlug(client.name)}`)}
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
            <button
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '3px 8px', marginLeft: '8px' }}
              onClick={e => { e.stopPropagation(); onEdit(client) }}
            >
              ✏️
            </button>
          </div>
        ))
      )}
    </div>
  )
}
