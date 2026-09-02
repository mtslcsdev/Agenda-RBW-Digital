import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { useMatch, useNavigate } from 'react-router-dom'
import { useApp, PRIORITY_COLORS, COLUMN_COLORS, corDeTexto, formatDuration } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import CommentSection from '../components/ui/CommentSection'

// O TipTap é pesado (~380 kB). Carregar sob demanda mantém o quadro leve —
// o editor só chega quando alguém abre um card.
const RichEditor = lazy(() => import('../components/ui/RichEditor'))

function dataRelativa(iso) {
  if (!iso) return null
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const d = new Date(iso + 'T00:00:00')
  const dias = Math.round((d - hoje) / 86400000)
  if (dias === 0)  return { label: 'Hoje', atrasada: false }
  if (dias === 1)  return { label: 'Amanhã', atrasada: false }
  if (dias === -1) return { label: 'Ontem', atrasada: true }
  if (dias > 1)    return { label: `Em ${dias} dias`, atrasada: false }
  return { label: `Há ${Math.abs(dias)} dias`, atrasada: true }
}

// ── Checklist ──────────────────────────────────────────────────

function Checklist({ taskId }) {
  const { getChecklist, checklistProgress, addChecklistItem, toggleChecklistItem, deleteChecklistItem } = useApp()
  const { canEdit } = usePermission()
  const [texto, setTexto] = useState('')
  const itens = getChecklist(taskId)
  const prog = checklistProgress(taskId)

  function adicionar(e) {
    e.preventDefault()
    if (!texto.trim()) return
    addChecklistItem(taskId, texto)
    setTexto('')
  }

  return (
    <section style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <strong style={rotulo}>SUBTAREFAS</strong>
        {prog && (
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
            {prog.feitos}/{prog.total}
          </span>
        )}
      </div>

      {prog && (
        <div style={{
          height: '6px', borderRadius: '3px', background: 'var(--surface2)',
          overflow: 'hidden', marginBottom: '10px',
        }}>
          <div style={{
            height: '100%', width: `${prog.pct}%`, background: 'var(--accent)',
            transition: 'width .2s ease',
          }} />
        </div>
      )}

      {itens.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
          <input
            type="checkbox"
            checked={item.done}
            disabled={!canEdit}
            onChange={() => toggleChecklistItem(taskId, item.id)}
            style={{ cursor: canEdit ? 'pointer' : 'not-allowed', flexShrink: 0 }}
          />
          <span style={{
            flex: 1, fontSize: '13px',
            textDecoration: item.done ? 'line-through' : 'none',
            color: item.done ? 'var(--text3)' : 'var(--text)',
          }}>
            {item.text}
          </span>
          {canEdit && (
            <button
              className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', color: 'var(--red)' }}
              onClick={() => deleteChecklistItem(taskId, item.id)}
              title="Remover"
            >✕</button>
          )}
        </div>
      ))}

      {canEdit && (
        <form onSubmit={adicionar} style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Adicionar subtarefa"
            style={{
              flex: 1, fontSize: '12px', padding: '6px 8px',
              border: '1px solid var(--border)', borderRadius: '6px',
              background: 'var(--surface2)', color: 'var(--text)',
            }}
          />
          <button type="submit" className="btn btn-ghost" style={{ fontSize: '11px' }}>Adicionar</button>
        </form>
      )}
    </section>
  )
}

// ── Etiquetas ──────────────────────────────────────────────────

function Etiquetas({ taskId }) {
  const { labels, getTaskLabels, toggleTaskLabel, addLabel, deleteLabel } = useApp()
  const { canEdit } = usePermission()
  const [aberto, setAberto] = useState(false)
  const [nova, setNova] = useState('')
  const [cor, setCor] = useState(COLUMN_COLORS[0])
  const [erro, setErro] = useState('')
  const doCard = getTaskLabels(taskId)

  async function criar() {
    const res = await addLabel(nova, cor)
    if (!res.ok) { setErro(res.error); return }
    toggleTaskLabel(taskId, res.label.id)
    setNova(''); setErro('')
  }

  return (
    <section style={{ marginBottom: '22px' }}>
      <strong style={{ ...rotulo, display: 'block', marginBottom: '8px' }}>ETIQUETAS</strong>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {doCard.map(l => (
          <span key={l.id} style={{
            fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '10px',
            background: l.color, color: corDeTexto(l.color),
          }}>{l.name}</span>
        ))}
        {!doCard.length && <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Nenhuma</span>}
        {canEdit && (
          <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 8px' }}
            onClick={() => setAberto(a => !a)}>{aberto ? 'Fechar' : '+ Editar'}</button>
        )}
      </div>

      {aberto && canEdit && (
        <div style={{
          marginTop: '10px', padding: '10px', border: '1px solid var(--border)',
          borderRadius: '8px', background: 'var(--surface2)',
        }}>
          {labels.map(l => {
            const marcada = doCard.some(d => d.id === l.id)
            return (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
                <input type="checkbox" checked={marcada}
                  onChange={() => toggleTaskLabel(taskId, l.id)}
                  style={{ cursor: 'pointer' }} />
                <span style={{
                  fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                  borderRadius: '10px', background: l.color, color: corDeTexto(l.color), flex: 1,
                }}>{l.name}</span>
                <button className="btn-icon"
                  style={{ width: '20px', height: '20px', fontSize: '10px', color: 'var(--red)' }}
                  onClick={() => deleteLabel(l.id)} title="Excluir etiqueta">✕</button>
              </div>
            )
          })}

          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {COLUMN_COLORS.map(c => (
              <button key={c} onClick={() => setCor(c)} title="Cor da etiqueta"
                style={{
                  width: '16px', height: '16px', borderRadius: '50%', background: c,
                  border: cor === c ? '2px solid var(--text)' : '1px solid var(--border)',
                  cursor: 'pointer', padding: 0,
                }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <input value={nova} onChange={e => { setNova(e.target.value); setErro('') }}
              placeholder="Nova etiqueta"
              onKeyDown={e => e.key === 'Enter' && criar()}
              style={{
                flex: 1, fontSize: '12px', padding: '5px 8px',
                border: `1px solid ${erro ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: '6px', background: 'var(--surface)', color: 'var(--text)',
              }} />
            <button className="btn btn-primary" style={{ fontSize: '11px' }} onClick={criar}>Criar</button>
          </div>
          {erro && <div style={{ fontSize: '10px', color: 'var(--red)', marginTop: '4px' }}>{erro}</div>}
        </div>
      )}
    </section>
  )
}

// ── Detalhe ────────────────────────────────────────────────────

const rotulo = { fontSize: '10px', letterSpacing: '.5px', color: 'var(--text3)', fontWeight: 700 }
const campo = {
  width: '100%', fontSize: '12px', padding: '5px 8px', marginTop: '4px',
  border: '1px solid var(--border)', borderRadius: '6px',
  background: 'var(--surface2)', color: 'var(--text)',
}

export default function TaskDetail() {
  const match = useMatch('/tarefas/:id')
  const navigate = useNavigate()
  const { allTasks, allColumns, clients, editTask, activityLog, getTaskTotalTime } = useApp()
  const { effectiveUser, team } = useAuth()
  const { canEdit } = usePermission()
  const overlayRef = useRef()

  const id = match?.params?.id
  const task = useMemo(
    () => allTasks.find(t => String(t.id) === String(id)),
    [allTasks, id]
  )

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')

  useEffect(() => {
    if (task) { setTitulo(task.title); setDescricao(task.notes || '') }
  }, [task?.id])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') fechar() }
    if (match) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [match])

  if (!match) return null

  function fechar() { navigate('/tarefas') }

  if (!task) {
    return (
      <div ref={overlayRef} className="modal-overlay open"
        onClick={e => e.target === overlayRef.current && fechar()}>
        <div className="modal" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '14px' }}>
            Tarefa não encontrada. Ela pode ter sido removida.
          </div>
          <button className="btn btn-primary" onClick={fechar}>Voltar ao quadro</button>
        </div>
      </div>
    )
  }

  // O card aberto pode ser de outro quadro (link direto, busca), então as
  // opções de coluna vêm do quadro da própria tarefa.
  const columns = allColumns.filter(c => c.boardId === task.boardId)
  const rel = dataRelativa(task.date)
  const historico = activityLog.filter(a => a.entityTitle === task.title).slice(0, 8)
  const tempo = getTaskTotalTime(task.id)

  function salvar(patch) { editTask(task.id, patch, effectiveUser) }

  return (
    <div ref={overlayRef} className="modal-overlay open"
      onClick={e => e.target === overlayRef.current && fechar()}>
      <div className="modal" style={{ maxWidth: '780px', width: '100%' }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
          <input
            value={titulo}
            disabled={!canEdit}
            onChange={e => setTitulo(e.target.value)}
            onBlur={() => titulo.trim() && titulo !== task.title && salvar({ title: titulo.trim() })}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            style={{
              flex: 1, fontSize: '17px', fontWeight: 700, padding: '4px 6px',
              border: '1px solid transparent', borderRadius: '6px',
              background: 'transparent', color: 'var(--text)',
            }}
          />
          <button className="btn-icon" style={{ width: '30px', height: '30px' }}
            onClick={fechar} title="Fechar">✕</button>
        </div>

        <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
          {/* Coluna principal */}
          <div style={{ flex: '1 1 380px', minWidth: 0 }}>
            <Etiquetas taskId={task.id} />

            <section style={{ marginBottom: '22px' }}>
              <strong style={{ ...rotulo, display: 'block', marginBottom: '8px' }}>DESCRIÇÃO</strong>
              <Suspense fallback={
                <div style={{ fontSize: '12px', color: 'var(--text3)', padding: '10px' }}>
                  Carregando editor…
                </div>
              }>
                <RichEditor
                  value={descricao}
                  onChange={setDescricao}
                  placeholder="Detalhes, links, critérios de aceite…"
                />
              </Suspense>
              {canEdit && descricao !== (task.notes || '') && (
                <button className="btn btn-primary" style={{ fontSize: '11px', marginTop: '8px' }}
                  onClick={() => salvar({ notes: descricao })}>Salvar descrição</button>
              )}
            </section>

            <Checklist taskId={task.id} />

            <section>
              <strong style={{ ...rotulo, display: 'block', marginBottom: '8px' }}>COMENTÁRIOS</strong>
              <CommentSection taskId={task.id} />
            </section>
          </div>

          {/* Coluna lateral */}
          <div style={{ flex: '0 1 230px', minWidth: '200px' }}>
            <div style={{ marginBottom: '14px' }}>
              <strong style={rotulo}>COLUNA</strong>
              <select
                value={task.columnId ?? ''}
                disabled={!canEdit}
                onChange={e => {
                  const cid = Number(e.target.value)
                  salvar({ columnId: cid, done: columns.find(c => c.id === cid)?.isDone || false })
                }}
                style={campo}
              >
                {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <strong style={rotulo}>RESPONSÁVEL</strong>
              <select
                value={task.assignee_id || ''}
                disabled={!canEdit}
                onChange={e => salvar({
                  assignee_id: e.target.value || null,
                  assigneeName: team.find(u => u.id === e.target.value)?.name || '',
                })}
                style={campo}
              >
                <option value="">Ninguém</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <strong style={rotulo}>PRAZO</strong>
              <input type="date" value={task.date || ''} disabled={!canEdit}
                onChange={e => salvar({ date: e.target.value || null })} style={campo} />
              {rel && (
                <div style={{
                  fontSize: '11px', marginTop: '4px',
                  color: rel.atrasada && !task.done ? 'var(--red)' : 'var(--text3)',
                  fontWeight: rel.atrasada && !task.done ? 600 : 400,
                }}>
                  {rel.atrasada && !task.done ? '⚠️ ' : '📅 '}{rel.label}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <strong style={rotulo}>PRIORIDADE</strong>
              <select value={task.priority || 'Normal'} disabled={!canEdit}
                onChange={e => salvar({ priority: e.target.value })} style={campo}>
                {Object.keys(PRIORITY_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <strong style={rotulo}>CLIENTE</strong>
              <select
                value={task.client_id ? String(task.client_id) : (task.client || '')}
                disabled={!canEdit}
                onChange={e => {
                  const v = e.target.value
                  const id = Number(v)
                  salvar(Number.isFinite(id) && id > 0
                    ? { client_id: id, client: '' }
                    : { client_id: null, client: v })
                }}
                style={campo}
              >
                <option value="">Nenhum</option>
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                <option value="Pessoal">Pessoal</option>
              </select>
            </div>

            {tempo > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <strong style={rotulo}>TEMPO REGISTRADO</strong>
                <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                  {formatDuration(tempo)}
                </div>
              </div>
            )}

            {historico.length > 0 && (
              <div>
                <strong style={{ ...rotulo, display: 'block', marginBottom: '6px' }}>HISTÓRICO</strong>
                {historico.map(h => (
                  <div key={h.id} style={{ fontSize: '11px', color: 'var(--text3)', padding: '3px 0', lineHeight: 1.4 }}>
                    <span style={{ color: h.userColor, fontWeight: 600 }}>{h.userName}</span> {h.action}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
