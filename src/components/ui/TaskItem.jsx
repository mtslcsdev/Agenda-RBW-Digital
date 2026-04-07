import { useState } from 'react'
import TaskTag from './TaskTag'

function formatDate(iso) {
  if (!iso) return null
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function isOverdue(iso) {
  if (!iso) return false
  const today = new Date().toISOString().slice(0, 10)
  return iso < today
}

export default function TaskItem({ task, onToggle, onEdit, onDelete, showDate, showActions }) {
  const [hovered, setHovered] = useState(false)
  const overdue = showDate && isOverdue(task.date) && !task.done

  return (
    <div
      className="task-item"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
      {showDate && task.date && (
        <span className={`task-date${overdue ? ' overdue' : ''}`}>
          {formatDate(task.date)}{overdue ? ' ⚠️' : ''}
        </span>
      )}
      {(showActions || hovered) && (onEdit || onDelete) && (
        <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
          {onEdit && (
            <button
              className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
              onClick={e => { e.stopPropagation(); onEdit(task) }}
              title="Editar"
            >
              ✏️
            </button>
          )}
          {onDelete && (
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
