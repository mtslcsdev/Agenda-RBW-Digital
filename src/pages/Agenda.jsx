import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from '@dnd-kit/core'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import TaskTag from '../components/ui/TaskTag'

const DAY_ABBRS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
const MONTH_DAY_ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const TABS = ['Dia', 'Semana', 'Mês', 'Lista']

// ── Datas ──────────────────────────────────────────────────────
// Importante: nada de toISOString() aqui. Ele converte para UTC, e no Brasil
// (UTC-3) isso joga a data um dia para trás — a tarefa aparecia no dia errado.
function toISO(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=domingo
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function rotuloSemana(monday) {
  const sunday = addDays(monday, 6)
  const ini = monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const fim = sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${ini} – ${fim}`
}

function rotuloDia(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

// ── Card de tarefa arrastável ──────────────────────────────────

function TarefaCard({ task, compacto = false }) {
  const navigate = useNavigate()
  const { canEdit } = usePermission()
  const { getTaskLabels } = useApp()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tarefa:${task.id}`,
    disabled: !canEdit,
  })
  const etiquetas = getTaskLabels(task.id)

  return (
    <div
      ref={setNodeRef}
      {...(canEdit ? listeners : {})}
      {...(canEdit ? attributes : {})}
      onClick={() => navigate(`/tarefas/${task.id}`)}
      title={task.title}
      style={{
        opacity: isDragging ? 0.35 : (task.done ? 0.55 : 1),
        touchAction: 'none',
        cursor: 'pointer',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${etiquetas[0]?.color || 'var(--accent)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: compacto ? '5px 7px' : '7px 9px',
        marginBottom: '5px',
        fontSize: compacto ? '11px' : '12px',
        lineHeight: 1.35,
      }}
    >
      <div style={{
        fontWeight: 600,
        textDecoration: task.done ? 'line-through' : 'none',
        color: 'var(--text)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: compacto ? 'nowrap' : 'normal',
      }}>
        {task.title}
      </div>

      {/* Cliente e responsável: é o que faz a agenda servir para reunião */}
      {(task.client || task.assigneeName) && (
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap',
          fontSize: '10px', color: 'var(--text3)', marginTop: '3px',
        }}>
          {task.client && <span>🏢 {task.client}</span>}
          {task.assigneeName && <span>👤 {task.assigneeName}</span>}
        </div>
      )}
    </div>
  )
}

// ── Célula que recebe o card ───────────────────────────────────

function DiaSolto({ iso, children, style, className, onClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: `dia:${iso}` })
  return (
    <div
      ref={setNodeRef}
      className={className}
      onClick={onClick}
      style={{
        ...style,
        ...(isOver ? {
          background: 'var(--accent-light)',
          outline: '2px solid var(--accent)',
          outlineOffset: '-2px',
        } : null),
      }}
    >
      {children}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────────

export default function Agenda() {
  const { tasks, editTask, allColumns } = useApp()
  const { effectiveUser, team } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('Semana')
  const [offset, setOffset] = useState(0)          // semanas ou meses, conforme a aba
  const [diaOffset, setDiaOffset] = useState(0)
  const [diaSelecionado, setDiaSelecionado] = useState(null) // ISO
  const [filtroResp, setFiltroResp] = useState('')
  const [arrastando, setArrastando] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const hoje = toISO(new Date())
  const monday = addDays(getMondayOf(new Date()), offset * 7)
  const diaAtual = addDays(new Date(), diaOffset)

  // Um filtro por pessoa é o que permite cada um ver a própria semana
  const visiveis = filtroResp
    ? tasks.filter(t => t.assignee_id === filtroResp)
    : tasks

  const doDia = iso => visiveis.filter(t => t.date === iso)

  const ehConcluida = t =>
    t.done || allColumns.find(c => c.id === t.columnId)?.isDone

  function handleDragEnd({ active, over }) {
    setArrastando(null)
    if (!over) return

    const taskId = String(active.id).replace('tarefa:', '')
    const novoISO = String(over.id).replace('dia:', '')
    const task = tasks.find(t => String(t.id) === taskId)
    if (!task || task.date === novoISO) return

    // Arrastar entre dias reagenda a tarefa
    editTask(task.id, { date: novoISO }, effectiveUser)
  }

  const semTarefas = (
    <div style={{ fontSize: '11px', color: 'var(--text3)', padding: '8px 4px', textAlign: 'center' }}>
      —
    </div>
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        const id = String(active.id).replace('tarefa:', '')
        setArrastando(tasks.find(t => String(t.id) === id) || null)
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setArrastando(null)}
    >
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {TABS.map(tab => (
            <div
              key={tab}
              className={`tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => { setActiveTab(tab); setDiaSelecionado(null) }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Filtro por responsável */}
        {team && team.length > 0 && (
          <select
            value={filtroResp}
            onChange={e => setFiltroResp(e.target.value)}
            style={{
              fontSize: '12px', padding: '5px 10px', borderRadius: '7px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: filtroResp ? 'var(--accent)' : 'var(--text2)',
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="">Todos da equipe</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        {/* Navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <button className="btn btn-ghost" style={{ padding: '5px 10px' }}
            onClick={() => activeTab === 'Dia' ? setDiaOffset(o => o - 1) : setOffset(o => o - 1)}>←</button>
          <span style={{ fontSize: '12px', color: 'var(--text2)', minWidth: '190px', textAlign: 'center', textTransform: 'capitalize' }}>
            {activeTab === 'Dia'
              ? (diaOffset === 0 ? 'Hoje' : rotuloDia(diaAtual))
              : activeTab === 'Mês'
                ? new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1)
                    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                : (offset === 0 ? 'Semana atual' : rotuloSemana(monday))}
          </span>
          <button className="btn btn-ghost" style={{ padding: '5px 10px' }}
            onClick={() => activeTab === 'Dia' ? setDiaOffset(o => o + 1) : setOffset(o => o + 1)}>→</button>
          {((activeTab === 'Dia' && diaOffset !== 0) || (activeTab !== 'Dia' && offset !== 0)) && (
            <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }}
              onClick={() => { setOffset(0); setDiaOffset(0); setDiaSelecionado(null) }}>Hoje</button>
          )}
        </div>
      </div>

      {/* ── DIA ── */}
      {activeTab === 'Dia' && (() => {
        const iso = toISO(diaAtual)
        const lista = doDia(iso)
        return (
          <DiaSolto iso={iso} className="card" style={{ minHeight: '260px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', textTransform: 'capitalize' }}>
              {rotuloDia(diaAtual)}
              {iso === hoje && <span style={{ color: 'var(--accent)', marginLeft: '8px', fontSize: '11px' }}>• hoje</span>}
            </div>
            {lista.length === 0
              ? <div style={{ color: 'var(--text3)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                  Nenhuma tarefa neste dia. Arraste uma tarefa de outro dia para cá.
                </div>
              : lista.map(t => <TarefaCard key={t.id} task={t} />)}
          </DiaSolto>
        )
      })()}

      {/* ── SEMANA ── */}
      {activeTab === 'Semana' && (
        <div className="week-grid">
          {DAY_ABBRS.map((abbr, i) => {
            const date = addDays(monday, i)
            const iso = toISO(date)
            const isToday = iso === hoje
            const lista = doDia(iso)
            return (
              <DiaSolto
                key={abbr}
                iso={iso}
                className="day-col"
                style={{ minHeight: '150px', borderRadius: 'var(--radius-sm)' }}
              >
                <div className={`day-header${isToday ? ' today' : ''}`}>{abbr}</div>
                <div className={`day-num${isToday ? ' today' : ''}`}>
                  {String(date.getDate()).padStart(2, '0')}
                </div>
                {lista.length === 0 ? semTarefas : lista.map(t => (
                  <TarefaCard key={t.id} task={t} compacto />
                ))}
              </DiaSolto>
            )
          })}
        </div>
      )}

      {/* ── MÊS ── */}
      {activeTab === 'Mês' && (() => {
        const base = new Date()
        // O mês segue o mesmo `offset` da navegação, então avançar/voltar
        // funciona igual nas duas visões.
        const primeiro = new Date(base.getFullYear(), base.getMonth() + offset, 1)
        const ultimo = new Date(base.getFullYear(), base.getMonth() + offset + 1, 0)
        const pad = primeiro.getDay()

        const celulas = []
        for (let i = 0; i < pad; i++) celulas.push(null)
        for (let d = 1; d <= ultimo.getDate(); d++) celulas.push(d)
        while (celulas.length % 7 !== 0) celulas.push(null)

        const isoDoDia = d => toISO(new Date(primeiro.getFullYear(), primeiro.getMonth(), d))
        const tarefasSelecionadas = diaSelecionado ? doDia(diaSelecionado) : []

        return (
          <div style={{ marginBottom: '16px' }}>
            <div className="calendar-grid">
              {MONTH_DAY_ABBRS.map(d => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}
              {celulas.map((dia, i) => {
                if (!dia) return <div key={`pad-${i}`} className="calendar-cell empty" />
                const iso = isoDoDia(dia)
                const lista = doDia(iso)
                // Comparar pelo ISO, e não pelo número do dia: assim trocar de
                // mês não deixa "o dia 5 do mês anterior" selecionado.
                const selecionado = diaSelecionado === iso
                return (
                  <DiaSolto
                    key={iso}
                    iso={iso}
                    className={`calendar-cell${iso === hoje ? ' today' : ''}${selecionado ? ' selected' : ''}`}
                    onClick={() => setDiaSelecionado(selecionado ? null : iso)}
                  >
                    <span className="calendar-day-num">{dia}</span>
                    <div className="calendar-dots">
                      {lista.slice(0, 4).map(t => (
                        <span
                          key={t.id}
                          className={`calendar-dot${ehConcluida(t) ? ' done' : ''}`}
                          title={t.title}
                        />
                      ))}
                      {lista.length > 4 && (
                        <span style={{ fontSize: '9px', color: 'var(--text3)' }}>+{lista.length - 4}</span>
                      )}
                    </div>
                  </DiaSolto>
                )
              })}
            </div>

            {diaSelecionado && (
              <div className="card" style={{ marginTop: '12px' }}>
                <div className="card-header">
                  <span className="card-title">
                    📋 {new Date(diaSelecionado + 'T00:00:00').toLocaleDateString('pt-BR', {
                      weekday: 'long', day: '2-digit', month: 'long',
                    })}
                  </span>
                </div>
                {tarefasSelecionadas.length === 0
                  ? <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text3)', fontSize: '12px' }}>
                      Nenhuma tarefa neste dia
                    </div>
                  : tarefasSelecionadas.map(t => <TarefaCard key={t.id} task={t} />)}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── LISTA ── */}
      {activeTab === 'Lista' && (
        <div className="card">
          {(() => {
            const linhas = DAY_ABBRS.flatMap((abbr, i) => {
              const date = addDays(monday, i)
              const iso = toISO(date)
              return doDia(iso).map(t => ({ t, abbr, iso, num: String(date.getDate()).padStart(2, '0') }))
            })
            if (!linhas.length) {
              return (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', fontSize: '13px' }}>
                  Nenhuma tarefa nesta semana
                </div>
              )
            }
            return linhas.map(({ t, abbr, iso, num }) => (
              <div
                key={t.id}
                onClick={() => navigate(`/tarefas/${t.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                }}
              >
                <span style={{
                  fontSize: '11px', width: '58px', flexShrink: 0, fontFamily: 'DM Mono, monospace',
                  color: iso === hoje ? 'var(--accent)' : 'var(--text3)',
                  fontWeight: iso === hoje ? 600 : 400,
                }}>
                  {abbr} {num}
                </span>
                <span style={{
                  flex: 1, fontSize: '12.5px',
                  textDecoration: ehConcluida(t) ? 'line-through' : 'none',
                  opacity: ehConcluida(t) ? 0.55 : 1,
                }}>
                  {t.title}
                </span>
                {t.client && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>{t.client}</span>}
                {t.assigneeName && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>👤 {t.assigneeName}</span>}
                {t.tag && <TaskTag label={t.tag} color={t.tagColor} />}
              </div>
            ))
          })()}
        </div>
      )}

      <DragOverlay>
        {arrastando ? (
          <div style={{ transform: 'rotate(2deg)', boxShadow: 'var(--shadow-md)', pointerEvents: 'none' }}>
            <TarefaCard task={arrastando} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
