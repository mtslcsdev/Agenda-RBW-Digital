import { useState } from 'react'
import { useApp } from '../context/AppContext'
import TaskItem from '../components/ui/TaskItem'
import KanbanBoard from '../components/ui/KanbanBoard'

const TABS = ['Todas', 'Hoje', 'Semana', 'Atrasadas', 'Quadro']

function getWeekRange() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export default function Tarefas({ onNew, onEdit }) {
  const { tasks, toggleTask, deleteTask, searchQuery, clients } = useApp()
  const [activeTab, setActiveTab] = useState('Todas')
  const [tagFilter, setTagFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('') // '' | 'pendentes' | 'concluidas'
  const [compact, setCompact] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const { start: weekStart, end: weekEnd } = getWeekRange()

  const tags = [...new Set(tasks.map(t => t.tag).filter(Boolean))]
  const overdueCount = tasks.filter(t => t.date < today && !t.done).length

  const filtered = tasks.filter(task => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!task.title.toLowerCase().includes(q) && !task.client?.toLowerCase().includes(q)) return false
    }
    if (tagFilter && task.tag !== tagFilter) return false
    if (clientFilter && task.client !== clientFilter) return false
    if (priorityFilter && task.priority !== priorityFilter) return false
    if (statusFilter === 'pendentes' && task.done) return false
    if (statusFilter === 'concluidas' && !task.done) return false
    if (activeTab === 'Hoje') return task.date === today
    if (activeTab === 'Semana') return task.date >= weekStart && task.date <= weekEnd
    if (activeTab === 'Atrasadas') return task.date < today && !task.done
    return true
  })

  const hasFilters = tagFilter || clientFilter || priorityFilter || statusFilter

  return (
    <>
      {/* Abas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {TABS.map(tab => (
            <div key={tab} className={`tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
              {tab === 'Atrasadas' && overdueCount > 0 && (
                <span style={{ marginLeft: '4px', background: 'var(--red)', color: 'white', fontSize: '9px', padding: '0 4px', borderRadius: '10px' }}>
                  {overdueCount}
                </span>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-ghost${compact ? ' active' : ''}`}
            style={{ fontSize: '12px', padding: '5px 10px', background: compact ? 'var(--accent-light)' : undefined, color: compact ? 'var(--accent)' : undefined }}
            onClick={() => setCompact(c => !c)}
            title="Modo compacto"
          >
            ☰ Compacto
          </button>
          <button className="btn btn-primary" onClick={onNew}>+ Tarefa</button>
        </div>
      </div>

      {/* Filtros */}
      {activeTab !== 'Quadro' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Tag */}
          <select
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface)', color: tagFilter ? 'var(--accent)' : 'var(--text2)', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
          >
            <option value="">Tag: Todas</option>
            {tags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Cliente */}
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface)', color: clientFilter ? 'var(--accent)' : 'var(--text2)', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
          >
            <option value="">Cliente: Todos</option>
            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>

          {/* Prioridade */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface)', color: priorityFilter ? 'var(--accent2)' : 'var(--text2)', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
          >
            <option value="">Prioridade: Todas</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '7px', border: '1px solid var(--border)', background: 'var(--surface)', color: statusFilter ? 'var(--accent3)' : 'var(--text2)', fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}
          >
            <option value="">Status: Todos</option>
            <option value="pendentes">Pendentes</option>
            <option value="concluidas">Concluídas</option>
          </select>

          {hasFilters && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--red)' }}
              onClick={() => { setTagFilter(''); setClientFilter(''); setPriorityFilter(''); setStatusFilter('') }}
            >
              ✕ Limpar filtros
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
            {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {activeTab === 'Quadro' ? (
        <KanbanBoard tasks={filtered} onNew={onNew} onEdit={onEdit}
          clientFilter={clientFilter} onClientFilterChange={setClientFilter} clients={clients} />
      ) : (
        <div className="card" style={{ padding: compact ? '4px 0' : undefined }}>
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
                compact={compact}
              />
            ))
          )}
        </div>
      )}
    </>
  )
}
