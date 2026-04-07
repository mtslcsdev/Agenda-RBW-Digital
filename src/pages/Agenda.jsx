import { useState } from 'react'
import TaskTag from '../components/ui/TaskTag'

const DAYS = [
  { abbr: 'SEG', num: '07', tasks: [{ label: 'Daily – 09h', color: 'green' }, { label: 'N8N Neoprop', color: 'orange' }, { label: 'Rev. Automação', color: 'purple' }] },
  { abbr: 'TER', num: '08', tasks: [{ label: 'Reunião Joy', color: 'orange' }, { label: 'GHL Config', color: 'green' }] },
  { abbr: 'QUA', num: '09', tasks: [{ label: 'Prazo Contrato', color: 'red' }, { label: 'Meta Ads', color: 'purple' }] },
  { abbr: 'QUI', num: '10', tasks: [{ label: 'Daily – 09h', color: 'green' }, { label: 'Asaas Testes', color: 'orange' }] },
  { abbr: 'SEX', num: '11', tasks: [{ label: 'Rev. Semanal', color: 'green' }, { label: 'Ebook 5km', color: 'purple' }] },
  { abbr: 'SAB', num: '12', tasks: [{ label: 'Ebook – texto', color: 'purple' }] },
  { abbr: 'DOM', num: '13', tasks: [] },
]

const RECURRENCIAS = [
  { type: 'Diário', typeColor: 'green', title: 'Daily com Robervan – 09h00' },
  { type: 'Semanal', typeColor: 'orange', title: 'Revisão de automações ativas – Sex' },
  { type: 'Mensal', typeColor: 'purple', title: 'Relatório de performance dos clientes' },
]

const TODAY_NUM = '07'
const TABS = ['Semana', 'Mês', 'Lista']

export default function Agenda() {
  const [activeTab, setActiveTab] = useState('Semana')

  return (
    <>
      <div className="tabs" style={{ marginBottom: '16px' }}>
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

      <div className="week-grid">
        {DAYS.map(day => (
          <div key={day.abbr} className="day-col">
            <div className={`day-header${day.num === TODAY_NUM ? ' today' : ''}`}>{day.abbr}</div>
            <div className={`day-num${day.num === TODAY_NUM ? ' today' : ''}`}>{day.num}</div>
            {day.tasks.map((task, i) => (
              <div key={i} className={`day-task${task.color !== 'green' ? ` ${task.color}` : ''}`}>
                {task.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">📌 Recorrências</span>
          <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 10px' }}>+ Rotina</button>
        </div>
        {RECURRENCIAS.map((r, i) => (
          <div key={i} className="task-item">
            <TaskTag label={r.type} color={r.typeColor} />
            <div className="task-text">{r.title}</div>
          </div>
        ))}
      </div>
    </>
  )
}
