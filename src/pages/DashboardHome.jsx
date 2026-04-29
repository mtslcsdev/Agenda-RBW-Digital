import { useClients } from '../hooks/useClients'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../context/AuthContext'
import './DashboardHome.css'

export default function DashboardHome() {
  const { user } = useAuth()
  const { clients, loading: clientsLoading } = useClients()
  const { tasks, loading: tasksLoading } = useTasks()

  const activeClients = clients.filter(c => c.status === 'ativo').length
  const onboardingClients = clients.filter(c => c.status === 'onboarding').length
  const pendingTasks = tasks.filter(t => t.completed_at === null).length
  const completedToday = tasks.filter(t => {
    if (!t.completed_at) return false
    const today = new Date().toDateString()
    return new Date(t.completed_at).toDateString() === today
  }).length

  const kpis = [
    {
      label: 'Clientes Ativos',
      value: activeClients,
      icon: '👥',
      color: 'var(--accent)',
    },
    {
      label: 'Em Onboarding',
      value: onboardingClients,
      icon: '🚀',
      color: 'var(--accent2)',
    },
    {
      label: 'Tarefas Pendentes',
      value: pendingTasks,
      icon: '✓',
      color: 'var(--yellow)',
    },
    {
      label: 'Concluídas Hoje',
      value: completedToday,
      icon: '✅',
      color: 'var(--green)',
    },
  ]

  const urgentTasks = tasks
    .filter(t => t.priority === 'urgent' && t.completed_at === null)
    .slice(0, 5)

  const recentClients = clients.slice(0, 5)

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <h1>Bem-vindo, {user?.name}! 👋</h1>
        <p className="dashboard-subtitle">Aqui está um resumo das suas operações</p>
      </div>

      <div className="kpis-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-icon">{kpi.icon}</span>
              <span className="kpi-label">{kpi.label}</span>
            </div>
            <div className="kpi-value" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h3>Tarefas Urgentes</h3>
          {urgentTasks.length > 0 ? (
            <div className="task-list">
              {urgentTasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-priority" style={{
                    background: task.priority === 'urgent' ? 'var(--red)' : 'var(--yellow)'
                  }} />
                  <div className="task-content">
                    <p>{task.title}</p>
                    <span className="task-meta">{task.description?.slice(0, 40)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Nenhuma tarefa urgente 🎉</p>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Clientes Recentes</h3>
          {recentClients.length > 0 ? (
            <div className="client-list">
              {recentClients.map(client => (
                <div key={client.id} className="client-item">
                  <div className="client-avatar" style={{ background: client.color || 'var(--accent)' }}>
                    {client.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="client-info">
                    <p>{client.name}</p>
                    <span className={`client-badge ${client.status}`}>{client.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Nenhum cliente ainda</p>
          )}
        </div>
      </div>
    </div>
  )
}
