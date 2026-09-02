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

export default function TaskItem({ task, onToggle, onEdit, onDelete, showDate, compact }) {
  const [hovered, setHovered] = useState(false)
  const { canEdit, canDelete } = usePermission()
  const rel = showDate ? getRelativeDate(task.date) : null
  const priorityColor = PRIORITY_COLORS[task.priority]

  if (compact) {
    return (
      <div
        className="task-item"
        style={{ padding: '5px 16px', minHeight: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {priorityColor && <div className="priority-bar" style={{ background: priorityColor }} title={task.priority} />}
        <div className={`task-check${task.done ? ' done' : ''}`} onClick={() => onToggle && onToggle(task.id)}>
          {task.done ? '✓' : ''}
        </div>
        <div className={`task-text${task.done ? ' done' : ''}`} style={{ fontSize: '12px' }}>{task.title}</div>
        {task.client && <span style={{ fontSize: '11px', color: 'var(--text3)', flexShrink: 0 }}>{task.client}</span>}
        {rel && (
          <span className={`task-date${rel.overdue && !task.done ? ' overdue' : ''}`} style={{ fontSize: '11px', ...(rel.label === 'Hoje' ? { color: 'var(--accent)', fontWeight: 600 } : {}) }}>
            {rel.label}{rel.overdue && !task.done ? ' ⚠️' : ''}
          </span>
        )}
        {(onEdit || onDelete) && (canEdit || canDelete) && (
          <div style={{ display: 'flex', gap: '2px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
            {onEdit && canEdit && (
              <button className="btn-icon" style={{ width: '20px', height: '20px', fontSize: '10px' }}
                onClick={e => { e.stopPropagation(); onEdit(task) }}>✏️</button>
            )}
            {onDelete && canDelete && (
              <button className="btn-icon" style={{ width: '20px', height: '20px', fontSize: '10px', color: 'var(--red)' }}
                onClick={e => { e.stopPropagation(); onDelete(task.id) }}>✕</button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="task-item" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {priorityColor && <div className="priority-bar" style={{ background: priorityColor }} title={task.priority} />}
      <div className={`task-check${task.done ? ' done' : ''}`} onClick={() => onToggle && onToggle(task.id)}>
        {task.done ? '✓' : ''}
      </div>
      <div className={`task-text${task.done ? ' done' : ''}`}>
        {task.title}
        {task.assigneeName && (
          <span style={{ fontSize: '11px', color: 'var(--text3)', marginLeft: '8px', fontWeight: 400 }}>
            → {task.assigneeName}
          </span>
        )}
      </div>
      {task.tag && <TaskTag label={task.tag} color={task.tagColor} />}
      {rel && (
        <span className={`task-date${rel.overdue && !task.done ? ' overdue' : ''}`}
          style={rel.label === 'Hoje' ? { color: 'var(--accent)', fontWeight: 600 } : undefined}>
          {rel.label}{rel.overdue && !task.done ? ' ⚠️' : ''}
        </span>
      )}
      <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <TimerButton taskId={task.id} />
      </div>
      {(onEdit || onDelete) && (canEdit || canDelete) && (
        <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
          {onEdit && canEdit && (
            <button className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
              onClick={e => { e.stopPropagation(); onEdit(task) }} title="Editar">✏️</button>
          )}
          {onDelete && canDelete && (
            <button className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s', color: 'var(--red)' }}
              onClick={e => { e.stopPropagation(); onDelete(task.id) }} title="Excluir">✕</button>
          )}
        </div>
      )}
    </div>
  )
}
