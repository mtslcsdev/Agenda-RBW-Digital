import { useEffect, useRef, useState } from 'react'
import { useApp, CLIENT_COLORS, STATUS_OPTIONS } from '../context/AppContext'

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export default function ClientModal({ open, onClose, editingClient = null }) {
  const { addClient, editClient } = useApp()
  const overlayRef = useRef()
  const [color, setColor] = useState(CLIENT_COLORS[0])
  const isEdit = !!editingClient

  useEffect(() => {
    if (editingClient) setColor(editingClient.color || CLIENT_COLORS[0])
    else setColor(CLIENT_COLORS[0])
  }, [editingClient, open])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const name = fd.get('name').trim()
    const status = fd.get('status')
    const statusColor = STATUS_OPTIONS.find(s => s.label === status)?.color || 'green'
    const tagsRaw = fd.get('tags')
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []
    const data = {
      name,
      initials: getInitials(name),
      segment: fd.get('segment'),
      email: fd.get('email'),
      status,
      statusColor,
      color,
      tags,
    }
    if (isEdit) {
      editClient(editingClient.id, data)
    } else {
      addClient(data)
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
        <h3>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>NOME</label>
              <input name="name" placeholder="Ex: Empresa XYZ" required defaultValue={editingClient?.name || ''} key={editingClient?.id ?? 'new-name'} />
            </div>
            <div className="form-group">
              <label>SEGMENTO</label>
              <input name="segment" placeholder="Ex: E-commerce" defaultValue={editingClient?.segment || ''} key={editingClient?.id ?? 'new-seg'} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>E-MAIL</label>
              <input name="email" type="email" placeholder="contato@empresa.com" defaultValue={editingClient?.email || ''} key={editingClient?.id ?? 'new-email'} />
            </div>
            <div className="form-group">
              <label>STATUS</label>
              <select name="status" defaultValue={editingClient?.status || 'Ativo'} key={editingClient?.id ?? 'new-status'}>
                {STATUS_OPTIONS.map(s => <option key={s.label}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>TAGS (separadas por vírgula)</label>
            <input name="tags" placeholder="Ex: GHL, N8N, Asaas" defaultValue={editingClient?.tags?.join(', ') || ''} key={editingClient?.id ?? 'new-tags'} />
          </div>
          <div className="form-group">
            <label>COR DO AVATAR</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CLIENT_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: c, cursor: 'pointer',
                    border: color === c ? '3px solid var(--text)' : '3px solid transparent',
                  }}
                />
              ))}
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
