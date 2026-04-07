import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

export default function TaskModal({ open, onClose }) {
  const { clients, setTasks } = useApp()
  const overlayRef = useRef()

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const newTask = {
      id: Date.now(),
      title: fd.get('title'),
      client: fd.get('client'),
      date: fd.get('date'),
      priority: fd.get('priority'),
      done: false,
      tag: 'N8N',
      tagColor: 'orange',
    }
    setTasks(prev => [newTask, ...prev])
    onClose()
    e.target.reset()
  }

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={e => e.target === overlayRef.current && onClose()}
    >
      <div className="modal">
        <h3>Nova Tarefa</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>TÍTULO</label>
            <input name="title" placeholder="Ex: Configurar webhook Neoprop" required />
          </div>
          <div className="form-group">
            <label>CLIENTE / PROJETO</label>
            <select name="client">
              {clients.map(c => <option key={c.id}>{c.name}</option>)}
              <option>Pessoal</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>DATA</label>
              <input name="date" type="date" />
            </div>
            <div className="form-group">
              <label>PRIORIDADE</label>
              <select name="priority">
                <option>Normal</option>
                <option>Alta</option>
                <option>Urgente</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>NOTAS</label>
            <textarea name="notes" placeholder="Detalhes, links, referências..." />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
