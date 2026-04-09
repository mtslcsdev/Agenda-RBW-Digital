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

const TABS = ['Semana', 'Lista', 'Mês']
const MONTH_DAY_ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)

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

      {activeTab === 'Mês' && (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + monthOffset
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startPad = firstDay.getDay() // 0=Sun
        const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

        const cells = []
        for (let i = 0; i < startPad; i++) cells.push(null)
        for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d)
        while (cells.length % 7 !== 0) cells.push(null)

        const todayStr = toISO(new Date())
        const getISO = (d) => {
          const dt = new Date(year, month, d)
          return toISO(dt)
        }

        const selectedTasks = selectedDay ? tasks.filter(t => t.date === getISO(selectedDay)) : []

        return (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <button className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={() => { setMonthOffset(o => o - 1); setSelectedDay(null) }}>←</button>
              <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>{monthName}</span>
              <button className="btn btn-ghost" style={{ padding: '5px 10px' }} onClick={() => { setMonthOffset(o => o + 1); setSelectedDay(null) }}>→</button>
              {monthOffset !== 0 && <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => { setMonthOffset(0); setSelectedDay(null) }}>Hoje</button>}
            </div>
            <div className="calendar-grid">
              {MONTH_DAY_ABBRS.map(d => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} className="calendar-cell empty" />
                const iso = getISO(day)
                const dayTasks = tasks.filter(t => t.date === iso)
                const isToday = iso === todayStr
                const isSelected = selectedDay === day && monthOffset === 0 ? iso === getISO(selectedDay) : selectedDay === day
                return (
                  <div
                    key={day}
                    className={`calendar-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  >
                    <span className="calendar-day-num">{day}</span>
                    <div className="calendar-dots">
                      {dayTasks.slice(0, 3).map(t => (
                        <span
                          key={t.id}
                          className={`calendar-dot${t.done ? ' done' : ''}`}
                          style={{ background: t.tagColor === 'orange' ? 'var(--accent2)' : t.tagColor === 'purple' ? 'var(--accent3)' : t.tagColor === 'red' ? 'var(--red)' : t.tagColor === 'yellow' ? 'var(--yellow)' : 'var(--accent)' }}
                          title={t.title}
                        />
                      ))}
                      {dayTasks.length > 3 && <span style={{ fontSize: '9px', color: 'var(--text3)' }}>+{dayTasks.length - 3}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            {selectedDay && (
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="card-header">
                  <span className="card-title">📋 Tarefas — dia {selectedDay}</span>
                </div>
                {selectedTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text3)', fontSize: '12px' }}>Nenhuma tarefa neste dia</div>
                ) : selectedTasks.map(t => (
                  <div key={t.id} className="task-item">
                    <div className={`task-check${t.done ? ' done' : ''}`} onClick={() => toggleTask(t.id)}>{t.done ? '✓' : ''}</div>
                    <span className={`task-text${t.done ? ' done' : ''}`}>{t.title}</span>
                    {t.tag && <TaskTag label={t.tag} color={t.tagColor} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

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
