import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './TaskList.module.css'

export function TaskList({ tasks, onRefresh, compact }) {
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'normal' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          completed: false,
        })

      if (!error) {
        setNewTask({ title: '', description: '', priority: 'normal' })
        setShowForm(false)
        onRefresh?.()
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTask = async (taskId, completed) => {
    try {
      await supabase
        .from('tasks')
        .update({
          completed: !completed,
          completed_at: !completed ? new Date().toISOString() : null,
        })
        .eq('id', taskId)

      onRefresh?.()
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err)
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: '#D94F3D',
      high: '#E07A3A',
      normal: '#2D6A4F',
      low: '#5B4FCF',
    }
    return colors[priority] || colors.normal
  }

  const displayTasks = compact ? tasks.slice(0, 5) : tasks

  return (
    <div className={styles.container}>
      {!compact && (
        <div className={styles.header}>
          <h3>Tarefas</h3>
          <button
            className={styles.btn}
            onClick={() => setShowForm(!showForm)}
          >
            + Nova
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddTask} className={styles.form}>
          <input
            type="text"
            placeholder="Título da tarefa"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
            autoFocus
          />
          <textarea
            placeholder="Descrição (opcional)"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            rows="2"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          >
            <option value="low">Baixa prioridade</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <div className={styles.formActions}>
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Criar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {displayTasks.length === 0 ? (
          <div className={styles.empty}>
            {compact ? 'Nenhuma tarefa' : 'Nenhuma tarefa cadastrada'}
          </div>
        ) : (
          displayTasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <button
                className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
                onClick={() => handleToggleTask(task.id, task.completed)}
                type="button"
              >
                {task.completed && '✓'}
              </button>
              <div className={styles.info}>
                <p className={`${styles.title} ${task.completed ? styles.completed : ''}`}>
                  {task.title}
                </p>
                {task.description && !compact && (
                  <span className={styles.description}>{task.description}</span>
                )}
              </div>
              <div
                className={styles.priority}
                style={{ background: getPriorityColor(task.priority) }}
                title={`Prioridade: ${task.priority}`}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
