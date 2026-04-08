import { useState } from 'react'
import { useApp } from '../context/AppContext'
import TaskItem from '../components/ui/TaskItem'
import KanbanBoard from '../components/ui/KanbanBoard'

const TABS = ['Todas', 'Hoje', 'Semana', 'Atrasadas', 'Quadro']

function getWeekRange() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1) // segunda
  const end = new Date(start)
  end.setDate(start.getDate() + 6) // domingo
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export default function Tarefas({ onNew, onEdit }) {
  const { tasks, toggleTask, deleteTask, searchQuery, clients } = useApp()
  const [activeTab, setActiveTab] = useState('Todas')
  const [tagFilter, setTagFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const { start: weekStart, end: weekEnd } = getWeekRange()

  const tags = [...new Set(tasks.map(t => t.tag).filter(Boolean))]
  const overdueCount = tasks.filter(t => t.date < today && !t.done).length
  const totalTaskCount = tasks.length

  const filtered = tasks.filter(task => {
    // search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!task.title.toLowerCase().includes(q) && !task.client?.toLowerCase().includes(q)) return false
    }
    // tag filter
    if (tagFilter && task.tag !== tagFilter) return false
    // tab filter
    if (activeTab === 'Hoje') return task.date === today
    if (activeTab === 'Semana') return task.date >= weekStart && task.date <= weekEnd
    if (activeTab === 'Atrasadas') return task.date < today && !task.done
    return true
  })

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {TABS.map(tab => (
            <div
              key={tab}
              className={`tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === 'Atrasadas' && overdueCount > 0 && (
                <span style={{
                  marginLeft: '4px', background: 'var(--red)', color: 'white',
                  fontSize: '9px', padding: '0 4px', borderRadius: '10px',
                }}>
                  {overdueCount}
                </span>
              )}
              {tab === 'Quadro' && (
                <span style={{
                  marginLeft: '4px', background: 'var(--accent3-light)', color: 'var(--accent3)',
                  fontSize: '9px', padding: '0 4px', borderRadius: '10px',
                }}>
                  {totalTaskCount}
                </span>
              )}
            </div>
          ))}
        </div>

        {activeTab !== 'Quadro' && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`task-tag${tagFilter === '' ? ' tag-green' : ''}`}
              style={{ cursor: 'pointer', padding: '4px 10px', border: tagFilter === '' ? '1px solid currentColor' : '1px solid var(--border)' }}
              onClick={() => setTagFilter('')}
            >
              Todas
            </button>
            {tags.map(tag => (
              <button
                key={tag}
                className={`task-tag tag-${tagFilter === tag ? tasks.find(t => t.tag === tag)?.tagColor || 'green' : ''}`}
                style={{ cursor: 'pointer', padding: '4px 10px', border: tagFilter === tag ? '1px solid currentColor' : '1px solid var(--border)', background: tagFilter === tag ? undefined : 'transparent', color: tagFilter === tag ? undefined : 'var(--text2)' }}
                onClick={() => setTagFilter(t => t === tag ? '' : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={onNew}>+ Tarefa</button>
        </div>
      </div>

      {activeTab === 'Quadro' ? (
        <KanbanBoard
          tasks={filtered}
          onNew={onNew}
          onEdit={onEdit}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          clients={clients}
        />
      ) : (
        <div className="card">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '13px' }}>
              Nenhuma tarefa encontrada
            </div>
          ) : (
            filtered.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={onEdit}
                onDelete={deleteTask}
                showDate
              />
            ))
          )}
        </div>
      )}
    </>
  )
}
