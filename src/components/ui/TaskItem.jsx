import { useState } from 'react'
import TaskTag from './TaskTag'
import { PRIORITY_COLORS } from '../../context/AppContext'
import { usePermission } from '../../hooks/usePermission'
import { TimerButton } from './TimerButton'

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

export default function TaskItem({ task, onToggle, onEdit, onDelete, showDate }) {
  const [hovered, setHovered] = useState(false)
  const { canEdit, canDelete } = usePermission()
  const rel = showDate ? getRelativeDate(task.date) : null
  const priorityColor = PRIORITY_COLORS[task.priority]

  return (
    <div
      className="task-item"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Priority bar */}
      {priorityColor && (
        <div className="priority-bar" style={{ background: priorityColor }} title={task.priority} />
      )}

      <div
        className={`task-check${task.done ? ' done' : ''}`}
        onClick={() => onToggle && onToggle(task.id)}
      >
        {task.done ? '✓' : ''}
      </div>
      <div className={`task-text${task.done ? ' done' : ''}`}>
        {task.title}
      </div>
      {task.tag && <TaskTag label={task.tag} color={task.tagColor} />}
      {rel && (
        <span
          className={`task-date${rel.overdue && !task.done ? ' overdue' : ''}`}
          style={rel.label === 'Hoje' ? { color: 'var(--accent)', fontWeight: 600 } : undefined}
        >
          {rel.label}{rel.overdue && !task.done ? ' ⚠️' : ''}
        </span>
      )}
      <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <TimerButton taskId={task.id} />
      </div>
      {(onEdit || onDelete) && (canEdit || canDelete) && (
        <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
          {onEdit && canEdit && (
            <button
              className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
              onClick={e => { e.stopPropagation(); onEdit(task) }}
              title="Editar"
            >
              ✏️
            </button>
          )}
          {onDelete && canDelete && (
            <button
              className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', color: 'var(--red)' }}
              onClick={e => { e.stopPropagation(); onDelete(task.id) }}
              title="Excluir"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
