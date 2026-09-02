import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import StatCard from '../components/ui/StatCard'
import TaskItem from '../components/ui/TaskItem'
import ActivityFeed from '../components/ui/ActivityFeed'
import { clientSlug } from './ClientDetail'

const scheduleItems = [
  { time: '09:00', title: 'Daily – Operações', sub: '30 min · com Robervan', bg: 'var(--accent-light)', color: 'var(--accent)' },
  { time: '10:30', title: 'Fluxo Neoprop – N8N', sub: '1h · desenvolvimento', bg: 'var(--accent2-light)', color: 'var(--accent2)' },
  { time: '14:00', title: 'Revisão de Automação', sub: '45 min · com Amanda', bg: 'var(--accent3-light)', color: 'var(--accent3)' },
  { time: '16:00', title: 'Estudo Meta Ads', sub: '30 min · individual', bg: 'var(--surface2)', color: 'var(--text)' },
]

export default function Dashboard({ onNewTask, onEditTask }) {
  const { tasks, toggleTask, deleteTask, clients, columns } = useApp()
  const navigate = useNavigate()

  const today = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter(t => t.date === today)
  const displayTasks = todayTasks.length > 0 ? todayTasks : tasks.slice(0, 5)

  // As colunas do quadro são configuráveis, então o resumo não pode depender de
  // nomes fixos: concluída é a coluna de conclusão, pendente é a primeira
  // coluna e "em progresso" é tudo que está no meio do caminho.
  const primeiraColuna = columns.find(c => !c.isDone)?.id
  const ehConcluida = t => t.done || columns.find(c => c.id === t.columnId)?.isDone
  const concluidas  = tasks.filter(ehConcluida).length
  const pendentes   = tasks.filter(t => !ehConcluida(t) && t.columnId === primeiraColuna).length
  const emProgresso = tasks.filter(t => !ehConcluida(t) && t.columnId !== primeiraColuna).length
  const total = tasks.length
  const progressPct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const doneTasks = concluidas
  const pendingTasks = emProgresso + pendentes
  const overdueTasks = tasks.filter(t => t.date < today && !t.done)

  const nextDeadline = tasks
    .filter(t => !t.done && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <>
      <div className="stats-grid">
        <StatCard label="CONCLUÍDAS" value={doneTasks} sub={`${progressPct}% do total`} variant="green" />
        <StatCard label="EM PROGRESSO" value={emProgresso} sub="em andamento" variant="orange" />
        <StatCard label="CLIENTES ATIVOS" value={clients.length} sub={`${tasks.filter(t => t.date === today && !t.done).length} com tarefas hoje`} variant="purple" />
        <StatCard
          label={overdueTasks.length > 0 ? `⚠️ ATRASADAS (${overdueTasks.length})` : 'PRÓXIMO PRAZO'}
          value={nextDeadline ? nextDeadline.date.slice(8) + '/' + nextDeadline.date.slice(5, 7) : '—'}
          sub={nextDeadline?.title?.slice(0, 28) || 'Sem prazo próximo'}
          valueStyle={{ fontSize: '18px', paddingTop: '4px', color: overdueTasks.length > 0 ? 'var(--red)' : undefined }}
        />
      </div>

      {/* Progress bar */}
      <div className="card" style={{ marginBottom: '16px', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)', letterSpacing: '0.5px' }}>PROGRESSO GERAL</span>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
            {concluidas} de {total} tarefas · {emProgresso} em progresso · {pendentes} pendentes
          </span>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '8px',
            background: `linear-gradient(90deg, var(--accent) ${progressPct}%, var(--accent2) ${progressPct}%)`,
            width: `${Math.max(progressPct, emProgresso > 0 ? Math.round(((concluidas + emProgresso) / total) * 100) : 0)}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--accent)' }}>● Concluído {progressPct}%</span>
          {emProgresso > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--accent2)' }}>● Em Progresso {Math.round((emProgresso / total) * 100)}%</span>
          )}
          {pendentes > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>○ Pendente {Math.round((pendentes / total) * 100)}%</span>
          )}
        </div>
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

      {/* Atividade Recente */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📜 Atividade Recente</span>
        </div>
        <ActivityFeed limit={8} />
      </div>
    </>
  )
}
