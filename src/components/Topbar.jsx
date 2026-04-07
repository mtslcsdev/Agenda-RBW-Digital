export default function Topbar({ title, onNew, newLabel = '+ Novo' }) {
  return (
    <div className="topbar">
      <h2>{title}</h2>
      <div className="topbar-actions">
        <div className="search-bar">
          <span style={{ color: 'var(--text3)' }}>🔍</span>
          <input placeholder="Buscar tarefas, clientes..." />
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
