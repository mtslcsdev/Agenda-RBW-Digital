import { useState } from 'react'
import { useClients } from '../hooks/useClients'
import { Modal } from '../components/ui/Modal'
import './Clients.css'

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    responsible: '',
    plan: '',
    monthly_value: '',
    status: 'lead',
    description: '',
  })
  const [filter, setFilter] = useState('all')

  const statusOptions = ['lead', 'onboarding', 'ativo', 'pausado', 'cancelado']
  const planOptions = ['Starter', 'Professional', 'Enterprise', 'Custom']

  const filteredClients = filter === 'all'
    ? clients
    : clients.filter(c => c.status === filter)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateClient(editingId, formData)
      } else {
        const color = ['#6366F1', '#FF9500', '#A78BFA', '#34C759', '#00B4D8'][Math.floor(Math.random() * 5)]
        await createClient({ ...formData, color })
      }
      setFormData({
        name: '',
        email: '',
        phone: '',
        whatsapp: '',
        responsible: '',
        plan: '',
        monthly_value: '',
        status: 'lead',
        description: '',
      })
      setEditingId(null)
      setIsModalOpen(false)
    } catch (err) {
      alert('Erro ao salvar cliente: ' + err.message)
    }
  }

  const handleEdit = (client) => {
    setFormData(client)
    setEditingId(client.id)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await deleteClient(id)
      } catch (err) {
        alert('Erro ao deletar: ' + err.message)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      responsible: '',
      plan: '',
      monthly_value: '',
      status: 'lead',
      description: '',
    })
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Gerencie todos os seus clientes e relacionamentos</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Novo Cliente
        </button>
      </div>

      <div className="clients-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({clients.length})
        </button>
        {statusOptions.map(status => {
          const count = clients.filter(c => c.status === status).length
          return (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Carregando...</p>
      ) : filteredClients.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="clients-table">
          <div className="table-header">
            <div className="col-name">Nome</div>
            <div className="col-responsible">Responsável</div>
            <div className="col-plan">Plano</div>
            <div className="col-value">Valor</div>
            <div className="col-status">Status</div>
            <div className="col-actions">Ações</div>
          </div>
          {filteredClients.map(client => (
            <div key={client.id} className="table-row">
              <div className="col-name">
                <div className="client-name-cell">
                  <div className="client-avatar" style={{ background: client.color || '#6366F1' }}>
                    {client.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p>{client.name}</p>
                    <span>{client.email}</span>
                  </div>
                </div>
              </div>
              <div className="col-responsible">{client.responsible || '-'}</div>
              <div className="col-plan">{client.plan || '-'}</div>
              <div className="col-value">
                {client.monthly_value ? `R$ ${client.monthly_value.toFixed(2)}` : '-'}
              </div>
              <div className="col-status">
                <span className={`status-badge ${client.status}`}>
                  {client.status}
                </span>
              </div>
              <div className="col-actions">
                <button
                  className="action-btn edit"
                  onClick={() => handleEdit(client)}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDelete(client.id)}
                  title="Deletar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="client-form">
          <div className="form-group">
            <label>Nome da Empresa *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              placeholder="Empresa LTDA"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
                placeholder="(11) 9999-9999"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>WhatsApp</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="input"
                placeholder="(11) 9999-9999"
              />
            </div>
            <div className="form-group">
              <label>Responsável</label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="input"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Plano</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="input"
              >
                <option value="">Selecione um plano</option>
                {planOptions.map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Valor Mensal</label>
              <input
                type="number"
                step="0.01"
                value={formData.monthly_value}
                onChange={(e) => setFormData({ ...formData, monthly_value: e.target.value })}
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="input"
              required
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Observações</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Notas sobre este cliente..."
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? 'Atualizar' : 'Criar'} Cliente
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
