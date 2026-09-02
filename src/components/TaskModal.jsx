import { useEffect, useRef, useState } from 'react'
import { useApp, TAG_OPTIONS, TAG_COLORS } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import CommentSection from './ui/CommentSection'

const PRIORITY_COLORS = { Normal: 'green', Alta: 'orange', Urgente: 'red' }

function toInputDate(iso) {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return ''
}

// O select de cliente devolve o id de um cliente real, a categoria "Pessoal"
// ou vazio. Só o id é uma ligação de verdade; o resto continua como texto.
function resolverCliente(valor) {
  if (!valor) return { client_id: null, client: '' }
  const id = Number(valor)
  if (Number.isFinite(id) && id > 0) return { client_id: id, client: '' }
  return { client_id: null, client: String(valor) }
}

export default function TaskModal({ open, onClose, editingTask = null, preset = null }) {
  const { clients, addTask, editTask, columns } = useApp()
  const { profile, team, effectiveUser } = useAuth()
  const { canEdit } = usePermission()
  const overlayRef = useRef()
  const [selectedTag, setSelectedTag] = useState('N8N')
  const isEdit = !!editingTask

  useEffect(() => {
    if (editingTask) setSelectedTag(editingTask.tag || 'N8N')
    else setSelectedTag('N8N')
  }, [editingTask, open])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    // "Concluída" deixou de ser um nome fixo: é a coluna marcada como conclusão.
    const columnId = Number(fd.get('columnId')) || columns[0]?.id || null
    const coluna = columns.find(c => c.id === columnId)
    const data = {
      title: fd.get('title'),
      ...resolverCliente(fd.get('client')),
      date: fd.get('date') || null,
      priority: fd.get('priority'),
      notes: fd.get('notes'),
      tag: selectedTag,
      tagColor: TAG_COLORS[selectedTag] || 'green',
      columnId,
      done: coluna?.isDone || false,
      // Grava o id do responsável; o nome vai junto só para exibição rápida
      // no card, sem precisar cruzar com a lista da equipe a cada render.
      assignee_id: fd.get('assignee') || null,
      assigneeName: team.find(u => u.id === fd.get('assignee'))?.name || '',
    }
    if (isEdit) editTask(editingTask.id, data, effectiveUser)
    else addTask(data, effectiveUser)
    onClose()
    e.target.reset()
  }

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={e => e.target === overlayRef.current && onClose()}
    >
      <div className="modal">
        <h3>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>TÍTULO</label>
            <input name="title" placeholder="Ex: Configurar webhook Neoprop" required
              defaultValue={editingTask?.title || ''} key={editingTask?.id ?? 'new-title'} />
          </div>
          <div className="form-group">
            <label>TAG</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TAG_OPTIONS.map(tag => (
                <button key={tag} type="button" className={`task-tag tag-${TAG_COLORS[tag]}`}
                  style={{ cursor: 'pointer', border: selectedTag === tag ? '2px solid currentColor' : '2px solid transparent', padding: '3px 9px' }}
                  onClick={() => setSelectedTag(tag)}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>CLIENTE / PROJETO</label>
              {/* O valor gravado é o id do cliente; "Pessoal" é uma categoria,
                  não um cliente, então continua sendo guardado como texto. */}
              <select
                name="client"
                defaultValue={editingTask?.client_id ? String(editingTask.client_id) : (editingTask?.client || '')}
                key={editingTask?.id ?? 'new-client'}
              >
                <option value="">— Nenhum —</option>
                {clients.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                <option value="Pessoal">Pessoal</option>
              </select>
            </div>
            <div className="form-group">
              <label>RESPONSÁVEL</label>
              <select name="assignee" defaultValue={editingTask?.assignee_id || ''} key={editingTask?.id ?? 'new-assignee'}>
                <option value="">— Ninguém —</option>
                {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>DATA</label>
              <input name="date" type="date" defaultValue={toInputDate(editingTask?.date)} key={editingTask?.id ?? 'new-date'} />
            </div>
            <div className="form-group">
              <label>PRIORIDADE</label>
              <select name="priority" defaultValue={editingTask?.priority || 'Normal'} key={editingTask?.id ?? 'new-priority'}>
                {Object.entries(PRIORITY_COLORS).map(([p]) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>COLUNA DO QUADRO</label>
            <select
              name="columnId"
              defaultValue={editingTask?.columnId ?? preset?.columnId ?? columns[0]?.id ?? ''}
              key={editingTask?.id ?? `new-col-${preset?.columnId ?? ''}`}
            >
              {columns.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>NOTAS</label>
            <textarea name="notes" placeholder="Detalhes, links, referências..."
              defaultValue={editingTask?.notes || ''} key={editingTask?.id ?? 'new-notes'} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            {canEdit && <button type="submit" className="btn btn-primary">{isEdit ? 'Salvar' : 'Criar'}</button>}
          </div>
        </form>

        {isEdit && <CommentSection taskId={editingTask?.id} />}
      </div>
    </div>
  )
}
