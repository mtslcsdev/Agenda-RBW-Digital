import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import TaskItem from '../components/ui/TaskItem'
import TaskTag from '../components/ui/TaskTag'

const DEFAULT_PIPELINE = [
  { label: 'Onboarding', status: 'done' },
  { label: 'Setup', status: 'done' },
  { label: 'Desenvolvimento', status: 'current' },
  { label: 'Testes', status: '' },
  { label: 'Go-live', status: '' },
]

function clientSlug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default function ClientDetail({ onNewTask, onEditTask, onEditClient }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients, allClients, tasks, toggleTask, deleteTask, docs, folders, addDoc, addFolder, archiveClient, toggleClientHidden } = useApp()
  const { effectiveUser } = useAuth()
  const { canEdit, canDelete, canArchive, canSeeHidden } = usePermission()
  const [activeTab, setActiveTab] = useState('tarefas') // 'tarefas' | 'documentos'

  const clientPool = canSeeHidden ? allClients : clients
  const client = clientPool.find(c => clientSlug(c.name) === id || String(c.id) === id)

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>◉</div>
        <p>Cliente não encontrado.</p>
        <button className="btn btn-ghost" style={{ marginTop: '16px' }} onClick={() => navigate('/clientes')}>
          ← Voltar
        </button>
      </div>
    )
  }

  // Prefere a ligação por id; o nome só é usado para tarefas antigas sem vínculo
  const clientTasks = tasks.filter(t =>
    t.client_id ? t.client_id === client.id : t.client === client.name)
  const clientDocs = docs.filter(d => d.clientId === String(client.id))
  const clientFolder = folders.find(f => f.clientId === String(client.id))

  const donePipeline = DEFAULT_PIPELINE.filter(s => s.status === 'done').length
  const progress = Math.round((donePipeline / DEFAULT_PIPELINE.length) * 100)

  function handleArchive() {
    if (window.confirm(`Arquivar cliente "${client.name}"?`)) {
      archiveClient(client.id)
      navigate('/clientes')
    }
  }

  async function handleNewDoc() {
    let folderId = clientFolder?.id
    if (!folderId) {
      // cria pasta do cliente automaticamente se não existir
      const f = await addFolder({ name: client.name, clientId: String(client.id), color: client.color })
      folderId = f?.id
    }
    const newDoc = await addDoc({
      title: 'Sem título',
      content: '',
      folderId,
      clientId: String(client.id),
      authorId: effectiveUser?.id,
      authorName: effectiveUser?.name,
      authorColor: effectiveUser?.color,
    })
    if (newDoc?.id) navigate(`/docs/${newDoc.id}`)
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="client-avatar" style={{ background: client.color, width: '48px', height: '48px', borderRadius: '12px', fontSize: '16px' }}>
          {client.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{client.name}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {client.segment}
            {client.tags.length > 0 && ' · ' + client.tags.join(' + ')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => navigate(`/relatorio/${id}`)}>📄 Relatório</button>
          {canEdit && <button className="btn btn-ghost" onClick={() => onEditClient(client)}>✏️ Editar</button>}
          {canArchive && (
            <>
              <button className="btn btn-ghost" style={{ fontSize: '12px' }} title={client.hidden ? 'Tornar visível' : 'Ocultar (só admin)'} onClick={() => toggleClientHidden(client.id)}>
                {client.hidden ? '👁 Visível' : '🔒 Ocultar'}
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={handleArchive}>📦 Arquivar</button>
            </>
          )}
          {canEdit && activeTab === 'tarefas' && (
            <button className="btn btn-primary" onClick={onNewTask}>+ Tarefa</button>
          )}
          {canEdit && activeTab === 'documentos' && (
            <button className="btn btn-primary" onClick={handleNewDoc}>+ Documento</button>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <span className="card-title">Pipeline do Projeto</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {client.tags.map(tag => <TaskTag key={tag} label={tag} color="green" />)}
            <span className={`task-tag tag-${client.statusColor}`}>{client.status}</span>
          </div>
        </div>
        <div className="pipeline">
          {DEFAULT_PIPELINE.map((step, i) => (
            <div key={i} className={`pipeline-step${step.status ? ` ${step.status}` : ''}`}>
              <div className="step-dot">{step.status === 'done' ? '✓' : step.status === 'current' ? '▸' : i + 1}</div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
        <div className="progress-wrap" style={{ marginTop: '12px' }}>
          <div className="progress-label"><span>Progresso geral</span><span>{progress}%</span></div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '16px' }}>
        <div className={`tab${activeTab === 'tarefas' ? ' active' : ''}`} onClick={() => setActiveTab('tarefas')}>
          ✓ Tarefas ({clientTasks.length})
        </div>
        <div className={`tab${activeTab === 'documentos' ? ' active' : ''}`} onClick={() => setActiveTab('documentos')}>
          📄 Documentos ({clientDocs.length})
        </div>
      </div>

      {/* Tarefas */}
      {activeTab === 'tarefas' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tarefas</span>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{clientTasks.filter(t => !t.done).length} pendentes</span>
          </div>
          {clientTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '13px' }}>
              Nenhuma tarefa para este cliente
            </div>
          ) : (
            clientTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask} onEdit={onEditTask} onDelete={deleteTask} showDate />
            ))
          )}
        </div>
      )}

      {/* Documentos */}
      {activeTab === 'documentos' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Documentos</span>
            {clientFolder && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                📁 {clientFolder.name}
              </span>
            )}
          </div>
          {clientDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '13px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              Nenhum documento ainda.
              {canEdit && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={handleNewDoc}>+ Novo Documento</button>
                </div>
              )}
            </div>
          ) : (
            <div className="docs-list">
              {clientDocs.map(doc => (
                <div key={doc.id} className="doc-row" onClick={() => navigate(`/docs/${doc.id}`)}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="doc-row-title">{doc.title || 'Sem título'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {doc.authorName && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{doc.authorName}</span>}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{timeAgo(doc.updatedAt || doc.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

export { clientSlug }
