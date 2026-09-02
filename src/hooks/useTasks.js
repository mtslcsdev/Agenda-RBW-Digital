import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

// Hook de conveniência que combina tasks do AppContext com o effectiveUser
// para passar como actor nas operações de mutação
export function useTasks() {
  const { tasks, allTasks, archivedTasks, addTask, editTask, deleteTask, toggleTask, moveTask, archiveTask } = useApp()
  const { effectiveUser } = useAuth()

  return {
    tasks,
    allTasks,
    archivedTasks,
    addTask:    (data)        => addTask(data, effectiveUser),
    editTask:   (id, data)    => editTask(id, data, effectiveUser),
    deleteTask: (id)          => deleteTask(id, effectiveUser),
    toggleTask: (id)          => toggleTask(id, effectiveUser),
    moveTask:   (id, status)  => moveTask(id, status, effectiveUser),
    archiveTask,
  }
}
