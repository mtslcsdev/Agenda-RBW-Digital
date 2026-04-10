import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import RichEditor from '../components/ui/RichEditor'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)} dia${Math.floor(diff / 86400) !== 1 ? 's' : ''}`
}

function LinkTaskModal({ tasks, linkedIds, onSave, onClose }) {
  const [selected, setSelected] = useState(new Set(linkedIds))
  const [q, setQ] = useState('')

  const filtered = tasks.filter(t =>
    !q || t.title.toLowerCase().includes(q.toLowerCase()) || (t.client || '').toLowerCase().includes(q.toLowerCase())
  )

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <h3 style={{ marginBottom: '14px' }}>🔗 Vincular Tarefas</h3>
        <div className="form-group" style={{ marginBottom: '12px' }}>
          <input placeholder="Buscar tarefa..." value={q} onChange={e => setQ(e.target.value)} autoFocus />
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filtered.slice(0, 30).map(t => (
            <div
              key={t.id}
              onClick={() => toggle(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                background: selected.has(t.id) ? 'var(--accent-light)' : 'transparent',
                border: `1px solid ${selected.has(t.id) ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'all 0.12s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                border: `2px solid ${selected.has(t.id) ? 'var(--accent)' : 'var(--border)'}`,
                background: selected.has(t.id) ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: 'white', flexShrink: 0,
              }}>
                {selected.has(t.id) ? '✓' : ''}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--text3)' : 'var(--text)' }}>
                  {t.title}
                </div>
                {t.client && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.client}</div>}
              </div>
              {t.priority && t.priority !== 'Normal' && (
                <span style={{ fontSize: 10, color: t.priority === 'Urgente' ? 'var(--red)' : 'var(--accent2)', fontWeight: 600, flexShrink: 0 }}>
                  {t.priority}
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text3)', fontSize: 13 }}>
              Nenhuma tarefa encontrada
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave([...selected]); onClose() }}>
            Salvar vínculos ({selected.size})
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DocEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { docs, folders, editDoc, tasks } = useApp()
  const { effectiveUser } = useAuth()

  const doc = docs.find(d => d.id === id)
  const folder = doc?.folderId ? folders.find(f => f.id === doc.folderId) : null

  const [title, setTitle] = useState(doc?.title || 'Sem título')
  const [content, setContent] = useState(doc?.content || '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    if (doc) {
      setTitle(doc.title)
      setContent(doc.content || '')
    }
  }, [doc?.id])

  const save = useCallback(async (newTitle, newContent) => {
    if (!doc) return
    setSaving(true)
    await editDoc(doc.id, { title: newTitle, content: newContent })
    setSaving(false)
    setLastSaved(new Date().toISOString())
  }, [doc, editDoc])

  function scheduleAutoSave(newTitle, newContent) {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(newTitle, newContent), 1500)
  }

  function handleTitleChange(e) {
    const val = e.target.value
    setTitle(val)
    scheduleAutoSave(val, content)
  }

  function handleContentChange(html) {
    setContent(html)
    scheduleAutoSave(title, html)
  }

  function handleLinkSave(ids) {
    editDoc(doc.id, { title, content, linkedTaskIds: ids })
  }

  if (!doc) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text3)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
        <p>Documento não encontrado.</p>
        <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate('/docs')}>← Voltar</button>
      </div>
    )
  }

  const linkedTasks = tasks.filter(t => (doc.linkedTaskIds || []).includes(String(t.id)))

  return (
    <div className="doc-editor-page">
      {/* Top bar */}
      <div className="doc-editor-topbar">
        <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('/docs')}>
          ← Documentos
        </button>
        {folder && (
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            📁 {folder.name}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {saving
            ? <span style={{ fontSize: 11, color: 'var(--text3)' }}>Salvando...</span>
            : lastSaved
              ? <span style={{ fontSize: 11, color: 'var(--text3)' }}>✓ Salvo {timeAgo(lastSaved)}</span>
              : null
          }
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => setLinkOpen(true)}
          >
            🔗 Vincular tarefa {doc.linkedTaskIds?.length > 0 ? `(${doc.linkedTaskIds.length})` : ''}
          </button>
        </div>
      </div>

      {/* Document canvas */}
      <div className="doc-canvas">
        {/* Linked tasks */}
        {linkedTasks.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {linkedTasks.map(t => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20,
                background: 'var(--accent-light)', border: '1px solid var(--accent)',
                fontSize: 12, color: 'var(--accent)', fontWeight: 500,
              }}>
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                {t.client && <span style={{ color: 'var(--text3)', fontSize: 11 }}>· {t.client}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Title */}
        <input
          className="doc-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Sem título"
          onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
        />

        {/* Author line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: doc.authorColor || 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {(doc.authorName || effectiveUser?.name || '?').slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
            {doc.authorName || effectiveUser?.name}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            · Atualizado por último {timeAgo(doc.updatedAt || doc.createdAt)}
          </span>
        </div>

        {/* Rich Editor */}
        <RichEditor
          value={content}
          onChange={handleContentChange}
          placeholder="Comece a escrever... Digite / para inserir blocos"
        />
      </div>

      {linkOpen && (
        <LinkTaskModal
          tasks={tasks}
          linkedIds={(doc.linkedTaskIds || []).map(String)}
          onSave={handleLinkSave}
          onClose={() => setLinkOpen(false)}
        />
      )}
    </div>
  )
}
