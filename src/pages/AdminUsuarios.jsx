import { useState } from 'react'
import { useAuth, ROLES } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const ROLE_OPTIONS = ['admin', 'editor', 'viewer']

export default function AdminUsuarios() {
  const { users, currentUser, inviteUser, updateUserRole, removeUser } = useAuth()
  const { isAdmin } = usePermission()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' })
  const [formError, setFormError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [inviting, setInviting] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '14px' }}>Acesso restrito a Administradores</div>
      </div>
    )
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!form.name.trim()) return setFormError('Nome obrigatório')
    if (!form.email.trim()) return setFormError('E-mail obrigatório')
    if (users.find(u => u.email === form.email)) return setFormError('E-mail já cadastrado')

    setInviting(true)
    setFormError('')
    const result = await inviteUser(form)
    setInviting(false)

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    setInviteResult({ email: form.email, name: form.name, password: result.tempPassword })
    setForm({ name: '', email: '', role: 'editor' })
    setShowForm(false)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(s => !s); setInviteResult(null) }}>
          {showForm ? '✕ Cancelar' : '+ Convidar Usuário'}
        </button>
      </div>

      {/* Resultado do invite com senha temporária */}
      {inviteResult && (
        <div className="card" style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--accent)', background: 'var(--accent-light)' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--accent)' }}>
            ✅ Usuário criado com sucesso!
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px' }}>
            Compartilhe as credenciais abaixo com <strong>{inviteResult.name}</strong>:
          </p>
          <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '12px', fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>
            <div>📧 E-mail: <strong>{inviteResult.email}</strong></div>
            <div style={{ marginTop: '6px' }}>🔑 Senha: <strong>{inviteResult.password}</strong></div>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '8px' }}>
            O usuário pode alterar a senha após o primeiro acesso via configurações.
          </p>
          <button className="btn btn-ghost" style={{ fontSize: '11px', marginTop: '8px' }} onClick={() => setInviteResult(null)}>
            Fechar
          </button>
        </div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>Convidar Novo Usuário</div>
          <form onSubmit={handleInvite}>
            <div className="form-row">
              <div className="form-group">
                <label>NOME</label>
                <input
                  placeholder="Ex: João Silva"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>E-MAIL</label>
                <input
                  type="email"
                  placeholder="joao@rbw.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: '200px' }}>
              <label>PERMISSÃO</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
              </select>
            </div>
            {formError && <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '8px' }}>{formError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setFormError('') }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={inviting}>
                {inviting ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '12px' }}>
            Nenhum usuário cadastrado ainda.
          </div>
        )}
        {users.map((user, i) => (
          <div
            key={user.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 16px',
              borderBottom: i < users.length - 1 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: user.color, color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, flexShrink: 0,
            }}>
              {user.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</span>
                {user.id === currentUser?.id && (
                  <span style={{ fontSize: '10px', background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>
                    Você
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{user.email}</div>
            </div>
            <select
              value={user.role}
              onChange={e => updateUserRole(user.id, e.target.value)}
              disabled={user.id === currentUser?.id}
              style={{
                fontSize: '12px', padding: '4px 8px',
                border: '1px solid var(--border)', borderRadius: '6px',
                background: ROLES[user.role]?.bg, color: ROLES[user.role]?.color,
                fontFamily: 'Poppins, sans-serif', fontWeight: 600,
                cursor: user.id === currentUser?.id ? 'not-allowed' : 'pointer',
              }}
            >
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text3)', minWidth: '80px' }}>
              {user.created_at?.slice(0, 10) || '—'}
            </div>
            {user.id !== currentUser?.id && (
              confirmRemove === user.id ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setConfirmRemove(null)}>
                    Cancelar
                  </button>
                  <button
                    className="btn"
                    style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--red)', color: 'white', border: 'none' }}
                    onClick={() => { removeUser(user.id); setConfirmRemove(null) }}
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button
                  className="btn-icon"
                  style={{ width: '28px', height: '28px', fontSize: '12px', color: 'var(--red)' }}
                  onClick={() => setConfirmRemove(user.id)}
                  title="Remover usuário"
                >
                  ✕
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </>
  )
}
