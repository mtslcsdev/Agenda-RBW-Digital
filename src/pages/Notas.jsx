import { useApp } from '../context/AppContext'

const COLOR_MAP = {
  yellow: {},
  blue: { className: 'blue' },
  purple: { style: { background: 'var(--accent3-light)', borderColor: 'var(--accent3)' } },
}

export default function Notas({ onNew }) {
  const { notes } = useApp()

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={onNew}>+ Nova Nota</button>
        <button className="btn btn-ghost">+ Documento</button>
      </div>

      <div className="three-col">
        {notes.map(note => {
          const colorOpts = COLOR_MAP[note.color] || {}
          return (
            <div
              key={note.id}
              className={`note-card${colorOpts.className ? ` ${colorOpts.className}` : ''}`}
              style={colorOpts.style}
            >
              <strong>{note.title}</strong><br /><br />
              {note.content}
              <div className="note-meta">📅 {note.date} · {note.project}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
