import { useState } from 'react'
import { useApp } from '../context/AppContext'
import TaskItem from '../components/ui/TaskItem'

const TABS = ['Todas', 'Hoje', 'Semana', 'Atrasadas']

export default function Tarefas({ onNew }) {
  const { tasks, toggleTask } = useApp()
  const [activeTab, setActiveTab] = useState('Todas')

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {TABS.map(tab => (
            <div
              key={tab}
              className={`tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost">Filtrar</button>
          <button className="btn btn-primary" onClick={onNew}>+ Tarefa</button>
        </div>
      </div>

      <div className="card">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTask} showDate />
        ))}
      </div>
    </>
  )
}
