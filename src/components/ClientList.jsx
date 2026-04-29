import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './ClientList.module.css'

export function ClientList({ clients, onRefresh, compact }) {
  const [newClient, setNewClient] = useState({ name: '', email: '', description: '' })
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const colors = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923']

  const handleAddClient = async (e) => {
    e.preventDefault()
    if (!newClient.name.trim()) return

    setLoading(true)
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    try {
      const { error } = await supabase
        .from('clients')
        .insert({
          name: newClient.name,
          email: newClient.email || null,
          description: newClient.description || null,
          color: randomColor,
          status: 'active',
        })

      if (!error) {
        setNewClient({ name: '', email: '', description: '' })
        setShowForm(false)
        onRefresh?.()
      }
    } catch (err) {
      console.error('Erro ao criar cliente:', err)
    } finally {
      setLoading(false)
    }
  }

  const displayClients = compact ? clients.slice(0, 3) : clients

  return (
    <div className={styles.container}>
      {!compact && (
        <div className={styles.header}>
          <h3>Clientes</h3>
          <button
            className={styles.btn}
            onClick={() => setShowForm(!showForm)}
          >
            + Novo
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddClient} className={styles.form}>
          <input
            type="text"
            placeholder="Nome do cliente"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            required
            autoFocus
          />
          <input
            type="email"
            placeholder="Email (opcional)"
            value={newClient.email}
            onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
          />
          <textarea
            placeholder="Descrição"
            value={newClient.description}
            onChange={(e) => setNewClient({ ...newClient, description: e.target.value })}
            rows="2"
          />
          <div className={styles.formActions}>
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {displayClients.length === 0 ? (
          <div className={styles.empty}>
            {compact ? 'Nenhum cliente ainda' : 'Nenhum cliente cadastrado. Crie o primeiro!'}
          </div>
        ) : (
          displayClients.map((client) => (
            <div key={client.id} className={styles.clientItem}>
              <div
                className={styles.avatar}
                style={{ background: client.color }}
                title={client.name}
              >
                {client.name.substring(0, 2).toUpperCase()}
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{client.name}</p>
                {client.email && <span className={styles.email}>{client.email}</span>}
              </div>
              {!compact && (
                <span className={`${styles.status} ${styles[client.status]}`}>
                  {client.status === 'active' ? '✓ Ativo' : 'Inativo'}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
