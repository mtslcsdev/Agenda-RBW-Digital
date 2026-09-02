import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import TaskTag from '../components/ui/TaskTag'
import { clientSlug } from './ClientDetail'

export default function Clientes({ onNew, onEdit }) {
  const { clients, allClients, hiddenClients, archiveClient, toggleClientHidden, searchQuery } = useApp()
  const { canEdit, canArchive, canSeeHidden } = usePermission()
  const navigate = useNavigate()
  const [showArchived, setShowArchived] = useState(false)

  const archivedClients = allClients.filter(c => c.archived)

  const visibleClients = canSeeHidden ? [...clients, ...(hiddenClients || [])] : clients

  const filtered = searchQuery
    ? visibleClients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.segment?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleClients

  function handleArchive(e, client) {
    e.stopPropagation()
    if (window.confirm(`Arquivar cliente "${client.name}"?`)) archiveClient(client.id)
  }

  function handleToggleHidden(e, client) {
    e.stopPropagation()
    toggleClientHidden(client.id)
  }

  return (
    <div className="page-clients">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        {canEdit && <button className="btn btn-primary" onClick={onNew}>+ Novo Cliente</button>}
        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
        </span>
        {canArchive && archivedClients.length > 0 && (
          <button
            className="btn btn-ghost"
            style={{ marginLeft: 'auto', fontSize: '11px' }}
            onClick={() => setShowArchived(s => !s)}
          >
            {showArchived ? 'Ocultar arquivados' : `📦 Arquivados (${archivedClients.length})`}
          </button>
        )}
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
            style={client.hidden ? { opacity: 0.75, borderLeft: '3px solid var(--accent2)' } : undefined}
          >
            <div className="client-avatar" style={{ background: client.color, borderRadius: '8px' }}>
              {client.initials}
            </div>
            <div className="name">
              {client.hidden && <span title="Oculto" style={{ marginRight: '4px', fontSize: '11px' }}>🔒</span>}
              {client.name}
            </div>
            <div className="detail">{client.segment}</div>
            <div className="detail">{client.email}</div>
            <div className="tags">
              <TaskTag label={client.status} color={client.statusColor} />
              {client.tags.map(tag => <TaskTag key={tag} label={tag} color="green" />)}
            </div>
            {canEdit && (
              <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 8px' }}
                onClick={e => { e.stopPropagation(); onEdit(client) }}>✏️</button>
            )}
            {canArchive && (
              <>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  title={client.hidden ? 'Tornar visível' : 'Ocultar (só admin vê)'}
                  onClick={e => handleToggleHidden(e, client)}
                >
                  {client.hidden ? '👁' : '🔒'}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--red)' }}
                  title="Arquivar cliente"
                  onClick={e => handleArchive(e, client)}
                >
                  📦
                </button>
              </>
            )}
          </div>
        ))
      )}

      {/* Clientes arquivados (admin) */}
      {canArchive && showArchived && archivedClients.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 600, marginBottom: '10px' }}>
            📦 Arquivados
          </div>
          {archivedClients.map(client => (
            <div
              key={client.id}
              className="client-row"
              style={{ opacity: 0.55 }}
              onClick={() => navigate(`/clientes/${clientSlug(client.name)}`)}
            >
              <div className="client-avatar" style={{ background: client.color, borderRadius: '8px' }}>
                {client.initials}
              </div>
              <div className="name">{client.name}</div>
              <div className="detail">{client.segment}</div>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px' }}
                  onClick={e => { e.stopPropagation(); archiveClient(client.id) }}
                >
                  ↩ Desarquivar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
