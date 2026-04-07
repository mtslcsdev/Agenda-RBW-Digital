import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import StatCard from '../components/ui/StatCard'
import TaskItem from '../components/ui/TaskItem'
import NoteCard from '../components/ui/NoteCard'
import { clientSlug } from './ClientDetail'

const scheduleItems = [
  { time: '09:00', title: 'Daily – Operações', sub: '30 min · com Robervan', bg: 'var(--accent-light)', color: 'var(--accent)' },
  { time: '10:30', title: 'Fluxo Neoprop – N8N', sub: '1h · desenvolvimento', bg: 'var(--accent2-light)', color: 'var(--accent2)' },
  { time: '14:00', title: 'Revisão de Automação', sub: '45 min · com Amanda', bg: 'var(--accent3-light)', color: 'var(--accent3)' },
  { time: '16:00', title: 'Estudo Meta Ads', sub: '30 min · individual', bg: 'var(--surface2)', color: 'var(--text)' },
]

export default function Dashboard({ onNewTask, onEditTask }) {
  const { tasks, toggleTask, deleteTask, clients, notes } = useApp()
  const navigate = useNavigate()

  const today = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter(t => t.date === today)
  const displayTasks = todayTasks.length > 0 ? todayTasks : tasks.slice(0, 5)
  const doneTasks = tasks.filter(t => t.done).length
  const pendingTasks = tasks.filter(t => !t.done).length
  const overdueTasks = tasks.filter(t => t.date < today && !t.done)

  const nextDeadline = tasks
    .filter(t => !t.done && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  // Pinned notes first
  const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <>
      <div className="stats-grid">
        <StatCard label="TAREFAS CONCLUÍDAS" value={doneTasks} sub="total até agora" variant="green" />
        <StatCard label="EM ANDAMENTO" value={pendingTasks} sub="aguardando ação" variant="orange" />
        <StatCard label="CLIENTES ATIVOS" value={clients.length} sub={`${tasks.filter(t => t.date === today && !t.done).length} com tarefas hoje`} variant="purple" />
        <StatCard
          label={overdueTasks.length > 0 ? `⚠️ ATRASADAS (${overdueTasks.length})` : 'PRÓXIMO PRAZO'}
          value={nextDeadline ? nextDeadline.date.slice(8) + '/' + nextDeadline.date.slice(5, 7) : '—'}
          sub={nextDeadline?.title?.slice(0, 28) || 'Sem prazo próximo'}
          valueStyle={{ fontSize: '18px', paddingTop: '4px', color: overdueTasks.length > 0 ? 'var(--red)' : undefined }}
        />
      </div>

      <div className="two-col">
        {/* Tarefas de Hoje */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Tarefas de Hoje</span>
            <button className="card-action" onClick={() => navigate('/tarefas')}>Ver todas</button>
          </div>
          {displayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '12px' }}>
              Nenhuma tarefa para hoje 🎉
            </div>
          ) : (
            displayTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={onEditTask}
                onDelete={deleteTask}
                showDate
              />
            ))
          )}
        </div>

        {/* Agenda de Hoje */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🕐 Agenda de Hoje</span>
            <button className="card-action" onClick={() => navigate('/agenda')}>Semana</button>
          </div>
          {scheduleItems.map((item, i) => (
            <div key={i} className="schedule-item">
              <div className="schedule-time">{item.time}</div>
              <div className="schedule-block" style={{ background: item.bg }}>
                <p style={{ color: item.color }}>{item.title}</p>
                <span style={{ color: item.color }}>{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        {/* Clientes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">◉ Clientes</span>
            <button className="card-action" onClick={() => navigate('/clientes')}>Ver todos</button>
          </div>
          {clients.slice(0, 4).map(client => (
            <div
              key={client.id}
              className="client-item"
              onClick={() => navigate(`/clientes/${clientSlug(client.name)}`)}
            >
              <div className="client-avatar" style={{ background: client.color }}>{client.initials}</div>
              <div className="client-info">
                <p>{client.name}</p>
                <span>{client.segment} · {tasks.filter(t => t.client === client.name).length} tarefas</span>
              </div>
              <span className={`client-status task-tag tag-${client.statusColor}`}>{client.status}</span>
            </div>
          ))}
        </div>

        {/* Notas Recentes */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">◻ Notas Recentes</span>
            <button className="card-action" onClick={() => navigate('/notas')}>Ver todas</button>
          </div>
          {sortedNotes.slice(0, 2).map((note, i) => (
            <div key={note.id} style={{ marginTop: i > 0 ? '10px' : undefined }}>
              <NoteCard note={note} showActions={false} preview />
            </div>
          ))}
          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '12px' }}>
              Nenhuma nota ainda
            </div>
          )}
        </div>
      </div>
    </>
  )
}
