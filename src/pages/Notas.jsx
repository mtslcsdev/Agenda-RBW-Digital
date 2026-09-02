import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { usePermission } from '../hooks/usePermission'
import NoteCard from '../components/ui/NoteCard'
import NoteModal from '../components/NoteModal'

export default function Notas({ onNew }) {
  const { notes, archivedNotes, deleteNote, archiveNote, searchQuery } = useApp()
  const { canEdit, canDelete, canArchive } = usePermission()
  const [editingNote, setEditingNote] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  function handleEdit(note) {
    if (!canEdit) return
    setEditingNote(note)
    setEditOpen(true)
  }

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
        {canEdit && <button className="btn btn-primary" onClick={onNew}>+ Nova Nota</button>}
        <span style={{ fontSize: '12px', color: 'var(--text3)', alignSelf: 'center' }}>
          {filtered.length} nota{filtered.length !== 1 ? 's' : ''}
          {notes.filter(n => n.pinned).length > 0 && (
            <span style={{ marginLeft: '6px' }}>· 📌 {notes.filter(n => n.pinned).length} fixada{notes.filter(n => n.pinned).length !== 1 ? 's' : ''}</span>
          )}
        </span>
        {canArchive && archivedNotes?.length > 0 && (
          <button
            className="btn btn-ghost"
            style={{ marginLeft: 'auto', fontSize: '11px' }}
            onClick={() => setShowArchived(s => !s)}
          >
            {showArchived ? 'Ocultar arquivadas' : `📦 Arquivadas (${archivedNotes.length})`}
          </button>
        )}
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
              onEdit={canEdit ? handleEdit : null}
              onDelete={canDelete ? deleteNote : null}
              onArchive={canArchive ? archiveNote : null}
            />
          ))}
        </div>
      )}

      {/* Notas arquivadas (admin) */}
      {canArchive && showArchived && archivedNotes?.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 600, marginBottom: '10px' }}>
            📦 Arquivadas
          </div>
          <div className="three-col" style={{ opacity: 0.55 }}>
            {archivedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={null}
                onDelete={null}
                onArchive={archiveNote}
                archivedMode
              />
            ))}
          </div>
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
