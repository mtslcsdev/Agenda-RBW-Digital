import { useState } from 'react'
import { useApp } from '../context/AppContext'
import NoteModal from '../components/NoteModal'

const COLOR_CLASS = {
  yellow: '',
  blue: 'blue',
  purple: 'purple',
}

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function Notas({ onNew }) {
  const { notes, deleteNote } = useApp()
  const [editingNote, setEditingNote] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(note) {
    setEditingNote(note)
    setEditOpen(true)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={onNew}>+ Nova Nota</button>
        <span style={{ fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>
          {notes.length} nota{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {notes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>
          Nenhuma nota. Crie uma!
        </div>
      ) : (
        <div className="three-col">
          {notes.map(note => (
            <div
              key={note.id}
              className={`note-card${COLOR_CLASS[note.color] ? ' ' + COLOR_CLASS[note.color] : ''}`}
              style={note.color === 'purple' ? { background: 'var(--accent3-light)', borderColor: 'var(--accent3)' } : undefined}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <strong style={{ fontSize: '12px' }}>{note.title}</strong>
                <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                  <button
                    className="btn-icon"
                    style={{ width: '20px', height: '20px', fontSize: '10px' }}
                    onClick={() => handleEdit(note)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    style={{ width: '20px', height: '20px', fontSize: '10px', color: 'var(--red)' }}
                    onClick={() => deleteNote(note.id)}
                    title="Excluir"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {note.content}
              <div className="note-meta">📅 {formatDate(note.date)} · {note.project}</div>
            </div>
          ))}
        </div>
      )}

      <NoteModal
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditingNote(null) }}
        editingNote={editingNote}
      />
    </>
  )
}
