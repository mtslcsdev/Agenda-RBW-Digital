import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { usePermission } from '../../hooks/usePermission'

function tamanhoLegivel(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function icone(mime, nome) {
  const m = mime || ''
  if (m.startsWith('image/')) return '🖼'
  if (m.startsWith('video/')) return '🎬'
  if (m.startsWith('audio/')) return '🎵'
  if (m.includes('pdf')) return '📕'
  if (/zip|rar|7z|tar/.test(m) || /\.(zip|rar|7z)$/i.test(nome)) return '🗜'
  if (/sheet|excel|csv/.test(m) || /\.(xlsx?|csv)$/i.test(nome)) return '📊'
  if (/word|document/.test(m) || /\.docx?$/i.test(nome)) return '📄'
  return '📎'
}

export default function Anexos({ taskId = null, clientId = null }) {
  const { getAttachments, addAttachment, deleteAttachment } = useApp()
  const { effectiveUser } = useAuth()
  const { canEdit, canDelete } = usePermission()
  const inputRef = useRef()

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sobre, setSobre] = useState(false)

  const lista = getAttachments({ taskId, clientId })

  async function enviarArquivos(files) {
    if (!files || !files.length) return
    setEnviando(true)
    setErro('')

    // Um arquivo por vez, para conseguir dizer QUAL falhou
    const falhas = []
    for (const file of Array.from(files)) {
      const res = await addAttachment(file, { taskId, clientId }, effectiveUser)
      if (!res.ok) falhas.push(res.error)
    }

    setEnviando(false)
    if (falhas.length) setErro(falhas.join(' '))
    if (inputRef.current) inputRef.current.value = ''
  }

  async function remover(a) {
    if (!window.confirm(`Excluir "${a.filename}"? O arquivo é apagado de vez.`)) return
    const res = await deleteAttachment(a.id)
    if (!res.ok) setErro(res.error)
  }

  return (
    <section style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <strong style={{ fontSize: '10px', letterSpacing: '.5px', color: 'var(--text3)', fontWeight: 700 }}>
          ARQUIVOS
        </strong>
        {lista.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{lista.length}</span>
        )}
      </div>

      {lista.map(a => (
        <div
          key={a.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 8px', marginBottom: '4px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--surface2)',
          }}
        >
          <span style={{ fontSize: '15px', flexShrink: 0 }}>{icone(a.mimeType, a.filename)}</span>
          <a
            href={a.url}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1, minWidth: 0, fontSize: '12px', color: 'var(--text)',
              textDecoration: 'none', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            title={a.filename}
          >
            {a.filename}
          </a>
          <span style={{ fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>
            {tamanhoLegivel(a.sizeBytes)}
          </span>
          {a.uploaderName && (
            <span style={{ fontSize: '10px', color: 'var(--text3)', flexShrink: 0 }}>
              · {a.uploaderName}
            </span>
          )}
          {canDelete && (
            <button
              className="btn-icon"
              style={{ width: '22px', height: '22px', fontSize: '11px', color: 'var(--red)', flexShrink: 0 }}
              onClick={() => remover(a)}
              title="Excluir arquivo"
            >✕</button>
          )}
        </div>
      ))}

      {canEdit && (
        <div
          onDragOver={e => { e.preventDefault(); setSobre(true) }}
          onDragLeave={() => setSobre(false)}
          onDrop={e => {
            e.preventDefault()
            setSobre(false)
            enviarArquivos(e.dataTransfer.files)
          }}
          onClick={() => !enviando && inputRef.current?.click()}
          style={{
            border: `1px dashed ${sobre ? 'var(--accent)' : 'var(--border)'}`,
            background: sobre ? 'var(--accent-light)' : 'transparent',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text3)',
            cursor: enviando ? 'progress' : 'pointer',
            marginTop: lista.length ? '8px' : 0,
          }}
        >
          {enviando ? 'Enviando…' : 'Arraste um arquivo aqui ou clique para escolher'}
          <div style={{ fontSize: '10px', marginTop: '3px' }}>até 25 MB por arquivo</div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={e => enviarArquivos(e.target.files)}
      />

      {erro && (
        <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '6px', lineHeight: 1.4 }}>
          {erro}
        </div>
      )}

      {!lista.length && !canEdit && (
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Nenhum arquivo.</div>
      )}
    </section>
  )
}
