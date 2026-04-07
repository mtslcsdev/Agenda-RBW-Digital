import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import StatCard from '../components/ui/StatCard'
import TaskItem from '../components/ui/TaskItem'
import TaskTag from '../components/ui/TaskTag'

const scheduleItems = [
  { time: '09:00', title: 'Daily – Operações', sub: '30 min · com Robervan', bg: 'var(--accent-light)', color: 'var(--accent)' },
  { time: '10:30', title: 'Fluxo Neoprop – N8N', sub: '1h · desenvolvimento', bg: 'var(--accent2-light)', color: 'var(--accent2)' },
  { time: '14:00', title: 'Revisão de Automação', sub: '45 min · com Amanda', bg: 'var(--accent3-light)', color: 'var(--accent3)' },
  { time: '16:00', title: 'Estudo Meta Ads', sub: '30 min · individual', bg: 'var(--surface2)', color: 'var(--text)' },
]

export default function Dashboard() {
  const { tasks, toggleTask, clients, notes } = useApp()
  const navigate = useNavigate()

  const todayTasks = tasks.slice(0, 5)
  const doneTasks = tasks.filter(t => t.done).length
  const inProgressTasks = tasks.filter(t => !t.done).length

  return (
    <>
      <div className="stats-grid">
        <StatCard label="TAREFAS CONCLUÍDAS" value={doneTasks} sub="esta semana" variant="green" />
        <StatCard label="EM ANDAMENTO" value={inProgressTasks} sub="aguardando ação" variant="orange" />
        <StatCard label="CLIENTES ATIVOS" value={clients.length} sub="3 com tarefas hoje" variant="purple" />
        <StatCard
          label="PRÓXIMO PRAZO"
          value="Qua 09"
          sub="Contrato Neoprop"
          valueStyle={{ fontSize: '18px', paddingTop: '4px' }}
        />
      </div>

      <div className="two-col">
        {/* Tarefas de Hoje */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Tarefas de Hoje</span>
            <button className="card-action" onClick={() => navigate('/tarefas')}>Ver todas</button>
          </div>
          {todayTasks.map(task => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
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
          {clients.map(client => (
            <div
              key={client.id}
              className="client-item"
              onClick={() => client.name === 'Neoprop' ? navigate('/clientes/neoprop') : undefined}
            >
              <div className="client-avatar" style={{ background: client.color }}>{client.initials}</div>
              <div className="client-info">
                <p>{client.name}</p>
                <span>{client.segment} · {client.taskCount} tarefas</span>
              </div>
              <span className={`client-status task-tag tag-${client.statusColor}`}>{client.status}</span>
            </div>
          ))}
        </div>

        {/* Nota Rápida */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">◻ Nota Rápida</span>
            <button className="card-action" onClick={() => navigate('/notas')}>Nova nota</button>
          </div>
          {notes.slice(0, 2).map(note => (
            <div
              key={note.id}
              className={`note-card${note.color === 'blue' || note.color === 'purple' ? ' blue' : ''}`}
              style={{ marginTop: note.id > 1 ? '10px' : undefined }}
            >
              <strong>{note.title}</strong><br />
              {note.content}
              <div className="note-meta">📅 {note.date} · Mateus</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
