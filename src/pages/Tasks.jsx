import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { Modal } from '../components/ui/Modal'
import './Tasks.css'

export default function Tasks() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks()
  const { clients } = useClients()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list') // list, kanban
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    priority: 'normal',
    status: 'aberta',
    due_date: '',
  })

  const priorityOptions = ['baixa', 'normal', 'alta', 'urgent']
  const statusOptions = ['aberta', 'em_andamento', 'revisao', 'concluida']

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateTask(editingId, formData)
      } else {
        await createTask(formData)
      }
      setFormData({
        title: '',
        description: '',
        client_id: '',
        priority: 'normal',
        status: 'aberta',
        due_date: '',
      })
      setEditingId(null)
      setIsModalOpen(false)
    } catch (err) {
      alert('Erro ao salvar tarefa: ' + err.message)
    }
  }

  const handleEdit = (task) => {
    setFormData(task)
    setEditingId(task.id)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
      try {
        await deleteTask(id)
      } catch (err) {
        alert('Erro ao deletar: ' + err.message)
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      client_id: '',
      priority: 'normal',
      status: 'aberta',
      due_date: '',
    })
  }

  const getPriorityColor = (priority) => {
    const colors = {
      baixa: '#34C759',
      normal: '#6366F1',
      alta: '#FF9500',
      urgent: '#FF453A',
    }
    return colors[priority] || '#6366F1'
  }

  const getClientName = (clientId) => {
    return clients.find(c => c.id === clientId)?.name || 'Sem cliente'
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <div>
          <h1>Tarefas</h1>
          <p>Organize e acompanhe suas tarefas</p>
        </div>
        <div className="tasks-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Visualização em lista"
            >
              ☰
            </button>
            <button
              className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Visualização em Kanban"
            >
              ⊞
            </button>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Nova Tarefa
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Carregando...</p>
      ) : viewMode === 'list' ? (
        <div className="tasks-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma tarefa criada</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <div className="task-info">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                  </div>
                  <div className="task-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleEdit(task)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleDelete(task.id)}
                      title="Deletar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="task-footer">
                  <div className="task-meta">
                    <span
                      className="priority-badge"
                      style={{ background: getPriorityColor(task.priority) + '20', color: getPriorityColor(task.priority) }}
                    >
                      {task.priority}
                    </span>
                    <span className="client-badge">{getClientName(task.client_id)}</span>
                    <span className={`status-badge ${task.status}`}>{task.status}</span>
                  </div>
                  {task.due_date && (
                    <span className="due-date">
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="kanban-board">
          {statusOptions.map(status => (
            <div key={status} className="kanban-column">
              <h3>{status.toUpperCase()}</h3>
              <div className="kanban-tasks">
                {tasks
                  .filter(t => t.status === status)
                  .map(task => (
                    <div key={task.id} className="kanban-card">
                      <h4>{task.title}</h4>
                      <p>{task.description?.slice(0, 60)}</p>
                      <div className="card-meta">
                        <span
                          className="priority-dot"
                          style={{ background: getPriorityColor(task.priority) }}
                        />
                        <span className="client-name">{getClientName(task.client_id)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Editar Tarefa' : 'Nova Tarefa'}
      >
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
              placeholder="Título da tarefa"
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Detalhes da tarefa..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cliente</label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className="input"
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Prioridade</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input"
              >
                {priorityOptions.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Data de Entrega</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? 'Atualizar' : 'Criar'} Tarefa
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
