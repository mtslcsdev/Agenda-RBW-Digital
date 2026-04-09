import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AppContext = createContext(null)

export const TAG_COLORS = {
  GHL: 'green', N8N: 'orange', Vendas: 'purple',
  Reunião: 'yellow', Dev: 'green', Pessoal: 'purple', Dev2: 'green',
}

export const TAG_OPTIONS = ['GHL', 'N8N', 'Vendas', 'Reunião', 'Dev', 'Pessoal']
export const CLIENT_COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']
export const PRIORITY_COLORS = { Normal: null, Alta: 'var(--accent2)', Urgente: 'var(--red)' }

export const KANBAN_COLUMNS = [
  { id: 'pendente', label: 'Pendente', color: 'var(--text3)' },
  { id: 'em-progresso', label: 'Em Progresso', color: 'var(--accent3)' },
  { id: 'concluido', label: 'Concluído', color: 'var(--accent)' },
]

const STATUS_OPTIONS = [
  { label: 'Em andamento', color: 'orange' },
  { label: 'Ativo', color: 'green' },
  { label: 'Onboarding', color: 'yellow' },
  { label: 'Pausado', color: 'red' },
  { label: 'Concluído', color: 'purple' },
]
export { STATUS_OPTIONS }

const SEED_TASKS = [
  { id: 1, title: 'Configurar webhook N8N – Neoprop', done: true, tag: 'GHL', tagColor: 'green', client: 'Neoprop', date: '2026-04-07', priority: 'Normal', taskStatus: 'concluido' },
  { id: 2, title: 'Revisar fluxo de aprovação de trader', done: false, tag: 'N8N', tagColor: 'orange', client: 'Neoprop', date: '2026-04-08', priority: 'Alta', taskStatus: 'em-progresso' },
  { id: 3, title: 'Switch node – 3 planos Asaas', done: false, tag: 'N8N', tagColor: 'orange', client: 'Neoprop', date: '2026-04-09', priority: 'Urgente', taskStatus: 'pendente' },
  { id: 4, title: 'Enviar proposta para novo cliente', done: false, tag: 'Vendas', tagColor: 'purple', client: 'Pessoal', date: '2026-04-10', priority: 'Normal', taskStatus: 'pendente' },
  { id: 5, title: 'Reunião com Joy – engajamento de leads', done: false, tag: 'Reunião', tagColor: 'yellow', client: 'Pessoal', date: '2026-04-08', priority: 'Normal', taskStatus: 'pendente' },
  { id: 6, title: 'Rascunho capítulo 1 – Ebook 5km', done: false, tag: 'Pessoal', tagColor: 'purple', client: 'Pessoal', date: '2026-04-11', priority: 'Normal', taskStatus: 'pendente' },
  { id: 7, title: 'Checar integração Asaas API', done: true, tag: 'Dev', tagColor: 'green', client: 'Neoprop', date: '2026-04-07', priority: 'Normal', taskStatus: 'concluido' },
]

const SEED_CLIENTS = [
  { id: 1, initials: 'NP', name: 'Neoprop', segment: 'Trader Training Program', email: 'robervan@neoprop.com', status: 'Em andamento', statusColor: 'orange', color: '#2D6A4F', tags: ['GHL', 'N8N'], archived: false },
  { id: 2, initials: 'CB', name: 'Cliente B', segment: 'E-commerce / Loja virtual', email: 'contato@clienteb.com', status: 'Ativo', statusColor: 'green', color: '#5B4FCF', tags: ['Automação'], archived: false },
  { id: 3, initials: 'MK', name: 'Cliente C', segment: 'Marketing Digital', email: 'contato@clientec.com', status: 'Onboarding', statusColor: 'yellow', color: '#E07A3A', tags: [], archived: false },
]

const SEED_NOTES = [
  { id: 1, title: '🔧 Neoprop – Webhook Rejeição', content: 'Mapear campo de motivo no webhook de rejeição. Verificar com Robervan a estrutura esperada para o Switch node dos 3 planos.', date: '2026-04-07', project: 'Neoprop', color: 'yellow', type: 'text', items: [], pinned: false },
  { id: 2, title: '✅ Setup GHL – Checklist', content: '', date: '2026-04-06', project: 'Neoprop', color: 'blue', type: 'checklist', items: [{ id: 1, text: 'Criar conta no GoHighLevel', done: true }, { id: 2, text: 'Configurar subaccount Neoprop', done: true }, { id: 3, text: 'Conectar domínio personalizado', done: false }, { id: 4, text: 'Ativar automações de follow-up', done: false }], pinned: true },
  { id: 3, title: '📊 Meta Ads – Estudo', content: 'Sessões curtas diárias. Foco atual: estrutura de campanha, conjuntos de anúncios, públicos lookalike e retargeting.', date: '2026-04-05', project: 'Pessoal', color: 'purple', type: 'text', items: [], pinned: false },
]

function loadFromStorage(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function saveToStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => loadFromStorage('fd_theme', 'light'))
  const [tasks, setTasksState] = useState(() => loadFromStorage('fd_tasks', SEED_TASKS))
  const [clients, setClientsState] = useState(() => loadFromStorage('fd_clients', SEED_CLIENTS))
  const [notes, setNotesState] = useState(() => loadFromStorage('fd_notes', SEED_NOTES))
  const [comments, setCommentsState] = useState(() => loadFromStorage('fd_comments', {}))
  const [notifications, setNotifications] = useState(() => loadFromStorage('fd_notifications', []))
  const [activityLog, setActivityLog] = useState(() => loadFromStorage('fd_activityLog', []))
  const [timeEntries, setTimeEntries] = useState(() => loadFromStorage('fd_timeEntries', []))
  const [activeTimer, setActiveTimer] = useState(() => loadFromStorage('fd_activeTimer', null))
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); saveToStorage('fd_theme', theme) }, [theme])
  useEffect(() => { saveToStorage('fd_tasks', tasks) }, [tasks])
  useEffect(() => { saveToStorage('fd_clients', clients) }, [clients])
  useEffect(() => { saveToStorage('fd_notes', notes) }, [notes])
  useEffect(() => { saveToStorage('fd_comments', comments) }, [comments])
  useEffect(() => { saveToStorage('fd_notifications', notifications) }, [notifications])
  useEffect(() => { saveToStorage('fd_activityLog', activityLog) }, [activityLog])
  useEffect(() => { saveToStorage('fd_timeEntries', timeEntries) }, [timeEntries])
  useEffect(() => { saveToStorage('fd_activeTimer', activeTimer) }, [activeTimer])

  function toggleTheme() { setTheme(t => t === 'light' ? 'dark' : 'light') }

  // ── INTERNAL HELPERS ──
  const _notify = useCallback((icon, message, type = 'info') => {
    const n = { id: Date.now() + Math.random(), icon, message, type, read: false, createdAt: new Date().toISOString() }
    setNotifications(prev => [n, ...prev].slice(0, 30))
  }, [])

  const _log = useCallback((userName, userColor, action, entityType, entityTitle) => {
    const entry = { id: Date.now() + Math.random(), userName, userColor: userColor || '#6B6960', action, entityType, entityTitle, createdAt: new Date().toISOString() }
    setActivityLog(prev => [entry, ...prev].slice(0, 50))
  }, [])

  // ── TASKS ──
  function addTask(data, actor) {
    const task = { ...data, id: Date.now(), done: false, taskStatus: data.taskStatus || 'pendente' }
    setTasksState(prev => [task, ...prev])
    _notify('✅', `Nova tarefa criada: ${data.title}`, 'task.created')
    if (actor) _log(actor.name, actor.color, 'criou a tarefa', 'tarefa', data.title)
  }
  function editTask(id, data, actor) {
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    if (actor) _log(actor.name, actor.color, 'editou a tarefa', 'tarefa', data.title || '')
  }
  function deleteTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.filter(t => t.id !== id))
    setCommentsState(prev => { const c = { ...prev }; delete c[id]; return c })
    if (actor && task) _log(actor.name, actor.color, 'removeu a tarefa', 'tarefa', task.title)
  }
  function toggleTask(id, actor) {
    setTasksState(prev => prev.map(t => {
      if (t.id !== id) return t
      const done = !t.done
      if (actor) _notify(done ? '🏁' : '↩', done ? `Tarefa concluída: ${t.title}` : `Tarefa reaberta: ${t.title}`, done ? 'task.done' : 'task.reopened')
      if (actor) _log(actor.name, actor.color, done ? 'concluiu a tarefa' : 'reabriu a tarefa', 'tarefa', t.title)
      return { ...t, done, taskStatus: done ? 'concluido' : 'pendente' }
    }))
  }
  function moveTask(id, newStatus, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.map(t => t.id !== id ? t : { ...t, taskStatus: newStatus, done: newStatus === 'concluido' }))
    if (actor && task) {
      const colLabel = KANBAN_COLUMNS.find(c => c.id === newStatus)?.label || newStatus
      _notify('🔀', `Tarefa movida para ${colLabel}: ${task.title}`, 'task.moved')
      _log(actor.name, actor.color, `moveu para ${colLabel}`, 'tarefa', task.title)
    }
  }

  // ── CLIENTS ──
  function addClient(data) { setClientsState(prev => [...prev, { ...data, id: Date.now(), archived: false }]) }
  function editClient(id, data) { setClientsState(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)) }
  function archiveClient(id) { setClientsState(prev => prev.map(c => c.id === id ? { ...c, archived: !c.archived } : c)) }

  // ── NOTES ──
  function addNote(data) {
    setNotesState(prev => [{ ...data, id: Date.now(), date: new Date().toISOString().slice(0, 10), type: data.type || 'text', items: data.items || [], pinned: false }, ...prev])
  }
  function editNote(id, data) { setNotesState(prev => prev.map(n => n.id === id ? { ...n, ...data } : n)) }
  function deleteNote(id) { setNotesState(prev => prev.filter(n => n.id !== id)) }
  function toggleNoteItem(noteId, itemId) {
    setNotesState(prev => prev.map(n => n.id === noteId ? { ...n, items: n.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it) } : n))
  }
  function pinNote(id) { setNotesState(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)) }

  // ── COMMENTS ──
  function addComment(taskId, text, actor) {
    const comment = { id: Date.now(), userId: actor?.id, userName: actor?.name || 'Anônimo', userColor: actor?.color || '#6B6960', userInitials: actor?.initials || '?', text, createdAt: new Date().toISOString() }
    setCommentsState(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), comment] }))
    const task = tasks.find(t => t.id === taskId)
    _notify('💬', `Novo comentário em: ${task?.title || 'tarefa'}`, 'comment.added')
  }
  function deleteComment(taskId, commentId) {
    setCommentsState(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(c => c.id !== commentId) }))
  }
  function getComments(taskId) { return comments[taskId] || [] }

  // ── NOTIFICATIONS ──
  function markNotificationRead(id) { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)) }
  function markAllRead() { setNotifications(prev => prev.map(n => ({ ...n, read: true }))) }

  // ── TIME TRACKING ──
  function startTimer(taskId, actor) {
    if (activeTimer) stopTimer(actor)
    setActiveTimer({ taskId, startTime: Date.now() })
    const task = tasks.find(t => t.id === taskId)
    if (actor) _notify('⏱', `Timer iniciado: ${task?.title || 'tarefa'}`, 'timer.start')
  }
  function stopTimer(actor) {
    if (!activeTimer) return
    const duration = Date.now() - activeTimer.startTime
    const entry = { id: Date.now(), taskId: activeTimer.taskId, startTime: activeTimer.startTime, endTime: Date.now(), duration }
    setTimeEntries(prev => [...prev, entry])
    setActiveTimer(null)
    const task = tasks.find(t => t.id === activeTimer.taskId)
    if (actor) _notify('⏹', `Timer parado: ${task?.title || 'tarefa'} (${formatDuration(duration)})`, 'timer.stop')
  }
  function getTaskTotalTime(taskId) {
    const total = timeEntries.filter(e => e.taskId === taskId).reduce((sum, e) => sum + e.duration, 0)
    const current = activeTimer?.taskId === taskId ? Date.now() - activeTimer.startTime : 0
    return total + current
  }

  const activeClients = clients.filter(c => !c.archived)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      tasks, addTask, editTask, deleteTask, toggleTask, moveTask,
      clients: activeClients, allClients: clients, addClient, editClient, archiveClient,
      notes, addNote, editNote, deleteNote, toggleNoteItem, pinNote,
      comments, addComment, deleteComment, getComments,
      notifications, markNotificationRead, markAllRead, unreadCount,
      activityLog,
      timeEntries, activeTimer, startTimer, stopTimer, getTaskTotalTime,
      searchQuery, setSearchQuery,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function formatDuration(ms) {
  if (!ms) return '0m'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function useApp() { return useContext(AppContext) }
