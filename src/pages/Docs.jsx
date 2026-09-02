import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const FOLDER_COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5', '#6B6960', '#c0392b']

function NewFolderModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(FOLDER_COLORS[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color })
    onClose()
  }

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '380px' }}>
        <h3 style={{ marginBottom: '16px' }}>📁 Nova Pasta</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>NOME DA PASTA</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Relatórios de Tráfego" autoFocus required />
          </div>
          <div className="form-group">
            <label>COR</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FOLDER_COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 26, height: 26, borderRadius: 7, background: c, cursor: 'pointer',
                  border: color === c ? '3px solid var(--text)' : '3px solid transparent',
                }} />
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Criar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  const d = Math.floor(diff / 86400)
  return `${d}d`
}

export default function Docs() {
  const navigate = useNavigate()
  const { docs, folders, addDoc, addFolder, deleteFolder, clients } = useApp()
  const { effectiveUser } = useAuth()
  const { canEdit, canDelete } = usePermission()
  const [folderModal, setFolderModal] = useState(false)
  const [activeFolder, setActiveFolder] = useState(null) // null = show all
  const [search, setSearch] = useState('')

  async function handleNewDoc(folderId = null) {
    const folder = folderId ? folders.find(f => f.id === folderId) : null
    const clientId = folder?.clientId || null
    const newDoc = await addDoc({
      title: 'Sem título',
      content: '',
      folderId,
      clientId,
      authorId: effectiveUser?.id,
      authorName: effectiveUser?.name,
      authorColor: effectiveUser?.color,
    })
    if (newDoc?.id) navigate(`/docs/${newDoc.id}`)
  }

  async function handleNewFolder(data) {
    await addFolder(data)
  }

  const filteredDocs = docs.filter(d => {
    if (activeFolder && d.folderId !== activeFolder) return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const recentDocs = [...docs]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 20)

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              placeholder="Buscar documentos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
                fontFamily: 'Inter, sans-serif', width: 260, outline: 'none',
              }}
            />
          </div>
        </div>
        {canEdit && (
          <>
            <button className="btn btn-ghost" onClick={() => setFolderModal(true)}>
              📁 Nova Pasta
            </button>
            <button className="btn btn-primary" onClick={() => handleNewDoc(activeFolder)}>
              + Novo Documento
            </button>
          </>
        )}
      </div>

      {/* Pastas */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.5px' }}>
            PASTAS
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{folders.length}</span>
        </div>

        {folders.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px', border: '1px dashed var(--border)',
            borderRadius: 12, color: 'var(--text3)', fontSize: 13,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
            Ainda não há pastas. Crie uma para organizar seus documentos.
          </div>
        ) : (
          <div className="folders-grid">
            {/* "Todos" card */}
            <div
              className={`folder-card${activeFolder === null ? ' active' : ''}`}
              onClick={() => setActiveFolder(null)}
            >
              <span style={{ fontSize: 20 }}>📂</span>
              <div>
                <div className="folder-card-name">Todos os Docs</div>
                <div className="folder-card-count">{docs.length} doc{docs.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {folders.map(folder => {
              const count = docs.filter(d => d.folderId === folder.id).length
              return (
                <div
                  key={folder.id}
                  className={`folder-card${activeFolder === folder.id ? ' active' : ''}`}
                  onClick={() => setActiveFolder(folder.id === activeFolder ? null : folder.id)}
                >
                  <span style={{ fontSize: 20, color: folder.color }}>📁</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="folder-card-name">{folder.name}</div>
                    <div className="folder-card-count">{count} doc{count !== 1 ? 's' : ''}</div>
                  </div>
                  {canEdit && (
                    <button
                      className="folder-card-add"
                      title="Novo doc nesta pasta"
                      onClick={e => { e.stopPropagation(); handleNewDoc(folder.id) }}
                    >
                      +
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Documentos */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.5px' }}>
            {activeFolder
              ? folders.find(f => f.id === activeFolder)?.name?.toUpperCase() || 'DOCUMENTOS'
              : search ? 'RESULTADOS' : 'RECENTES'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{filteredDocs.length}</span>
        </div>

        {filteredDocs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px', border: '1px dashed var(--border)',
            borderRadius: 12, color: 'var(--text3)', fontSize: 13,
          }}>
            {search
              ? 'Nenhum documento encontrado.'
              : 'Ainda não há documentos nesta pasta.'}
            {canEdit && !search && (
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => handleNewDoc(activeFolder)}>
                  + Novo Documento
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="docs-list">
            {(activeFolder || search ? filteredDocs : recentDocs).map(doc => {
              const folder = doc.folderId ? folders.find(f => f.id === doc.folderId) : null
              return (
                <div
                  key={doc.id}
                  className="doc-row"
                  onClick={() => navigate(`/docs/${doc.id}`)}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="doc-row-title">{doc.title || 'Sem título'}</div>
                    {folder && (
                      <div className="doc-row-folder">• em {folder.name}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {doc.authorName && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{doc.authorName}</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {timeAgo(doc.updatedAt || doc.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {folderModal && (
        <NewFolderModal onClose={() => setFolderModal(false)} onSave={handleNewFolder} />
      )}
    </>
  )
}
