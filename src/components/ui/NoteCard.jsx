import { useApp } from '../../context/AppContext'

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const COLOR_CLASS = { yellow: '', blue: 'blue', purple: 'purple' }

export default function NoteCard({ note, onEdit, onDelete, showActions = true, preview = false }) {
  const { toggleNoteItem, pinNote } = useApp()
  const colorClass = COLOR_CLASS[note.color] || ''
  const isPinned = note.pinned

  const doneItems = (note.items || []).filter(it => it.done).length
  const totalItems = (note.items || []).length
  const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const displayItems = preview ? (note.items || []).slice(0, 3) : (note.items || [])

  return (
    <div
      className={`note-card${colorClass ? ' ' + colorClass : ''}${isPinned ? ' pinned' : ''}`}
      style={note.color === 'purple' ? { background: 'var(--accent3-light)', borderColor: 'var(--accent3)' } : undefined}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <strong style={{ fontSize: '12px', flex: 1 }}>
          {isPinned && <span style={{ marginRight: '4px' }}>📌</span>}
          {note.title}
        </strong>
        {showActions && (
          <div style={{ display: 'flex', gap: '2px', marginLeft: '6px', flexShrink: 0 }}>
            <button
              className="btn-icon"
              style={{ width: '20px', height: '20px', fontSize: '10px', opacity: 0.7 }}
              onClick={() => pinNote(note.id)}
              title={isPinned ? 'Desafixar' : 'Fixar'}
            >
              📌
            </button>
            {onEdit && (
              <button
                className="btn-icon"
                style={{ width: '20px', height: '20px', fontSize: '10px' }}
                onClick={() => onEdit(note)}
                title="Editar"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                className="btn-icon"
                style={{ width: '20px', height: '20px', fontSize: '10px', color: 'var(--red)' }}
                onClick={() => onDelete(note.id)}
                title="Excluir"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {note.type === 'checklist' ? (
        <>
          <div>
            {displayItems.map(item => (
              <div
                key={item.id}
                className={`checklist-item${item.done ? ' done' : ''}`}
                onClick={() => !preview && toggleNoteItem(note.id, item.id)}
              >
                <div className="check-box" />
                <span className="check-label">{item.text}</span>
              </div>
            ))}
            {preview && totalItems > 3 && (
              <div style={{ fontSize: '11px', color: 'var(--text3)', paddingTop: '2px' }}>
                +{totalItems - 3} mais...
              </div>
            )}
          </div>
          {totalItems > 0 && (
            <div className="checklist-progress">
              <div className="checklist-progress-bar">
                <div className="checklist-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                {doneItems}/{totalItems}
              </span>
            </div>
          )}
        </>
      ) : (
        <span>
          {preview && note.content.length > 90
            ? note.content.slice(0, 90) + '…'
            : note.content}
        </span>
      )}

      <div className="note-meta">
        📅 {formatDate(note.date)} · {note.project}
        {note.type === 'checklist' && <span style={{ marginLeft: '6px' }}>☑️ Checklist</span>}
      </div>
    </div>
  )
}
