import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { clientSlug } from './ClientDetail'

const PRIORITY_LABELS = { Normal: 'Normal', Alta: 'Alta', Urgente: 'Urgente' }

export default function Relatorio() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { clients, tasks, notes, allColumns: columns } = useApp()

  const client = clients.find(c => clientSlug(c.name) === clientId)
  const clientTasks = tasks.filter(t =>
    t.client_id ? t.client_id === client?.id : t.client === client?.name)
  const clientNotes = notes.filter(n => n.project === client?.name)

  // Mesmo critério do Dashboard: as colunas são configuráveis, então o status
  // vem da coluna em que o card está, não de nomes fixos.
  const primeiraColuna = columns.find(c => !c.isDone)?.id
  const ehConcluida = t => t.done || columns.find(c => c.id === t.columnId)?.isDone
  const nomeDaColuna = t => columns.find(c => c.id === t.columnId)?.label || '—'
  const concluidas  = clientTasks.filter(ehConcluida).length
  const pendentes   = clientTasks.filter(t => !ehConcluida(t) && t.columnId === primeiraColuna).length
  const emProgresso = clientTasks.filter(t => !ehConcluida(t) && t.columnId !== primeiraColuna).length
  const total = clientTasks.length
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  if (!client) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text3)' }}>
        Cliente não encontrado.{' '}
        <button className="btn btn-ghost" onClick={() => navigate('/clientes')}>Voltar</button>
      </div>
    )
  }

  return (
    <div className="relatorio-page">
      {/* Print controls (hidden on print) */}
      <div className="relatorio-controls no-print">
        <button className="btn btn-ghost" onClick={() => navigate(`/clientes/${clientId}`)}>← Voltar</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Imprimir / Salvar PDF</button>
      </div>

      {/* Report content */}
      <div className="relatorio-content">
        {/* Header */}
        <div className="relatorio-header">
          <div>
            <div className="relatorio-brand">RBW DIGITAL — Relatório de Cliente</div>
            <div className="relatorio-date">{today}</div>
          </div>
          <div className="relatorio-client-badge" style={{ background: client.color }}>
            {client.initials}
          </div>
        </div>

        <div className="relatorio-divider" />

        {/* Client info */}
        <div className="relatorio-section">
          <h2 className="relatorio-section-title">Informações do Cliente</h2>
          <div className="relatorio-info-grid">
            <div><span className="relatorio-label">Nome</span><span className="relatorio-value">{client.name}</span></div>
            <div><span className="relatorio-label">Segmento</span><span className="relatorio-value">{client.segment}</span></div>
            <div><span className="relatorio-label">E-mail</span><span className="relatorio-value">{client.email}</span></div>
            <div><span className="relatorio-label">Status</span><span className="relatorio-value">{client.status}</span></div>
          </div>
        </div>

        <div className="relatorio-divider" />

        {/* Stats */}
        <div className="relatorio-section">
          <h2 className="relatorio-section-title">Resumo de Tarefas</h2>
          <div className="relatorio-stats">
            <div className="relatorio-stat"><div className="relatorio-stat-value" style={{ color: 'var(--text)' }}>{total}</div><div className="relatorio-stat-label">Total</div></div>
            <div className="relatorio-stat"><div className="relatorio-stat-value" style={{ color: 'var(--accent)' }}>{concluidas}</div><div className="relatorio-stat-label">Concluídas</div></div>
            <div className="relatorio-stat"><div className="relatorio-stat-value" style={{ color: 'var(--accent3)' }}>{emProgresso}</div><div className="relatorio-stat-label">Em Progresso</div></div>
            <div className="relatorio-stat"><div className="relatorio-stat-value" style={{ color: 'var(--text3)' }}>{pendentes}</div><div className="relatorio-stat-label">Pendentes</div></div>
            <div className="relatorio-stat"><div className="relatorio-stat-value" style={{ color: 'var(--accent)' }}>{pct}%</div><div className="relatorio-stat-label">Conclusão</div></div>
          </div>
          {total > 0 && (
            <div className="relatorio-progress-bar">
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
          )}
        </div>

        <div className="relatorio-divider" />

        {/* Tasks table */}
        <div className="relatorio-section">
          <h2 className="relatorio-section-title">Lista de Tarefas</h2>
          {clientTasks.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '13px' }}>Nenhuma tarefa cadastrada.</p>
          ) : (
            <table className="relatorio-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Tag</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {clientTasks.map(t => (
                  <tr key={t.id} style={{ opacity: t.done ? 0.6 : 1 }}>
                    <td style={{ textDecoration: t.done ? 'line-through' : undefined }}>{t.title}</td>
                    <td><span className={`task-tag tag-${t.tagColor}`}>{t.tag}</span></td>
                    <td>{PRIORITY_LABELS[t.priority] || t.priority}</td>
                    <td>{nomeDaColuna(t)}</td>
                    <td>{t.date ? new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {clientNotes.length > 0 && (
          <>
            <div className="relatorio-divider" />
            <div className="relatorio-section">
              <h2 className="relatorio-section-title">Notas do Projeto</h2>
              {clientNotes.map(note => (
                <div key={note.id} className="relatorio-note">
                  <div className="relatorio-note-title">{note.title}</div>
                  {note.content && <div className="relatorio-note-content">{note.content}</div>}
                  <div className="relatorio-note-date">{note.date}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="relatorio-footer">
          Gerado em {today} · RBW Digital — Gestão de Operações
        </div>
      </div>
    </div>
  )
}
