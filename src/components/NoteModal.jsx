import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const NOTE_COLORS = [
  { label: 'Amarelo', value: 'yellow' },
  { label: 'Azul', value: 'blue' },
  { label: 'Roxo', value: 'purple' },
]

export default function NoteModal({ open, onClose, editingNote = null }) {
  const { clients, addNote, editNote } = useApp()
  const overlayRef = useRef()
  const isEdit = !!editingNote

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      title: fd.get('title'),
      content: fd.get('content'),
      project: fd.get('project'),
      color: fd.get('color'),
    }
    if (isEdit) {
      editNote(editingNote.id, data)
    } else {
      addNote(data)
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
        <h3>{isEdit ? 'Editar Nota' : 'Nova Nota'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>TÍTULO</label>
            <input name="title" placeholder="Ex: 🔧 Neoprop – Webhook" required defaultValue={editingNote?.title || ''} key={editingNote?.id ?? 'new-title'} />
          </div>
          <div className="form-group">
            <label>CONTEÚDO</label>
            <textarea
              name="content"
              placeholder="Anote aqui..."
              style={{ minHeight: '120px' }}
              defaultValue={editingNote?.content || ''}
              key={editingNote?.id ?? 'new-content'}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>PROJETO</label>
              <select name="project" defaultValue={editingNote?.project || 'Pessoal'} key={editingNote?.id ?? 'new-project'}>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="Pessoal">Pessoal</option>
              </select>
            </div>
            <div className="form-group">
              <label>COR</label>
              <select name="color" defaultValue={editingNote?.color || 'yellow'} key={editingNote?.id ?? 'new-color'}>
                {NOTE_COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
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
