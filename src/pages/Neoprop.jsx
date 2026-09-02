import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import TaskItem from '../components/ui/TaskItem'

const PIPELINE_STEPS = [
  { label: 'Onboarding', status: 'done' },
  { label: 'GHL Setup', status: 'done' },
  { label: 'Webhook N8N', status: 'done' },
  { label: 'Aprovação Trader', status: 'current' },
  { label: 'Contrato', status: '', num: '5' },
  { label: 'Asaas', status: '', num: '6' },
  { label: 'Go-live', status: '', num: '7' },
]

const clientTasks = [
  { id: 101, title: 'Configurar webhook de aprovação', done: true },
  { id: 102, title: 'Fluxo de rejeição com motivo', done: false },
  { id: 103, title: 'Switch node – 3 planos Asaas', done: false },
  { id: 104, title: 'Integração assinatura de contrato', done: false },
  { id: 105, title: 'Testes end-to-end do fluxo', done: false },
]

export default function Neoprop() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState(clientTasks)
  const [noteText, setNoteText] = useState('')

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div className="client-avatar" style={{ background: '#2D6A4F', width: '48px', height: '48px', borderRadius: '12px', fontSize: '16px' }}>
          NP
        </div>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Neoprop</h3>
          <p style={{ fontSize: '12px', color: 'var(--text3)' }}>Trader Training Program · GHL + N8N + Asaas</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost">✏️ Editar</button>
          <button className="btn btn-primary">+ Tarefa</button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <span className="card-title">Pipeline do Projeto</span>
        </div>
        <div className="pipeline">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={i} className={`pipeline-step${step.status ? ` ${step.status}` : ''}`}>
              <div className="step-dot">
                {step.status === 'done' ? '✓' : step.status === 'current' ? '▸' : step.num || (i + 1)}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
        <div className="progress-wrap" style={{ marginTop: '12px' }}>
          <div className="progress-label"><span>Progresso geral</span><span>43%</span></div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '43%', background: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Tarefas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tarefas Ativas</span>
          </div>
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </div>

        {/* Notas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Notas do Cliente</span>
          </div>
          <div className="note-card">
            Confirmar com Robervan estrutura do Switch node para os 3 planos de compra via Asaas.
            <div className="note-meta">📅 07/04 · Mateus</div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                placeholder="Adicionar nota..."
                style={{ minHeight: '60px', fontSize: '12px' }}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
