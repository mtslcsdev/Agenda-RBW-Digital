import { useEffect, useRef, useState } from 'react'
import { useApp, TAG_OPTIONS, TAG_COLORS } from '../context/AppContext'

const PRIORITY_COLORS = { Normal: 'green', Alta: 'orange', Urgente: 'red' }

function toInputDate(iso) {
  if (!iso) return ''
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return ''
}

export default function TaskModal({ open, onClose, editingTask = null }) {
  const { clients, addTask, editTask } = useApp()
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
    const taskStatus = fd.get('taskStatus') || 'pendente'
    const data = {
      title: fd.get('title'),
      client: fd.get('client'),
      date: fd.get('date') || null,
      priority: fd.get('priority'),
      notes: fd.get('notes'),
      tag: selectedTag,
      tagColor: TAG_COLORS[selectedTag] || 'green',
      taskStatus,
      done: taskStatus === 'concluido',
    }
    if (isEdit) {
      editTask(editingTask.id, data)
    } else {
      addTask(data)
    }
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
            <input
              name="title"
              placeholder="Ex: Configurar webhook Neoprop"
              required
              defaultValue={editingTask?.title || ''}
              key={editingTask?.id ?? 'new-title'}
            />
          </div>
          <div className="form-group">
            <label>TAG</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`task-tag tag-${TAG_COLORS[tag]}`}
                  style={{
                    cursor: 'pointer',
                    border: selectedTag === tag ? '2px solid currentColor' : '2px solid transparent',
                    padding: '3px 9px',
                  }}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>CLIENTE / PROJETO</label>
            <select name="client" defaultValue={editingTask?.client || ''} key={editingTask?.id ?? 'new-client'}>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="Pessoal">Pessoal</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>DATA</label>
              <input
                name="date"
                type="date"
                defaultValue={toInputDate(editingTask?.date)}
                key={editingTask?.id ?? 'new-date'}
              />
            </div>
            <div className="form-group">
              <label>PRIORIDADE</label>
              <select name="priority" defaultValue={editingTask?.priority || 'Normal'} key={editingTask?.id ?? 'new-priority'}>
                {Object.entries(PRIORITY_COLORS).map(([p]) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>STATUS NO QUADRO</label>
            <select name="taskStatus" defaultValue={editingTask?.taskStatus || 'pendente'} key={editingTask?.id ?? 'new-status'}>
              <option value="pendente">○ Pendente</option>
              <option value="em-progresso">◑ Em Progresso</option>
              <option value="concluido">● Concluído</option>
            </select>
          </div>
          <div className="form-group">
            <label>NOTAS</label>
            <textarea
              name="notes"
              placeholder="Detalhes, links, referências..."
              defaultValue={editingTask?.notes || ''}
              key={editingTask?.id ?? 'new-notes'}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{isEdit ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
