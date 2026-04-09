import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { usePermission } from '../../hooks/usePermission'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

export default function CommentSection({ taskId }) {
  const { getComments, addComment, deleteComment } = useApp()
  const { currentUser } = useAuth()
  const { isAdmin, canComment } = usePermission()
  const [text, setText] = useState('')
  const comments = getComments(taskId)

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    addComment(taskId, text.trim(), currentUser)
    setText('')
  }

  if (!taskId) return null

  return (
    <div className="comment-section">
      <div className="comment-section-header">
        💬 Comentários
        {comments.length > 0 && <span className="comment-count">{comments.length}</span>}
      </div>

      {comments.length === 0 ? (
        <div className="comment-empty">Nenhum comentário ainda</div>
      ) : (
        <div className="comment-list">
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar" style={{ background: c.userColor }}>
                {c.userInitials || c.userName?.slice(0, 1)}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">{c.userName}</span>
                  <span className="comment-time">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
              {(c.userId === currentUser?.id || isAdmin) && (
                <button
                  className="btn-icon"
                  style={{ width: '20px', height: '20px', fontSize: '10px', color: 'var(--text3)', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}
                  onClick={() => deleteComment(taskId, c.id)}
                  title="Excluir comentário"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="comment-avatar" style={{ background: currentUser?.color || '#6B6960' }}>
            {currentUser?.initials || '?'}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
            <textarea
              className="comment-input"
              placeholder="Adicionar comentário..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
            />
            <button type="submit" className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px', alignSelf: 'flex-end' }} disabled={!text.trim()}>
              Enviar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
