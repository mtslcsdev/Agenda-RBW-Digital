import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

const ROLE_OPTIONS = ['admin', 'editor', 'viewer']
const COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']

function genPassword() {
  return 'rbw-' + Math.random().toString(36).slice(2, 10)
}

export default function AdminUsuarios() {
  const {
    profile, users,
    fetchAllProfiles, createInvitedUser,
    updateUserRole, removeUser, renameUser, resetUserPassword,
    startViewingAs,
  } = useAuth()
  const { isActualAdmin, isSuperAdmin } = usePermission()
  const navigate = useNavigate()

  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ name: '', email: '', role: 'editor', password: '' })
  const [showPwd, setShowPwd]           = useState(false)
  const [formError, setFormError]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [createdUser, setCreatedUser]   = useState(null)
  const [confirmRemove, setConfirmRemove] = useState(null)

  // inline name editing
  const [editingName, setEditingName]   = useState(null)
  const [newName, setNewName]           = useState('')
  const [nameError, setNameError]       = useState('')
  const [nameSuccess, setNameSuccess]   = useState(null)

  // inline password reset
  const [resetPwdFor, setResetPwdFor]   = useState(null)
  const [newPwd, setNewPwd]             = useState('')
  const [pwdError, setPwdError]         = useState('')
  const [pwdSuccess, setPwdSuccess]     = useState(null)

  useEffect(() => {
    if (isActualAdmin) fetchAllProfiles()
  }, [isActualAdmin])

  if (!isActualAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontSize: '14px' }}>Acesso restrito a Administradores</div>
      </div>
    )
  }

  // ── Criar usuário ─────────────────────────────────────────────
  function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim())  return setFormError('Nome obrigatório')
    if (!form.email.trim()) return setFormError('E-mail obrigatório')
    const pwd = form.password.trim() || genPassword()
    setSaving(true)
    setFormError('')
    const { ok, error } = createInvitedUser(form.email.trim(), pwd, form.name.trim(), form.role)
    setSaving(false)
    if (!ok) { setFormError(error || 'Erro ao criar usuário'); return }
    setCreatedUser({ name: form.name, email: form.email, password: pwd, role: form.role })
    setForm({ name: '', email: '', role: 'editor', password: '' })
    setShowForm(false)
  }

  // ── Editar nome ───────────────────────────────────────────────
  function openEditName(user) {
    setEditingName(user.id)
    setNewName(user.name)
    setNameError('')
    setNameSuccess(null)
    setConfirmRemove(null)
    setResetPwdFor(null)
  }

  function handleRename(userId) {
    if (!newName.trim()) { setNameError('Nome obrigatório'); return }
    setNameError('')
    const { ok, error } = renameUser(userId, newName)
    if (!ok) { setNameError(error || 'Erro ao salvar'); return }
    setNameSuccess(userId)
    setTimeout(() => { setNameSuccess(null); setEditingName(null); setNewName('') }, 1400)
  }

  // ── Reset de senha ────────────────────────────────────────────
  function openResetPwd(user) {
    setResetPwdFor(user.id)
    setNewPwd('')
    setPwdError('')
    setPwdSuccess(null)
    setEditingName(null)
    setConfirmRemove(null)
  }

  function handleResetPwd(userId) {
    const pwd = newPwd.trim()
    if (!pwd) { setPwdError('Digite a nova senha'); return }
    setPwdError('')
    const { ok, error } = resetUserPassword(userId, pwd)
    if (!ok) { setPwdError(error || 'Erro'); return }
    setPwdSuccess(userId)
    setTimeout(() => { setPwdSuccess(null); setResetPwdFor(null); setNewPwd('') }, 1400)
  }

  // ── Ver como ──────────────────────────────────────────────────
  function handleViewAs(user) {
    startViewingAs(user)
    navigate('/')
  }

  // Proteção: não pode agir sobre si mesmo nem sobre super_admin
  function isSuperAdminUser(user) { return user.role === 'super_admin' }

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
            <div><span style={{ color: 'var(--text3)', width: '80px', display: 'inline-block' }}>E-mail</span><strong>{createdUser.email}</strong></div>
            <div>
              <span style={{ color: 'var(--text3)', width: '80px', display: 'inline-block' }}>Senha</span>
              <code style={{ background: 'var(--surface2)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
                {createdUser.password}
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--text3)', width: '80px', display: 'inline-block' }}>Papel</span>
              <span style={{ color: ROLES[createdUser.role]?.color, fontWeight: 600 }}>{ROLES[createdUser.role]?.label}</span>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px' }}>
            ⚠️ O usuário precisa fazer login neste dispositivo com essas credenciais. A lista de usuários é local — compartilhe o e-mail e senha diretamente.
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
                <label>E-MAIL</label>
                <input type="email" placeholder="joao@empresa.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value.toLowerCase().trim() }))} required autoCapitalize="none" />
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
                <label>SENHA <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional — gerada automaticamente)</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Mín. 4 caracteres ou automático"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '13px' }}>
            Nenhum usuário cadastrado.
          </div>
        )}
        {users.map((user, i) => {
          const isOwn  = user.id === profile?.id
          const isSA   = isSuperAdminUser(user)
          const canAct = !isOwn && !isSA
          const editingThisName  = editingName === user.id
          const resettingThisPwd = resetPwdFor === user.id

          return (
            <div
              key={user.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', flexWrap: 'wrap',
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : undefined,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: user.color || COLORS[i % COLORS.length], color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, marginTop: '2px',
              }}>
                {user.initials || user.name?.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                {/* Nome */}
                {editingThisName ? (
                  nameSuccess === user.id ? (
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>✅ Nome atualizado</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <input
                        type="text" value={newName}
                        onChange={e => { setNewName(e.target.value); setNameError('') }}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '140px', border: nameError ? '1px solid var(--red)' : '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface2)', color: 'var(--text)', fontWeight: 600 }}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(user.id); if (e.key === 'Escape') setEditingName(null) }}
                      />
                      {nameError && <span style={{ fontSize: '10px', color: 'var(--red)' }}>{nameError}</span>}
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => setEditingName(null)}>✕</button>
                      <button className="btn btn-primary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleRename(user.id)}>Salvar</button>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</span>
                    {isOwn && <span style={{ fontSize: '10px', background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>Você</span>}
                    {isSA  && <span style={{ fontSize: '10px', background: '#fee2e2', color: '#ef4444', padding: '1px 7px', borderRadius: '10px', fontWeight: 600 }}>Super Admin</span>}
                    {canAct && (
                      <button className="btn-icon" style={{ width: '20px', height: '20px', fontSize: '11px', color: 'var(--text3)' }} onClick={() => openEditName(user)} title="Editar nome">✏️</button>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: resettingThisPwd ? '6px' : 0 }}>{user.email}</div>

                {/* Reset de senha inline */}
                {resettingThisPwd && (
                  pwdSuccess === user.id ? (
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>✅ Senha redefinida</span>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <input
                        type="text" value={newPwd} placeholder="Nova senha (mín. 4)"
                        onChange={e => { setNewPwd(e.target.value); setPwdError('') }}
                        style={{ fontSize: '12px', padding: '4px 8px', width: '160px', border: pwdError ? '1px solid var(--red)' : '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface2)', color: 'var(--text)' }}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleResetPwd(user.id); if (e.key === 'Escape') setResetPwdFor(null) }}
                      />
                      {pwdError && <span style={{ fontSize: '10px', color: 'var(--red)' }}>{pwdError}</span>}
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => setResetPwdFor(null)}>✕</button>
                      <button className="btn btn-primary" style={{ fontSize: '11px', padding: '3px 7px' }} onClick={() => handleResetPwd(user.id)}>Salvar</button>
                    </div>
                  )
                )}
              </div>

              {/* Seletor de papel */}
              <select
                value={user.role}
                onChange={e => updateUserRole(user.id, e.target.value)}
                disabled={!canAct || (!isSuperAdmin && user.role === 'super_admin')}
                style={{
                  fontSize: '12px', padding: '4px 8px',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  background: ROLES[user.role]?.bg || 'var(--surface2)',
                  color: ROLES[user.role]?.color || 'var(--text)',
                  fontFamily: 'Poppins, sans-serif', fontWeight: 600,
                  cursor: canAct ? 'pointer' : 'not-allowed',
                  marginTop: '2px',
                }}
              >
                {[...ROLE_OPTIONS, ...(isSuperAdmin ? ['super_admin'] : [])].map(r =>
                  <option key={r} value={r}>{ROLES[r]?.label || r}</option>
                )}
              </select>

              {/* Ações */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px' }}>
                {canAct && (
                  <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }} onClick={() => handleViewAs(user)}>
                    👁 Ver como
                  </button>
                )}
                {canAct && !resettingThisPwd && (
                  <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }} onClick={() => openResetPwd(user)} title="Redefinir senha">
                    🔑 Senha
                  </button>
                )}
                {canAct && (
                  confirmRemove === user.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setConfirmRemove(null)}>Cancelar</button>
                      <button className="btn" style={{ fontSize: '11px', padding: '4px 8px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }} onClick={() => { removeUser(user.id); setConfirmRemove(null) }}>
                        Remover
                      </button>
                    </div>
                  ) : (
                    <button className="btn-icon" style={{ width: '28px', height: '28px', fontSize: '12px', color: 'var(--red)' }} onClick={() => setConfirmRemove(user.id)} title="Remover">✕</button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--surface2)', borderRadius: '8px', fontSize: '12px', color: 'var(--text3)', lineHeight: 1.6 }}>
        🔐 <strong style={{ color: 'var(--text2)' }}>Usuários locais:</strong> A lista de usuários é salva neste navegador. Ao criar um novo usuário, compartilhe o e-mail e senha com a pessoa — ela deve fazer login pelo mesmo link do sistema.
      </div>
    </>
  )
}
