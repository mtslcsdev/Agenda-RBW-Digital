import { useState } from 'react'
import { useApp } from '../context/AppContext'
import TaskTag from '../components/ui/TaskTag'

const DAY_ABBRS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
const TAG_COLOR_CLASS = { green: '', orange: 'orange', purple: 'purple', red: 'red', yellow: 'orange' }

const RECURRENCIAS = [
  { type: 'Diário', typeColor: 'green', title: 'Daily com Robervan – 09h00' },
  { type: 'Semanal', typeColor: 'orange', title: 'Revisão de automações ativas – Sex' },
  { type: 'Mensal', typeColor: 'purple', title: 'Relatório de performance dos clientes' },
]

const TABS = ['Semana', 'Lista']

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toISO(date) {
  return date.toISOString().slice(0, 10)
}

function formatMonthRange(monday) {
  const sunday = addDays(monday, 6)
  const opts = { month: 'long' }
  const mStart = monday.toLocaleDateString('pt-BR', opts)
  const mEnd = sunday.toLocaleDateString('pt-BR', opts)
  const year = monday.getFullYear()
  return mStart === mEnd
    ? `${mStart} ${year}`
    : `${mStart} – ${mEnd} ${year}`
}

export default function Agenda() {
  const { tasks, toggleTask } = useApp()
  const [activeTab, setActiveTab] = useState('Semana')
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week

  const today = toISO(new Date())
  const baseMonday = getMondayOf(new Date())
  const monday = addDays(baseMonday, weekOffset * 7)

  const days = DAY_ABBRS.map((abbr, i) => {
    const date = addDays(monday, i)
    const iso = toISO(date)
    return {
      abbr,
      iso,
      num: String(date.getDate()).padStart(2, '0'),
      isToday: iso === today,
      tasks: tasks.filter(t => t.date === iso),
    }
  })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
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

        {/* Week navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '13px' }} onClick={() => setWeekOffset(o => o - 1)}>
            ←
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text2)', minWidth: '160px', textAlign: 'center' }}>
            {weekOffset === 0 ? 'Semana atual' : formatMonthRange(monday)}
          </span>
          <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '13px' }} onClick={() => setWeekOffset(o => o + 1)}>
            →
          </button>
          {weekOffset !== 0 && (
            <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setWeekOffset(0)}>
              Hoje
            </button>
          )}
        </div>
      </div>

      {activeTab === 'Semana' && (
        <div className="week-grid">
          {days.map(day => (
            <div key={day.abbr} className="day-col">
              <div className={`day-header${day.isToday ? ' today' : ''}`}>{day.abbr}</div>
              <div className={`day-num${day.isToday ? ' today' : ''}`}>{day.num}</div>
              {day.tasks.map(task => (
                <div
                  key={task.id}
                  className={`day-task${TAG_COLOR_CLASS[task.tagColor] ? ' ' + TAG_COLOR_CLASS[task.tagColor] : ''}`}
                  style={task.done ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}
                  onClick={() => toggleTask(task.id)}
                  title={task.title}
                >
                  {task.title.slice(0, 20)}{task.title.length > 20 ? '…' : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Lista' && (
        <div className="card" style={{ marginBottom: '16px' }}>
          {days.flatMap(day => day.tasks.map(task => ({
            ...task,
            dayLabel: day.abbr + ' ' + day.num,
            isToday: day.isToday,
          }))).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', fontSize: '13px' }}>
              Nenhuma tarefa nesta semana
            </div>
          ) : (
            days.flatMap(day => day.tasks.map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '11px', color: day.isToday ? 'var(--accent)' : 'var(--text3)', fontFamily: 'DM Mono, monospace', width: '56px', flexShrink: 0, fontWeight: day.isToday ? 600 : 400 }}>
                  {day.abbr} {day.num}
                </span>
                <div
                  className={`task-check${task.done ? ' done' : ''}`}
                  style={{ flexShrink: 0 }}
                  onClick={() => toggleTask(task.id)}
                >
                  {task.done ? '✓' : ''}
                </div>
                <span style={{ flex: 1, fontSize: '12px', color: 'var(--text)', textDecoration: task.done ? 'line-through' : undefined, opacity: task.done ? 0.5 : 1 }}>
                  {task.title}
                </span>
                {task.tag && <TaskTag label={task.tag} color={task.tagColor} />}
              </div>
            )))
          )}
        </div>
      )}

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
