import TaskTag from './TaskTag'

export default function TaskItem({ task, onToggle, showDate }) {
  return (
    <div className="task-item">
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
        <span className={`task-date${task.date === '09/04' ? ' overdue' : ''}`}>
          {task.date}{task.date === '09/04' ? ' ⚠️' : ''}
        </span>
      )}
    </div>
  )
}
