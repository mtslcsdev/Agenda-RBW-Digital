import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import TaskItem from '../components/ui/TaskItem'
import TaskTag from '../components/ui/TaskTag'
import NoteCard from '../components/ui/NoteCard'

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

export default function ClientDetail({ onNewTask, onEditTask, onEditClient }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients, allClients, tasks, toggleTask, deleteTask, notes, addNote, archiveNote, archiveClient, toggleClientHidden } = useApp()
  const { canEdit, canDelete, canArchive, canSeeHidden } = usePermission()
  const [noteText, setNoteText] = useState('')

  // Admin pode ver clientes ocultos ou arquivados diretamente pela URL
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

  const clientTasks = tasks.filter(t => t.client === client.name)
  const clientNotes = notes.filter(n => n.project === client.name)

  const donePipeline = DEFAULT_PIPELINE.filter(s => s.status === 'done').length
  const progress = Math.round((donePipeline / DEFAULT_PIPELINE.length) * 100)

  function handleAddNote() {
    if (!noteText.trim()) return
    addNote({ title: `Nota – ${client.name}`, content: noteText, project: client.name, color: 'yellow' })
    setNoteText('')
  }

  function handleArchive() {
    if (window.confirm(`Arquivar cliente "${client.name}"?`)) {
      archiveClient(client.id)
      navigate('/clientes')
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div className="client-avatar" style={{ background: client.color, width: '48px', height: '48px', borderRadius: '12px', fontSize: '16px' }}>
          {client.initials}
        </div>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>{client.name}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {client.segment}
            {client.tags.length > 0 && ' · ' + client.tags.join(' + ')}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => navigate(`/relatorio/${id}`)}>📄 Relatório</button>
          {canEdit && <button className="btn btn-ghost" onClick={() => onEditClient(client)}>✏️ Editar</button>}
          {canArchive && (
            <>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '12px' }}
                title={client.hidden ? 'Tornar visível' : 'Ocultar (só admin)'}
                onClick={() => toggleClientHidden(client.id)}
              >
                {client.hidden ? '👁 Visível' : '🔒 Ocultar'}
              </button>
              <button className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={handleArchive}>📦 Arquivar</button>
            </>
          )}
          {canEdit && <button className="btn btn-primary" onClick={onNewTask}>+ Tarefa</button>}
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
              <div className="step-dot">
                {step.status === 'done' ? '✓' : step.status === 'current' ? '▸' : i + 1}
              </div>
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

      <div className="two-col">
        {/* Tarefas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tarefas Ativas</span>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{clientTasks.filter(t => !t.done).length} pendentes</span>
          </div>
          {clientTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '12px' }}>
              Nenhuma tarefa para este cliente
            </div>
          ) : (
            clientTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={onEditTask}
                onDelete={deleteTask}
                showDate
              />
            ))
          )}
        </div>

        {/* Notas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Notas do Cliente</span>
          </div>
          {clientNotes.map(note => (
            <div key={note.id} style={{ marginBottom: '8px' }}>
              <NoteCard note={note} showActions={false} />
            </div>
          ))}
          <div style={{ marginTop: '8px' }}>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <textarea
                placeholder="Adicionar nota rápida..."
                style={{ minHeight: '60px', fontSize: '12px' }}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost" style={{ fontSize: '12px', width: '100%' }} onClick={handleAddNote}>
              + Salvar nota
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export { clientSlug }
