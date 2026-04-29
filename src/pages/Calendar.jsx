import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/ui/Modal'
import './Calendar.css'

export default function Calendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // month, week, day
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'reuniao',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
  })

  const eventTypes = [
    { id: 'reuniao', label: 'Reunião', color: '#6366F1' },
    { id: 'call', label: 'Call/Videochamada', color: '#00B4D8' },
    { id: 'follow_up', label: 'Follow-up', color: '#FF9500' },
    { id: 'entrega', label: 'Entrega', color: '#34C759' },
    { id: 'pagamento', label: 'Pagamento', color: '#FFD60A' },
    { id: 'renovacao', label: 'Renovação', color: '#A78BFA' },
  ]

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newEvent = {
      id: Date.now(),
      ...formData,
      created_by: user?.id,
    }
    setEvents([...events, newEvent])
    setFormData({
      title: '',
      description: '',
      event_type: 'reuniao',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
    })
    setIsModalOpen(false)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      title: '',
      description: '',
      event_type: 'reuniao',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
    })
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getEventColor = (eventType) => {
    return eventTypes.find(t => t.id === eventType)?.color || '#6366F1'
  }

  const isToday = (day) => {
    const today = new Date()
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
  }

  return (
    <div className="calendar-page">
      <div className="page-header">
        <div>
          <h1>Calendário</h1>
          <p>Organize reuniões, calls e eventos importantes</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Novo Evento
        </button>
      </div>

      <div className="calendar-controls">
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
            onClick={() => setViewMode('month')}
          >
            Mês
          </button>
          <button
            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
            disabled
          >
            Semana (em breve)
          </button>
          <button
            className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
            disabled
          >
            Dia (em breve)
          </button>
        </div>

        <div className="calendar-nav">
          <button onClick={handlePrevMonth} className="nav-btn">←</button>
          <h2>{monthName}</h2>
          <button onClick={handleNextMonth} className="nav-btn">→</button>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          {dayNames.map(day => (
            <div key={day} className="day-name">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`calendar-day ${day ? '' : 'empty'} ${isToday(day) ? 'today' : ''}`}
            >
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="day-events">
                    {events
                      .filter(e => {
                        const eventDate = new Date(e.start_date)
                        return eventDate.getDate() === day &&
                          eventDate.getMonth() === currentDate.getMonth() &&
                          eventDate.getFullYear() === currentDate.getFullYear()
                      })
                      .map(event => (
                        <div
                          key={event.id}
                          className="event-dot"
                          style={{ background: getEventColor(event.event_type) }}
                          title={event.title}
                        />
                      ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="event-types">
        <h3>Tipos de Eventos</h3>
        <div className="types-list">
          {eventTypes.map(type => (
            <div key={type.id} className="type-item">
              <div className="type-color" style={{ background: type.color }} />
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {events.length > 0 && (
        <div className="upcoming-events">
          <h3>Próximos Eventos</h3>
          <div className="events-list">
            {events
              .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
              .slice(0, 5)
              .map(event => (
                <div key={event.id} className="event-item">
                  <div
                    className="event-color"
                    style={{ background: getEventColor(event.event_type) }}
                  />
                  <div className="event-content">
                    <h4>{event.title}</h4>
                    <p className="event-date">
                      {new Date(event.start_date).toLocaleDateString('pt-BR')}
                      {event.start_time && ` às ${event.start_time}`}
                    </p>
                    {event.description && (
                      <p className="event-desc">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Novo Evento"
      >
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label>Título do Evento *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
              placeholder="ex: Reunião com cliente"
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Detalhes do evento..."
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Evento</label>
            <select
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              className="input"
            >
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Início *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input"
                required
              />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data de Término</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input"
              />
            </div>
            <div className="form-group">
              <label>Hora de Término</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleCloseModal}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar Evento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
