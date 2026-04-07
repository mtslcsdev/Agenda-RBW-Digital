import { useApp } from '../context/AppContext'

export default function Topbar({ title, onNew, newLabel = '+ Novo' }) {
  const { searchQuery, setSearchQuery } = useApp()

  return (
    <div className="topbar">
      <h2>{title}</h2>
      <div className="topbar-actions">
        <div className="search-bar">
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input
            placeholder="Buscar tarefas, clientes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '14px', padding: 0 }}
            >
              ✕
            </button>
          )}
        </div>
        {onNew && (
          <button className="btn btn-primary" onClick={onNew}>
            {newLabel}
          </button>
        )}
      </div>
    </div>
  )
}
