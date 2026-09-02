import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useApp, PRIORITY_COLORS, COLUMN_COLORS } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { usePermission } from '../../hooks/usePermission'
import TaskTag from './TaskTag'

const POSITION_GAP = 1000
// Abaixo disso os vizinhos estão próximos demais para caber outro valor entre
// eles — em vez de arriscar perder precisão, renumeramos a coluna inteira.
const GAP_MINIMO = 0.0001

// ── Helpers ────────────────────────────────────────────────────

function getRelativeDate(iso) {
  if (!iso) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(iso + 'T00:00:00')
  const diff = Math.round((date - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return { label: 'Hoje', overdue: false }
  if (diff === 1) return { label: 'Amanhã', overdue: false }
  if (diff === -1) return { label: 'Ontem', overdue: true }
  if (diff > 1) return { label: `Em ${diff} dias`, overdue: false }
  return { label: `Há ${Math.abs(diff)} dias`, overdue: true }
}

// ── Card ───────────────────────────────────────────────────────

function CardContent({ task, onEdit, showActions = true, onOpen }) {
  const { deleteTask, getTaskLabels, checklistProgress } = useApp()
  const { canEdit, canDelete } = usePermission()
  const [hovered, setHovered] = useState(false)
  const rel = getRelativeDate(task.date)
  const priorityColor = PRIORITY_COLORS[task.priority]
  const etiquetas = getTaskLabels(task.id)
  const prog = checklistProgress(task.id)

  return (
    <div
      className="kanban-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      style={onOpen ? { cursor: 'pointer' } : undefined}
    >
      {priorityColor && (
        <div className="kanban-priority-bar" style={{ background: priorityColor }} />
      )}
      <div className="kanban-card-body">
        {etiquetas.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
            {etiquetas.map(l => (
              <span key={l.id} title={l.name} style={{
                height: '6px', width: '26px', borderRadius: '3px', background: l.color,
              }} />
            ))}
          </div>
        )}
        <div className="kanban-card-title">{task.title}</div>
        {task.client && <div className="kanban-card-client">{task.client}</div>}
        <div className="kanban-card-meta">
          {prog && (
            <span style={{
              fontSize: '11px', color: prog.pct === 100 ? 'var(--accent)' : 'var(--text3)',
              fontWeight: prog.pct === 100 ? 600 : 400,
            }}>
              ☑ {prog.feitos}/{prog.total}
            </span>
          )}
          {task.tag && !etiquetas.length && <TaskTag label={task.tag} color={task.tagColor} />}
          {rel && (
            <span
              className={`kanban-date${rel.overdue && !task.done ? ' overdue' : ''}`}
              style={rel.label === 'Hoje' ? { color: 'var(--accent)', fontWeight: 600 } : undefined}
            >
              📅 {rel.label}{rel.overdue && !task.done ? ' ⚠️' : ''}
            </span>
          )}
        </div>
        {showActions && (
          <div className={`kanban-card-actions${hovered ? ' visible' : ''}`}>
            {onEdit && canEdit && (
              <button
                className="btn-icon"
                style={{ width: '24px', height: '24px', fontSize: '11px' }}
                onClick={e => { e.stopPropagation(); onEdit(task) }}
                title="Editar"
              >
                ✏️
              </button>
            )}
            {canDelete && (
              <button
                className="btn-icon"
                style={{ width: '24px', height: '24px', fontSize: '11px', color: 'var(--red)' }}
                onClick={e => { e.stopPropagation(); deleteTask(task.id) }}
                title="Excluir"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SortableCard({ task, onEdit, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(task.id) })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        touchAction: 'none',
      }}
      {...listeners}
      {...attributes}
    >
      {/* O sensor só inicia o arrasto após 8px, então um clique parado ainda
          abre o card em vez de virar arrasto. */}
      <CardContent task={task} onEdit={onEdit} onOpen={onOpen} />
    </div>
  )
}

// ── Cabeçalho da coluna (renomear, cor, mover, arquivar) ───────

function ColumnHeader({ col, count, index, total }) {
  const { updateColumn, moveColumn, archiveColumn } = useApp()
  const { canEdit } = usePermission()
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(col.label)
  const [menu, setMenu] = useState(false)
  const [erro, setErro] = useState('')

  async function salvarNome() {
    const res = await updateColumn(col.id, { label: nome })
    if (!res.ok) { setErro(res.error); return }
    setErro('')
    setEditando(false)
  }

  async function arquivar() {
    setMenu(false)
    const res = await archiveColumn(col.id)
    if (!res.ok) setErro(res.error)
  }

  if (editando) {
    return (
      <div className="kanban-col-header" style={{ gap: '6px' }}>
        <input
          value={nome}
          onChange={e => { setNome(e.target.value); setErro('') }}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter') salvarNome()
            if (e.key === 'Escape') { setEditando(false); setNome(col.label); setErro('') }
          }}
          style={{
            flex: 1, minWidth: 0, fontSize: '12px', padding: '3px 6px', fontWeight: 700,
            border: `1px solid ${erro ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: '5px', background: 'var(--surface2)', color: 'var(--text)',
          }}
        />
        <button className="btn-icon" style={{ width: '22px', height: '22px', fontSize: '11px' }}
          onClick={() => { setEditando(false); setNome(col.label); setErro('') }}>✕</button>
        <button className="btn-icon" style={{ width: '22px', height: '22px', fontSize: '11px', color: 'var(--accent)' }}
          onClick={salvarNome}>✓</button>
      </div>
    )
  }

  return (
    <div className="kanban-col-header" style={{ position: 'relative' }}>
      <span
        style={{
          width: '9px', height: '9px', borderRadius: '50%',
          background: col.color, flexShrink: 0,
        }}
      />
      <span className="kanban-col-label" style={{ flex: 1, minWidth: 0 }}>
        {col.label.toUpperCase()}
      </span>
      {col.isDone && <span title="Coluna de conclusão" style={{ fontSize: '10px' }}>🏁</span>}
      <span className="kanban-col-count">{count}</span>

      {canEdit && (
        <button
          className="btn-icon"
          style={{ width: '22px', height: '22px', fontSize: '12px', color: 'var(--text3)' }}
          onClick={() => setMenu(m => !m)}
          title="Opções da coluna"
        >
          ⋯
        </button>
      )}

      {menu && (
        <>
          {/* clique fora fecha */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenu(false)} />
          <div
            style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 11, minWidth: '190px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', padding: '6px',
            }}
          >
            <button className="btn btn-ghost" style={menuItem}
              onClick={() => { setMenu(false); setEditando(true) }}>✏️ Renomear</button>

            <div style={{ padding: '6px 8px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {COLUMN_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => { updateColumn(col.id, { color: c }); setMenu(false) }}
                  title="Mudar cor"
                  style={{
                    width: '17px', height: '17px', borderRadius: '50%', background: c,
                    border: col.color === c ? '2px solid var(--text)' : '1px solid var(--border)',
                    cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
            </div>

            <button className="btn btn-ghost" style={menuItem} disabled={index === 0}
              onClick={() => { moveColumn(col.id, index - 1); setMenu(false) }}>← Mover para a esquerda</button>
            <button className="btn btn-ghost" style={menuItem} disabled={index === total - 1}
              onClick={() => { moveColumn(col.id, index + 1); setMenu(false) }}>→ Mover para a direita</button>

            <button className="btn btn-ghost" style={menuItem}
              onClick={() => { updateColumn(col.id, { isDone: !col.isDone }); setMenu(false) }}>
              🏁 {col.isDone ? 'Não é mais conclusão' : 'Marcar como conclusão'}
            </button>

            <button className="btn btn-ghost" style={{ ...menuItem, color: 'var(--red)' }}
              onClick={arquivar}>🗄 Arquivar coluna</button>
          </div>
        </>
      )}

      {erro && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, fontSize: '10px',
          color: 'var(--red)', padding: '2px 4px',
        }}>{erro}</div>
      )}
    </div>
  )
}

const menuItem = {
  display: 'block', width: '100%', textAlign: 'left',
  fontSize: '12px', padding: '6px 8px', borderRadius: '5px',
}

// ── Coluna ─────────────────────────────────────────────────────

function Column({ col, tasks, onNew, onEdit, onOpen, index, total }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${col.id}` })
  const ids = tasks.map(t => String(t.id))

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col${isOver ? ' drag-over' : ''}`}
      style={isOver ? {
        borderColor: col.color,
        background: 'color-mix(in srgb, var(--accent) 6%, var(--surface))',
      } : undefined}
    >
      <ColumnHeader col={col} count={tasks.length} index={index} total={total} />

      <div className="kanban-col-body">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className={`kanban-empty${isOver ? ' drag-target' : ''}`}>
              {isOver ? 'Soltar aqui' : 'Nenhuma tarefa'}
            </div>
          ) : (
            tasks.map(task => (
              <SortableCard key={task.id} task={task} onEdit={onEdit}
                onOpen={() => onOpen(task)} />
            ))
          )}
        </SortableContext>
      </div>

      <button className="kanban-add-btn" onClick={() => onNew({ columnId: col.id })}>
        + Adicionar Tarefa
      </button>
    </div>
  )
}

// ── Botão de nova coluna ───────────────────────────────────────

function AddColumn() {
  const { addColumn } = useApp()
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState('')

  async function criar() {
    const res = await addColumn(nome)
    if (!res.ok) { setErro(res.error); return }
    setNome(''); setErro(''); setAberto(false)
  }

  if (!aberto) {
    return (
      <button
        className="kanban-col"
        onClick={() => setAberto(true)}
        style={{
          minHeight: '52px', height: 'fit-content', cursor: 'pointer',
          border: '1px dashed var(--border)', background: 'transparent',
          color: 'var(--text3)', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px',
        }}
      >
        + Nova coluna
      </button>
    )
  }

  return (
    <div className="kanban-col" style={{ height: 'fit-content', padding: '12px' }}>
      <input
        value={nome}
        onChange={e => { setNome(e.target.value); setErro('') }}
        placeholder="Nome da coluna"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') criar()
          if (e.key === 'Escape') { setAberto(false); setNome(''); setErro('') }
        }}
        style={{
          width: '100%', fontSize: '12px', padding: '6px 8px',
          border: `1px solid ${erro ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: '6px', background: 'var(--surface2)', color: 'var(--text)',
        }}
      />
      {erro && <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>{erro}</div>}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <button className="btn btn-ghost" style={{ fontSize: '11px', flex: 1 }}
          onClick={() => { setAberto(false); setNome(''); setErro('') }}>Cancelar</button>
        <button className="btn btn-primary" style={{ fontSize: '11px', flex: 1 }}
          onClick={criar}>Criar</button>
      </div>
    </div>
  )
}

// ── Seletor de quadros ─────────────────────────────────────────

function BoardSelector() {
  const { boards, currentBoardId, setCurrentBoard, addBoard, renameBoard, archiveBoard, clients } = useApp()
  const { canEdit } = usePermission()
  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [erro, setErro] = useState('')

  const atual = boards.find(b => b.id === currentBoardId)

  async function criar() {
    const res = await addBoard(nome, clienteId ? Number(clienteId) : null)
    if (!res.ok) { setErro(res.error); return }
    setNome(''); setClienteId(''); setErro(''); setCriando(false)
  }

  async function renomear() {
    const novo = window.prompt('Novo nome do quadro:', atual?.name || '')
    if (novo === null) return
    const res = await renameBoard(currentBoardId, novo)
    if (!res.ok) setErro(res.error)
  }

  async function arquivar() {
    if (!window.confirm(`Arquivar o quadro "${atual?.name}"? As tarefas continuam no banco, mas somem da vista.`)) return
    const res = await archiveBoard(currentBoardId)
    if (!res.ok) setErro(res.error)
  }

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text3)', marginRight: '2px' }}>Quadro:</span>
        {boards.map(b => {
          const ativo = b.id === currentBoardId
          const cliente = b.clientId ? clients.find(c => c.id === b.clientId) : null
          return (
            <button
              key={b.id}
              onClick={() => setCurrentBoard(b.id)}
              style={{
                cursor: 'pointer', padding: '5px 12px', fontSize: '12px', fontWeight: 600,
                borderRadius: '7px', fontFamily: 'inherit',
                border: `1px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
                background: ativo ? 'var(--accent-light)' : 'transparent',
                color: ativo ? 'var(--accent)' : 'var(--text2)',
              }}
            >
              {cliente ? `👤 ${b.name}` : b.name}
            </button>
          )
        })}

        {canEdit && (
          <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '5px 10px' }}
            onClick={() => setCriando(c => !c)}>{criando ? 'Cancelar' : '+ Novo quadro'}</button>
        )}
        {canEdit && atual && (
          <>
            <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '11px', color: 'var(--text3)' }}
              onClick={renomear} title="Renomear quadro">✏️</button>
            <button className="btn-icon" style={{ width: '24px', height: '24px', fontSize: '11px', color: 'var(--red)' }}
              onClick={arquivar} title="Arquivar quadro">🗄</button>
          </>
        )}
      </div>

      {criando && canEdit && (
        <div style={{
          display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center',
          padding: '10px', border: '1px solid var(--border)', borderRadius: '8px',
          background: 'var(--surface2)',
        }}>
          <input
            value={nome} autoFocus
            onChange={e => { setNome(e.target.value); setErro('') }}
            onKeyDown={e => e.key === 'Enter' && criar()}
            placeholder="Nome do quadro"
            style={{
              flex: '1 1 180px', fontSize: '12px', padding: '6px 8px',
              border: `1px solid ${erro ? 'var(--red)' : 'var(--border)'}`,
              borderRadius: '6px', background: 'var(--surface)', color: 'var(--text)',
            }}
          />
          <select
            value={clienteId}
            onChange={e => setClienteId(e.target.value)}
            style={{
              fontSize: '12px', padding: '6px 8px', border: '1px solid var(--border)',
              borderRadius: '6px', background: 'var(--surface)', color: 'var(--text)',
            }}
          >
            <option value="">Quadro interno</option>
            {clients.map(c => <option key={c.id} value={String(c.id)}>Cliente: {c.name}</option>)}
          </select>
          <button className="btn btn-primary" style={{ fontSize: '11px' }} onClick={criar}>Criar</button>
        </div>
      )}

      {erro && <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '6px' }}>{erro}</div>}
    </div>
  )
}

// ── Quadro ─────────────────────────────────────────────────────

export default function KanbanBoard({ tasks, onNew, onEdit, clientFilter, onClientFilterChange, clients }) {
  const { columns, moveTask, reorderColumn, currentBoardId, tasks: todasAsTarefas } = useApp()
  const { effectiveUser } = useAuth()
  const { canEdit } = usePermission()
  const navigate = useNavigate()
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // As tarefas já chegam filtradas pela página; aqui restringimos ao quadro
  // aberto e agrupamos por coluna. Tarefas deste quadro cuja coluna foi
  // arquivada caem na primeira, para nenhum card sumir da vista.
  const doQuadro = tasks.filter(t => t.boardId === currentBoardId)

  // Para calcular a posição de destino usamos TODAS as tarefas do quadro, não
  // só as visíveis: com um filtro ativo, medir a posição apenas entre os cards
  // à vista ignora os escondidos entre eles, e o card pularia de lugar assim
  // que o filtro fosse limpo.
  const todasDoQuadro = todasAsTarefas.filter(t => t.boardId === currentBoardId)

  function cardsDaColuna(colId, isPrimeira, lista = doQuadro) {
    return lista
      .filter(t => t.columnId === colId || (isPrimeira && !columns.some(c => c.id === t.columnId)))
      .sort((a, b) => a.position - b.position)
  }

  function handleDragStart({ active }) {
    setActiveTask(tasks.find(t => String(t.id) === active.id) || null)
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null)
    if (!over) return

    const task = tasks.find(t => String(t.id) === active.id)
    if (!task) return

    // O alvo é uma coluna vazia ou outro card
    const sobreColuna = String(over.id).startsWith('col:')
    const destColId = sobreColuna
      ? Number(String(over.id).slice(4))
      : tasks.find(t => String(t.id) === String(over.id))?.columnId
    if (destColId == null) return

    const primeiraId = columns[0]?.id
    const lista = cardsDaColuna(destColId, destColId === primeiraId, todasDoQuadro)

    // Reproduz o resultado visual do dnd-kit para achar os vizinhos finais
    let resultado
    const oldIndex = lista.findIndex(t => t.id === task.id)
    if (sobreColuna) {
      resultado = oldIndex >= 0 ? lista : [...lista, task]
    } else {
      const overIndex = lista.findIndex(t => String(t.id) === String(over.id))
      if (overIndex < 0) return
      if (oldIndex >= 0) {
        resultado = arrayMove(lista, oldIndex, overIndex)
      } else {
        resultado = [...lista]
        resultado.splice(overIndex, 0, task)
      }
    }

    const finalIdx = resultado.findIndex(t => t.id === task.id)

    // Soltou no mesmo lugar de onde saiu
    if (task.columnId === destColId && finalIdx === oldIndex) return

    const antes  = resultado[finalIdx - 1]
    const depois = resultado[finalIdx + 1]

    let novaPosicao
    if (!antes && !depois)      novaPosicao = POSITION_GAP
    else if (!antes)            novaPosicao = depois.position - POSITION_GAP
    else if (!depois)           novaPosicao = antes.position + POSITION_GAP
    else if (Math.abs(depois.position - antes.position) < GAP_MINIMO) {
      // Sem espaço entre os vizinhos: renumera a coluna inteira
      reorderColumn(destColId, resultado.map(t => t.id))
      return
    } else {
      novaPosicao = (antes.position + depois.position) / 2
    }

    moveTask(task.id, destColId, novaPosicao, effectiveUser)
  }

  return (
    <div>
      <BoardSelector />

      {/* Filtro por cliente */}
      {clients && clients.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)', marginRight: '2px' }}>Cliente:</span>
          {[{ id: '', name: 'Todos' }, ...clients, { id: 'Pessoal', name: 'Pessoal' }].map(c => {
            const valor = c.name === 'Todos' ? '' : c.name
            const ativo = clientFilter === valor
            return (
              <button
                key={c.id || 'todos'}
                className={`task-tag${ativo ? ' tag-green' : ''}`}
                style={{
                  cursor: 'pointer', padding: '4px 10px',
                  border: ativo ? '1px solid currentColor' : '1px solid var(--border)',
                  background: ativo ? undefined : 'transparent',
                  color: ativo ? undefined : 'var(--text2)',
                }}
                onClick={() => onClientFilterChange(ativo && valor ? '' : valor)}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className="kanban-board">
          {columns.map((col, i) => (
            <Column
              key={col.id}
              col={col}
              tasks={cardsDaColuna(col.id, i === 0)}
              onNew={onNew}
              onEdit={onEdit}
              onOpen={t => navigate(`/tarefas/${t.id}`)}
              index={i}
              total={columns.length}
            />
          ))}
          {canEdit && <AddColumn />}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              opacity: 0.95,
              transform: 'rotate(2deg)',
              pointerEvents: 'none',
            }}>
              <CardContent task={activeTask} onEdit={null} showActions={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
