import { useEffect, useRef, useState } from 'react'
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

  const [noteType, setNoteType] = useState('text')
  const [items, setItems] = useState([])

  useEffect(() => {
    if (editingNote) {
      setNoteType(editingNote.type || 'text')
      setItems(editingNote.items || [])
    } else {
      setNoteType('text')
      setItems([])
    }
  }, [editingNote, open])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function addItem() {
    setItems(prev => [...prev, { id: Date.now(), text: '', done: false }])
  }

  function updateItem(id, text) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, text } : it))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  function handleItemKeyDown(e, id) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
    if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault()
      removeItem(id)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = {
      title: fd.get('title'),
      content: noteType === 'text' ? fd.get('content') : '',
      project: fd.get('project'),
      color: fd.get('color'),
      type: noteType,
      items: noteType === 'checklist'
        ? items.filter(it => it.text.trim()).map(it => ({ ...it, done: isEdit ? it.done : false }))
        : [],
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
      <div className="modal" style={{ maxWidth: '520px' }}>
        <h3>{isEdit ? 'Editar Nota' : 'Nova Nota'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>TÍTULO</label>
            <input
              name="title"
              placeholder="Ex: 🔧 Neoprop – Checklist de Setup"
              required
              defaultValue={editingNote?.title || ''}
              key={editingNote?.id ?? 'new-title'}
            />
          </div>

          {/* Type toggle */}
          <div className="form-group">
            <label>TIPO</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['text', 'checklist'].map(t => (
                <button
                  key={t}
                  type="button"
                  className={noteType === t ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ fontSize: '12px', padding: '5px 14px' }}
                  onClick={() => setNoteType(t)}
                >
                  {t === 'text' ? '📝 Texto' : '☑️ Checklist'}
                </button>
              ))}
            </div>
          </div>

          {/* Content: text or checklist */}
          {noteType === 'text' ? (
            <div className="form-group">
              <label>CONTEÚDO</label>
              <textarea
                name="content"
                placeholder="Anote aqui..."
                style={{ minHeight: '100px' }}
                defaultValue={editingNote?.content || ''}
                key={`${editingNote?.id ?? 'new'}-content-${noteType}`}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>ITENS DA CHECKLIST</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text3)', fontSize: '12px', width: '16px', textAlign: 'center' }}>
                      ☐
                    </span>
                    <input
                      value={item.text}
                      onChange={e => updateItem(item.id, e.target.value)}
                      onKeyDown={e => handleItemKeyDown(e, item.id)}
                      placeholder={`Item ${idx + 1}...`}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Poppins, sans-serif', fontSize: '13px', outline: 'none' }}
                      autoFocus={idx === items.length - 1 && items.length > 0}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '14px', padding: '2px 4px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '5px 12px', alignSelf: 'flex-start', marginTop: '2px' }}
                  onClick={addItem}
                >
                  + Adicionar item
                </button>
              </div>
              {/* hidden input so form validation doesn't require content */}
              <input name="content" type="hidden" value="" readOnly />
            </div>
          )}

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
