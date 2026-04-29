import { useClients } from '../hooks/useClients'
import './Finance.css'

export default function Finance() {
  const { clients } = useClients()

  const activeClients = clients.filter(c => c.status === 'ativo')
  const totalMonthlyRevenue = activeClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0)
  const overdueClients = clients.filter(c => c.renewal_date && new Date(c.renewal_date) < new Date())

  const revenueByStatus = {
    ativo: activeClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0),
    onboarding: clients
      .filter(c => c.status === 'onboarding')
      .reduce((sum, c) => sum + (c.monthly_value || 0), 0),
  }

  return (
    <div className="finance-page">
      <div className="page-header">
        <div>
          <h1>Financeiro</h1>
          <p>Acompanhe receita e status de pagamentos</p>
        </div>
      </div>

      <div className="finance-kpis">
        <div className="kpi-card">
          <h3>Receita Recorrente Mensal</h3>
          <p className="kpi-value">R$ {totalMonthlyRevenue.toFixed(2)}</p>
          <span>{activeClients.length} clientes ativos</span>
        </div>

        <div className="kpi-card">
          <h3>De Clientes Ativos</h3>
          <p className="kpi-value">R$ {revenueByStatus.ativo.toFixed(2)}</p>
          <span>Em produção</span>
        </div>

        <div className="kpi-card">
          <h3>De Onboarding</h3>
          <p className="kpi-value">R$ {revenueByStatus.onboarding.toFixed(2)}</p>
          <span>Ainda não faturando</span>
        </div>

        <div className="kpi-card warning">
          <h3>Pagamentos Vencidos</h3>
          <p className="kpi-value">{overdueClients.length}</p>
          <span>Clientes com renovação atrasada</span>
        </div>
      </div>

      {overdueClients.length > 0 && (
        <div className="overdue-section">
          <h3>Clientes com Renovação Vencida</h3>
          <div className="client-list">
            {overdueClients.map(client => (
              <div key={client.id} className="overdue-item">
                <div className="overdue-avatar" style={{ background: client.color }}>
                  {client.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="overdue-info">
                  <p>{client.name}</p>
                  <span>Vencimento: {new Date(client.renewal_date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="overdue-value">
                  {client.monthly_value ? `R$ ${client.monthly_value.toFixed(2)}/mês` : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
