import { useState, useEffect } from 'react'
import { useApp, formatDuration } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'

export function TimerButton({ taskId }) {
  const { activeTimer, startTimer, stopTimer, getTaskTotalTime } = useApp()
  const { currentUser } = useAuth()
  const isActive = activeTimer?.taskId === taskId
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(interval)
  }, [isActive])

  const totalMs = getTaskTotalTime(taskId)

  function handle(e) {
    e.stopPropagation()
    if (isActive) stopTimer(currentUser)
    else startTimer(taskId, currentUser)
  }

  return (
    <button
      className={`timer-btn${isActive ? ' active' : ''}`}
      onClick={handle}
      title={isActive ? 'Parar timer' : 'Iniciar timer'}
    >
      {isActive ? '■' : '▶'}
      {totalMs > 0 && <span className="timer-total">{formatDuration(totalMs)}</span>}
    </button>
  )
}

export function ActiveTimerBar() {
  const { activeTimer, tasks, stopTimer } = useApp()
  const { currentUser } = useAuth()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!activeTimer) { setElapsed(0); return }
    const update = () => setElapsed(Date.now() - activeTimer.startTime)
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  if (!activeTimer) return null

  const task = tasks.find(t => t.id === activeTimer.taskId)
  const hh = String(Math.floor(elapsed / 3600000)).padStart(2, '0')
  const mm = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0')
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')

  return (
    <div className="active-timer-bar">
      <span className="active-timer-icon">⏱</span>
      <span className="active-timer-title">{task?.title || 'Tarefa'}</span>
      <span className="active-timer-clock">{hh}:{mm}:{ss}</span>
      <button className="active-timer-stop" onClick={() => stopTimer(currentUser)}>
        ■ Parar
      </button>
    </div>
  )
}
