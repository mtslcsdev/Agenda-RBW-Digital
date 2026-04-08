import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { KANBAN_COLUMNS, PRIORITY_COLORS } from '../../context/AppContext'
import TaskTag from './TaskTag'

function getRelativeDate(iso) {
  if (!iso) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(iso + 'T00:00:00')
  const diff = Math.round((date - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { label: 'Hoje', overdue: false }
  if (diff === 1) return { label: 'Amanhã', overdue: false }
  if (diff === -1) return { label: 'Ontem', overdue: true }
  if (diff > 1) return { label: `Em ${diff} dias`, overdue: false }
  return { label: `Há ${Math.abs(diff)} dias`, overdue: true }
}

const COLUMN_ICONS = {
  'pendente': '○',
  'em-progresso': '◑',
  'concluido': '●',
}

const NEXT_STATUS = {
  'pendente': 'em-progresso',
  'em-progresso': 'concluido',
  'concluido': null,
}

function KanbanCard({ task, onEdit, col }) {
  const { moveTask, deleteTask } = useApp()
  const [hovered, setHovered] = useState(false)
  const rel = getRelativeDate(task.date)
  const priorityColor = PRIORITY_COLORS[task.priority]
  const nextStatus = NEXT_STATUS[col.id]

  return (
    <div
      className="kanban-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {priorityColor && (
        <div className="kanban-priority-bar" style={{ background: priorityColor }} />
      )}
      <div className="kanban-card-body">
        <div className="kanban-card-title">{task.title}</div>
        {task.client && (
          <div className="kanban-card-client">{task.client}</div>
        )}
        <div className="kanban-card-meta">
          {task.tag && <TaskTag label={task.tag} color={task.tagColor} />}
          {rel && (
            <span
              className={`kanban-date${rel.overdue && !task.done ? ' overdue' : ''}`}
              style={rel.label === 'Hoje' ? { color: 'var(--accent)', fontWeight: 600 } : undefined}
            >
              📅 {rel.label}{rel.overdue && !task.done ? ' ⚠️' : ''}
            </span>
          )}
        </div>
        <div className={`kanban-card-actions${hovered ? ' visible' : ''}`}>
          {onEdit && (
            <button
              className="btn-icon"
              style={{ width: '24px', height: '24px', fontSize: '11px' }}
              onClick={e => { e.stopPropagation(); onEdit(task) }}
              title="Editar"
            >
              ✏️
            </button>
          )}
          {nextStatus && (
            <button
              className="btn-icon"
              style={{ width: '24px', height: '24px', fontSize: '11px' }}
              onClick={e => { e.stopPropagation(); moveTask(task.id, nextStatus) }}
              title={`Mover para ${KANBAN_COLUMNS.find(c => c.id === nextStatus)?.label}`}
            >
              →
            </button>
          )}
          <button
            className="btn-icon"
            style={{ width: '24px', height: '24px', fontSize: '11px', color: 'var(--red)' }}
            onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
            title="Excluir"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard({ tasks, onNew, onEdit }) {
  const getTaskStatus = (task) => task.taskStatus || (task.done ? 'concluido' : 'pendente')

  return (
    <div className="kanban-board">
      {KANBAN_COLUMNS.map(col => {
        const colTasks = tasks.filter(t => getTaskStatus(t) === col.id)
        return (
          <div key={col.id} className="kanban-col">
            <div className="kanban-col-header">
              <span className="kanban-col-icon" style={{ color: col.color }}>
                {COLUMN_ICONS[col.id]}
              </span>
              <span className="kanban-col-label">{col.label.toUpperCase()}</span>
              <span className="kanban-col-count">{colTasks.length}</span>
            </div>

            <div className="kanban-col-body">
              {colTasks.length === 0 ? (
                <div className="kanban-empty">Nenhuma tarefa</div>
              ) : (
                colTasks.map(task => (
                  <KanbanCard key={task.id} task={task} onEdit={onEdit} col={col} />
                ))
              )}
            </div>

            <button className="kanban-add-btn" onClick={onNew}>
              + Adicionar Tarefa
            </button>
          </div>
        )
      })}
    </div>
  )
}
