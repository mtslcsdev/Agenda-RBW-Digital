import { useState } from 'react'
import { useApp } from '../context/AppContext'
import NoteCard from '../components/ui/NoteCard'
import NoteModal from '../components/NoteModal'

export default function Notas({ onNew }) {
  const { notes, deleteNote, searchQuery } = useApp()
  const [editingNote, setEditingNote] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  function handleEdit(note) {
    setEditingNote(note)
    setEditOpen(true)
  }

  // Sort: pinned first, then by date desc
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.date?.localeCompare(a.date || '') || 0
  })

  const filtered = searchQuery
    ? sorted.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.project?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sorted

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={onNew}>+ Nova Nota</button>
        <span style={{ fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>
          {filtered.length} nota{filtered.length !== 1 ? 's' : ''}
          {notes.filter(n => n.pinned).length > 0 && (
            <span style={{ marginLeft: '6px' }}>· 📌 {notes.filter(n => n.pinned).length} fixada{notes.filter(n => n.pinned).length !== 1 ? 's' : ''}</span>
          )}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)' }}>
          {searchQuery ? 'Nenhuma nota encontrada' : 'Nenhuma nota. Crie uma!'}
        </div>
      ) : (
        <div className="three-col">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={deleteNote}
            />
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
