import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const ROLE_OPTIONS = ['admin', 'editor', 'viewer']
const COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']

function genPassword() {
  return 'rbw-' + Math.random().toString(36).slice(2, 10)
}

export default function AdminUsuarios() {
  const { users, currentUser, updateUserRole, removeUser, createInvitedUser, startViewingAs, resetUserPassword, renameUser } = useAuth()
  const { isActualAdmin } = usePermission()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', role: 'editor', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [resetingPwd, setResetingPwd] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(null)
  const [editingName, setEditingName] = useState(null)
  const [newName, setNewName] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(null)

  if (!isActualAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '14px' }}>Acesso restrito a Administradores</div>
      </div>
    )
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim())     return setFormError('Nome obrigatório')
    if (!form.username.trim()) return setFormError('Nome de usuário obrigatório')
    if (users.find(u => u.email === form.username)) return setFormError('Usuário já cadastrado')
    const pwd = form.password.trim() || genPassword()
    if (pwd.length < 6) return setFormError('Senha deve ter mínimo 6 caracteres')

    setSaving(true)
    setFormError('')
    const { ok, error } = await createInvitedUser(form.username, pwd, form.name, form.role)
    if (!ok) { setFormError(error || 'Erro ao criar usuário'); setSaving(false); return }

    setCreatedUser({ name: form.name, username: form.username, password: pwd, role: form.role })
    setForm({ name: '', username: '', role: 'editor', password: '' })
    setShowForm(false)
    setSaving(false)
  }

  function handleViewAs(user) {
    startViewingAs(user)
    navigate('/')
  }

  async function handleResetPwd(userId) {
    if (newPwd.length < 6) { setPwdError('Mínimo 6 caracteres'); return }
    setPwdError('')
    const { ok, error } = await resetUserPassword(userId, newPwd)
    if (!ok) { setPwdError(error || 'Erro ao redefinir'); return }
    setPwdSuccess(userId)
    setTimeout(() => { setPwdSuccess(null); setResetingPwd(null); setNewPwd('') }, 2000)
  }

  function openResetPwd(userId) {
    setResetingPwd(userId)
    setNewPwd('')
    setPwdError('')
    setPwdSuccess(null)
    setConfirmRemove(null)
    setEditingName(null)
  }

  function openEditName(user) {
    setEditingName(user.id)
    setNewName(user.name)
    setNameError('')
    setNameSuccess(null)
    setConfirmRemove(null)
    setResetingPwd(null)
  }

  async function handleRename(userId) {
    if (!newName.trim()) { setNameError('Nome obrigatório'); return }
    setNameError('')
    const { ok, error } = await renameUser(userId, newName)
    if (!ok) { setNameError(error || 'Erro ao salvar'); return }
    setNameSuccess(userId)
    setTimeout(() => { setNameSuccess(null); setEditingName(null); setNewName('') }, 1500)
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
          {users.length} usuário{users.length !== 1 ? 's' : ''}
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(s => !s); setCreatedUser(null); setFormError('') }}>
          {showForm ? '✕ Cancelar' : '+ Criar Usuário'}
        </button>
      </div>

      {/* Credenciais do novo usuário */}
      {createdUser && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px', color: 'var(--accent)' }}>
            ✅ Usuário criado — compartilhe com {createdUser.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><span style={{ color: 'var(--text3)', width: '80px', display: 'inline-block' }}>Usuário</span><strong>{createdUser.username}</strong></div>
            <div><span style={{ color: 'var(--text3)', width: '80px', display: 'inline-block' }}>Senha</span>
              <code style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                {createdUser.password}
              </code>
            </div>
            <div><span style={{ color: 'var(--text3)', width: '80px', display: 'inline-block' }}>Papel</span>
              <span style={{ color: ROLES[createdUser.role]?.color, fontWeight: 600 }}>{ROLES[createdUser.role]?.label}</span>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px' }}>
            O usuário pode alterar a senha após o primeiro acesso em Configurações de conta.
          </div>
          <button className="btn btn-ghost" style={{ marginTop: '10px', fontSize: '12px' }} onClick={() => setCreatedUser(null)}>
            OK, já copiei
          </button>
        </div>
      )}

      {/* Formulário de criação */}
      {showForm && (
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>Novo Usuário</div>
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="form-group">
                <label>NOME</label>
                <input placeholder="Ex: João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>USUÁRIO</label>
                <input placeholder="Ex: joao (sem espaços)" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))} required autoCapitalize="none" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PAPEL</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLES[r].label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>SENHA INICIAL <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional — gera automático se vazio)</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    minLength={form.password ? 6 : 0}
                    style={{ paddingRight: '80px' }}
                  />
                  <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn btn-ghost" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={() => setShowPwd(s => !s)}>
                      {showPwd ? 'Ocultar' : 'Ver'}
                    </button>
                    <button type="button" className="btn btn-ghost" style={{ fontSize: '10px', padding: '2px 6px' }} onClick={() => setForm(f => ({ ...f, password: genPassword() }))}>
                      Gerar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {formError && <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '8px' }}>{formError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setFormError('') }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Criando...' : 'Criar Usuário'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuários */}
      <div className="card">
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '13px' }}>Nenhum usuário</div>
        )}
        {users.map((user, i) => (
          <div
            key={user.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderBottom: i < users.length - 1 ? '1px solid var(--border)' : undefined,
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: user.color || COLORS[i % COLORS.length], color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700,
            }}>
              {user.initials || user.name?.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName === user.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {nameSuccess === user.id ? (
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>✅ Nome atualizado</span>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={newName}
                        onChange={e => { setNewName(e.target.value); setNameError('') }}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '140px', border: nameError ? '1px solid var(--red)' : '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface2)', color: 'var(--text1)', fontWeight: 600 }}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(user.id); if (e.key === 'Escape') setEditingName(null) }}
                      />
                      {nameError && <span style={{ fontSize: '10px', color: 'var(--red)' }}>{nameError}</span>}
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => setEditingName(null)}>✕</button>
                      <button className="btn btn-primary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleRename(user.id)}>Salvar</button>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</span>
                  {user.id === currentUser?.id && (
                    <span style={{ fontSize: '10px', background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>Você</span>
                  )}
                  <button
                    className="btn-icon"
                    style={{ width: '20px', height: '20px', fontSize: '11px', color: 'var(--text3)', opacity: 0.6 }}
                    onClick={() => openEditName(user)}
                    title="Editar nome"
                  >✏️</button>
                </div>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>@{user.email || user.name?.toLowerCase()}</div>
            </div>

            {/* Seletor de papel */}
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

            {/* Botão ver como (só para outros usuários) */}
            {user.id !== currentUser?.id && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                onClick={() => handleViewAs(user)}
                title="Visualizar o app como esse usuário"
              >
                👁 Ver como
              </button>
            )}

            {/* Reset de senha */}
            {user.id !== currentUser?.id && (
              resetingPwd === user.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {pwdSuccess === user.id ? (
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>✅ Senha redefinida</span>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Nova senha (mín. 6)"
                        value={newPwd}
                        onChange={e => { setNewPwd(e.target.value); setPwdError('') }}
                        style={{ fontSize: '11px', padding: '4px 8px', width: '150px', border: pwdError ? '1px solid var(--red)' : '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface2)', color: 'var(--text1)' }}
                        autoFocus
                      />
                      {pwdError && <span style={{ fontSize: '10px', color: 'var(--red)' }}>{pwdError}</span>}
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => { setResetingPwd(null); setNewPwd(''); setPwdError('') }}>Cancelar</button>
                      <button className="btn btn-primary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleResetPwd(user.id)}>Salvar</button>
                    </>
                  )}
                </div>
              ) : (
                <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }} onClick={() => openResetPwd(user.id)} title="Redefinir senha">
                  🔑 Senha
                </button>
              )
            )}

            {/* Remover */}
            {user.id !== currentUser?.id && (
              confirmRemove === user.id ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setConfirmRemove(null)}>Cancelar</button>
                  <button className="btn" style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--red)', color: 'white', border: 'none' }} onClick={() => { removeUser(user.id); setConfirmRemove(null) }}>
                    Remover
                  </button>
                </div>
              ) : (
                <button className="btn-icon" style={{ width: '28px', height: '28px', fontSize: '12px', color: 'var(--red)' }} onClick={() => setConfirmRemove(user.id)} title="Remover">✕</button>
              )
            )}
          </div>
        ))}
      </div>
    </>
  )
}
