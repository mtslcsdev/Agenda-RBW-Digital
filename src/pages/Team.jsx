import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Modal } from '../components/ui/Modal'
import './Team.css'

export default function Team() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'operacional',
  })

  const roles = [
    { id: 'admin', label: 'Admin', color: '#FF6B6B', description: 'Acesso total' },
    { id: 'gestor', label: 'Gestor', color: '#6366F1', description: 'Gerenciar equipe' },
    { id: 'operacional', label: 'Operacional', color: '#00B4D8', description: 'Executar tarefas' },
    { id: 'financeiro', label: 'Financeiro', color: '#FFD60A', description: 'Financeiro' },
  ]

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Erro ao buscar membros:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12),
      })

      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: formData.email.split('@')[0],
            name: formData.name,
            role: formData.role,
            avatar_color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          })

        if (profileError) throw profileError

        await fetchMembers()
        setFormData({ email: '', name: '', role: 'operacional' })
        setIsModalOpen(false)
      }
    } catch (err) {
      console.error('Erro ao adicionar membro:', err)
    }
  }

  const getRoleColor = (roleId) => {
    return roles.find(r => r.id === roleId)?.color || '#6366F1'
  }

  const getRoleLabel = (roleId) => {
    return roles.find(r => r.id === roleId)?.label || 'Operacional'
  }

  return (
    <div className="team-page">
      <div className="page-header">
        <div>
          <h1>Equipe</h1>
          <p>Gerencie membros e permissões</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Convidar Membro
        </button>
      </div>

      <div className="team-container">
        <div className="roles-info">
          <h3>Funções e Permissões</h3>
          <div className="roles-grid">
            {roles.map(role => (
              <div key={role.id} className="role-card">
                <div className="role-icon" style={{ background: role.color }} />
                <div className="role-details">
                  <h4>{role.label}</h4>
                  <p>{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="members-section">
          <h3>Membros da Equipe ({members.length})</h3>

          {loading ? (
            <div className="loading">Carregando membros...</div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum membro na equipe ainda</p>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                Convidar Primeiro Membro
              </button>
            </div>
          ) : (
            <div className="members-grid">
              {members.map(member => (
                <div key={member.id} className="member-card">
                  <div
                    className="member-avatar"
                    style={{ background: member.avatar_color || '#6366F1' }}
                  >
                    {member.name?.slice(0, 2).toUpperCase() || member.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <h4>{member.name || member.username}</h4>
                    <p className="member-email">{member.id}</p>
                    <div
                      className="role-badge"
                      style={{ background: getRoleColor(member.role) }}
                    >
                      {getRoleLabel(member.role)}
                    </div>
                  </div>
                  {member.id === user?.id && (
                    <div className="badge-current">Você</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setFormData({ email: '', name: '', role: 'operacional' })
        }}
        title="Convidar Membro"
      >
        <form onSubmit={handleSubmit} className="invite-form">
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
              placeholder="usuario@exemplo.com"
            />
          </div>

          <div className="form-group">
            <label>Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              placeholder="Nome do usuário"
            />
          </div>

          <div className="form-group">
            <label>Função</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false)
                setFormData({ email: '', name: '', role: 'operacional' })
              }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Enviar Convite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
