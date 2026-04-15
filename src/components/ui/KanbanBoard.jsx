import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { useApp, KANBAN_COLUMNS, PRIORITY_COLORS } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { usePermission } from '../../hooks/usePermission'
import TaskTag from './TaskTag'

// ── Helpers ────────────────────────────────────────────────────

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

function getTaskStatus(task) {
  return task.taskStatus || (task.done ? 'concluido' : 'pendente')
}

const COLUMN_ICONS = {
  'pendente':     '○',
  'em-progresso': '◑',
  'concluido':    '●',
}

// ── Card visual (shared between DraggableCard and DragOverlay) ─

function CardContent({ task, onEdit, showActions = true }) {
  const { deleteTask } = useApp()
  const { canEdit, canDelete } = usePermission()
  const [hovered, setHovered] = useState(false)
  const rel = getRelativeDate(task.date)
  const priorityColor = PRIORITY_COLORS[task.priority]

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
        {showActions && (
          <div className={`kanban-card-actions${hovered ? ' visible' : ''}`}>
            {onEdit && canEdit && (
              <button
                className="btn-icon"
                style={{ width: '24px', height: '24px', fontSize: '11px' }}
                onClick={e => { e.stopPropagation(); onEdit(task) }}
                title="Editar"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                className="btn-icon"
                style={{ width: '24px', height: '24px', fontSize: '11px', color: 'var(--red)' }}
                onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                title="Excluir"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── DraggableCard ──────────────────────────────────────────────

function DraggableCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
  })

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}
      {...listeners}
      {...attributes}
    >
      <CardContent task={task} onEdit={onEdit} />
    </div>
  )
}

// ── DroppableColumn ────────────────────────────────────────────

function DroppableColumn({ col, tasks, onNew, onEdit, clientFilter }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  const colTasks = tasks.filter(t => {
    if (getTaskStatus(t) !== col.id) return false
    if (clientFilter && t.client !== clientFilter) return false
    return true
  })

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col${isOver ? ' drag-over' : ''}`}
      style={isOver ? {
        borderColor: 'var(--accent)',
        background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
      } : undefined}
    >
      <div className="kanban-col-header">
        <span className="kanban-col-icon" style={{ color: col.color }}>
          {COLUMN_ICONS[col.id]}
        </span>
        <span className="kanban-col-label">{col.label.toUpperCase()}</span>
        <span className="kanban-col-count">{colTasks.length}</span>
      </div>

      <div className="kanban-col-body">
        {colTasks.length === 0 ? (
          <div className={`kanban-empty${isOver ? ' drag-target' : ''}`}>
            {isOver ? 'Soltar aqui' : 'Nenhuma tarefa'}
          </div>
        ) : (
          colTasks.map(task => (
            <DraggableCard key={task.id} task={task} onEdit={onEdit} />
          ))
        )}
      </div>

      <button className="kanban-add-btn" onClick={onNew}>
        + Adicionar Tarefa
      </button>
    </div>
  )
}

// ── KanbanBoard (main export) ─────────────────────────────────

export default function KanbanBoard({ tasks, onNew, onEdit, clientFilter, onClientFilterChange, clients }) {
  const { moveTask } = useApp()
  const { effectiveUser } = useAuth()
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragStart({ active }) {
    const task = tasks.find(t => String(t.id) === active.id)
    setActiveTask(task || null)
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return

    const task = tasks.find(t => String(t.id) === active.id)
    if (!task) return

    const currentStatus = getTaskStatus(task)
    if (over.id !== currentStatus) {
      moveTask(task.id, over.id, effectiveUser)
    }
  }

  function handleDragCancel() {
    setActiveTask(null)
  }

  return (
    <div>
      {/* Client filter bar */}
      {clients && clients.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)', marginRight: '2px' }}>Cliente:</span>
          <button
            className={`task-tag${clientFilter === '' ? ' tag-green' : ''}`}
            style={{
              cursor: 'pointer', padding: '4px 10px',
              border: clientFilter === '' ? '1px solid currentColor' : '1px solid var(--border)',
              background: clientFilter === '' ? undefined : 'transparent',
              color: clientFilter === '' ? undefined : 'var(--text2)',
            }}
            onClick={() => onClientFilterChange('')}
          >
            Todos
          </button>
          {clients.map(c => (
            <button
              key={c.id}
              className={`task-tag${clientFilter === c.name ? ' tag-green' : ''}`}
              style={{
                cursor: 'pointer', padding: '4px 10px',
                border: clientFilter === c.name ? '1px solid currentColor' : '1px solid var(--border)',
                background: clientFilter === c.name ? undefined : 'transparent',
                color: clientFilter === c.name ? undefined : 'var(--text2)',
              }}
              onClick={() => onClientFilterChange(c.name === clientFilter ? '' : c.name)}
            >
              {c.name}
            </button>
          ))}
          <button
            className={`task-tag${clientFilter === 'Pessoal' ? ' tag-green' : ''}`}
            style={{
              cursor: 'pointer', padding: '4px 10px',
              border: clientFilter === 'Pessoal' ? '1px solid currentColor' : '1px solid var(--border)',
              background: clientFilter === 'Pessoal' ? undefined : 'transparent',
              color: clientFilter === 'Pessoal' ? undefined : 'var(--text2)',
            }}
            onClick={() => onClientFilterChange(clientFilter === 'Pessoal' ? '' : 'Pessoal')}
          >
            Pessoal
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="kanban-board">
          {KANBAN_COLUMNS.map(col => (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={tasks}
              onNew={onNew}
              onEdit={onEdit}
              clientFilter={clientFilter}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div
              style={{
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                opacity: 0.95,
                transform: 'rotate(2deg)',
                pointerEvents: 'none',
              }}
            >
              <CardContent task={activeTask} onEdit={null} showActions={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
