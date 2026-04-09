import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export const TAG_COLORS = {
  GHL: 'green', N8N: 'orange', Vendas: 'purple',
  Reunião: 'yellow', Dev: 'green', Pessoal: 'purple',
}

export const TAG_OPTIONS = ['GHL', 'N8N', 'Vendas', 'Reunião', 'Dev', 'Pessoal']
export const CLIENT_COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']
export const PRIORITY_COLORS = { Normal: null, Alta: 'var(--accent2)', Urgente: 'var(--red)' }

export const KANBAN_COLUMNS = [
  { id: 'pendente',    label: 'Pendente',     color: 'var(--text3)' },
  { id: 'em-progresso', label: 'Em Progresso', color: 'var(--accent3)' },
  { id: 'concluido',  label: 'Concluído',    color: 'var(--accent)' },
]

const STATUS_OPTIONS = [
  { label: 'Em andamento', color: 'orange' },
  { label: 'Ativo',        color: 'green' },
  { label: 'Onboarding',  color: 'yellow' },
  { label: 'Pausado',      color: 'red' },
  { label: 'Concluído',   color: 'purple' },
]
export { STATUS_OPTIONS }

// ── Mapeamento DB → App ──────────────────────────────────────
const mapTask = r => ({
  id: r.id, title: r.title, client: r.client || '',
  tag: r.tag || '', tagColor: r.tag_color || 'green',
  priority: r.priority || 'Normal', date: r.date || '',
  notes: r.notes || '', done: r.done || false,
  taskStatus: r.task_status || 'pendente',
})
const mapClient = r => ({
  id: r.id, initials: r.initials || '', name: r.name,
  segment: r.segment || '', email: r.email || '',
  status: r.status || 'Ativo', statusColor: r.status_color || 'green',
  tags: r.tags || [], color: r.color || '#2D6A4F', archived: r.archived || false,
})
const mapNote = r => ({
  id: r.id, title: r.title, content: r.content || '',
  project: r.project || '', color: r.color || 'yellow',
  date: r.date || r.created_at?.slice(0, 10) || '',
  type: r.type || 'text', items: r.items || [], pinned: r.pinned || false,
})
const mapComment = r => ({
  id: r.id, userId: r.user_id, userName: r.user_name,
  userColor: r.user_color, userInitials: r.user_initials,
  text: r.text, createdAt: r.created_at,
})
const mapActivity = r => ({
  id: r.id, userName: r.user_name, userColor: r.user_color,
  action: r.action, entityType: r.entity_type, entityTitle: r.entity_title,
  createdAt: r.created_at,
})
const mapNotification = r => ({
  id: r.id, icon: r.icon, message: r.message,
  type: r.type, read: r.read, createdAt: r.created_at,
})
const mapTimeEntry = r => ({
  id: r.id, taskId: r.task_id, startTime: r.start_time,
  endTime: r.end_time, duration: r.duration || 0,
})

// ── Mapeamento App → DB ──────────────────────────────────────
const taskRow = t => ({
  title: t.title, client: t.client || '', tag: t.tag || '',
  tag_color: t.tagColor || 'green', priority: t.priority || 'Normal',
  date: t.date || '', notes: t.notes || '', done: t.done || false,
  task_status: t.taskStatus || 'pendente',
})
const clientRow = c => ({
  initials: c.initials || '', name: c.name, segment: c.segment || '',
  email: c.email || '', status: c.status || 'Ativo',
  status_color: c.statusColor || 'green', tags: c.tags || [],
  color: c.color || '#2D6A4F', archived: c.archived || false,
})
const noteRow = n => ({
  title: n.title, content: n.content || '', project: n.project || '',
  color: n.color || 'yellow', date: n.date || new Date().toISOString().slice(0, 10),
  type: n.type || 'text', items: n.items || [], pinned: n.pinned || false,
})

export function AppProvider({ children }) {
  const [appLoading, setAppLoading] = useState(true)
  const [tasks, setTasksState]         = useState([])
  const [clients, setClientsState]     = useState([])
  const [notes, setNotesState]         = useState([])
  const [comments, setCommentsState]   = useState({})
  const [notifications, setNotifications] = useState([])
  const [activityLog, setActivityLog]  = useState([])
  const [timeEntries, setTimeEntries]  = useState([])
  const [activeTimer, setActiveTimer]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('fd_activeTimer')) } catch { return null }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('fd_theme') || 'light')
  const [searchQuery, setSearchQuery]  = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('fd_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('fd_activeTimer', JSON.stringify(activeTimer))
  }, [activeTimer])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      // Fase 1 — dados críticos (desbloqueia a UI imediatamente)
      const [tRes, cRes, nRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      ])
      if (tRes.data) setTasksState(tRes.data.map(mapTask))
      if (cRes.data) setClientsState(cRes.data.map(mapClient))
      if (nRes.data) setNotesState(nRes.data.map(mapNote))
      setAppLoading(false) // mostra o app sem esperar dados secundários

      // Fase 2 — dados secundários (background)
      const [cmRes, aRes, eRes] = await Promise.all([
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('time_entries').select('*'),
      ])
      if (cmRes.data) {
        const grouped = {}
        cmRes.data.forEach(c => {
          if (!grouped[c.task_id]) grouped[c.task_id] = []
          grouped[c.task_id].push(mapComment(c))
        })
        setCommentsState(grouped)
      }
      if (aRes.data) setActivityLog(aRes.data.map(mapActivity))
      if (eRes.data) setTimeEntries(eRes.data.map(mapTimeEntry))

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: nf } = await supabase.from('notifications')
          .select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(30)
        if (nf) setNotifications(nf.map(mapNotification))
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err)
      setAppLoading(false)
    }
  }

  function toggleTheme() { setTheme(t => t === 'light' ? 'dark' : 'light') }

  // ── INTERNAL HELPERS ──
  const _notify = useCallback(async (icon, message, type = 'info') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('notifications')
      .insert({ user_id: user.id, icon, message, type, read: false })
      .select().single()
    if (data) setNotifications(prev => [mapNotification(data), ...prev].slice(0, 30))
  }, [])

  const _log = useCallback(async (actor, action, entityType, entityTitle) => {
    const local = {
      id: -Date.now(), userName: actor?.name || 'Sistema',
      userColor: actor?.color || '#6B6960', action, entityType, entityTitle,
      createdAt: new Date().toISOString(),
    }
    setActivityLog(prev => [local, ...prev].slice(0, 50))
    if (actor?.id) {
      const { data } = await supabase.from('activity_log').insert({
        user_id: actor.id, user_name: actor.name, user_color: actor.color,
        action, entity_type: entityType, entity_title: entityTitle,
      }).select().single()
      if (data) setActivityLog(prev => prev.map(e => e.id === local.id ? mapActivity(data) : e))
    }
  }, [])

  // ── TASKS ──
  async function addTask(data, actor) {
    const tmp = { ...data, id: -Date.now(), done: false, taskStatus: data.taskStatus || 'pendente' }
    setTasksState(prev => [tmp, ...prev])
    const { data: row } = await supabase.from('tasks').insert({
      ...taskRow(tmp), created_by: actor?.id
    }).select().single()
    if (row) setTasksState(prev => prev.map(t => t.id === tmp.id ? mapTask(row) : t))
    _notify('✅', `Nova tarefa criada: ${data.title}`, 'task.created')
    if (actor) _log(actor, 'criou a tarefa', 'tarefa', data.title)
  }

  async function editTask(id, data, actor) {
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    await supabase.from('tasks').update(taskRow({ ...data, taskStatus: data.taskStatus })).eq('id', id)
    if (actor) _log(actor, 'editou a tarefa', 'tarefa', data.title || '')
  }

  async function deleteTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.filter(t => t.id !== id))
    setCommentsState(prev => { const c = { ...prev }; delete c[id]; return c })
    await supabase.from('tasks').delete().eq('id', id)
    if (actor && task) _log(actor, 'removeu a tarefa', 'tarefa', task.title)
  }

  async function toggleTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const done = !task.done
    const taskStatus = done ? 'concluido' : 'pendente'
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, done, taskStatus } : t))
    await supabase.from('tasks').update({ done, task_status: taskStatus }).eq('id', id)
    if (actor) {
      _notify(done ? '🏁' : '↩', done ? `Tarefa concluída: ${task.title}` : `Tarefa reaberta: ${task.title}`, done ? 'task.done' : 'task.reopened')
      _log(actor, done ? 'concluiu a tarefa' : 'reabriu a tarefa', 'tarefa', task.title)
    }
  }

  async function moveTask(id, newStatus, actor) {
    const task = tasks.find(t => t.id === id)
    const done = newStatus === 'concluido'
    setTasksState(prev => prev.map(t => t.id !== id ? t : { ...t, taskStatus: newStatus, done }))
    await supabase.from('tasks').update({ task_status: newStatus, done }).eq('id', id)
    if (actor && task) {
      const colLabel = KANBAN_COLUMNS.find(c => c.id === newStatus)?.label || newStatus
      _notify('🔀', `Tarefa movida para ${colLabel}: ${task.title}`, 'task.moved')
      _log(actor, `moveu para ${colLabel}`, 'tarefa', task.title)
    }
  }

  // ── CLIENTS ──
  async function addClient(data) {
    const tmp = { ...data, id: -Date.now(), archived: false }
    setClientsState(prev => [...prev, tmp])
    const { data: row } = await supabase.from('clients').insert(clientRow(tmp)).select().single()
    if (row) setClientsState(prev => prev.map(c => c.id === tmp.id ? mapClient(row) : c))
  }

  async function editClient(id, data) {
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    await supabase.from('clients').update(clientRow({ ...data })).eq('id', id)
  }

  async function archiveClient(id) {
    const client = clients.find(c => c.id === id)
    const archived = !(client?.archived)
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, archived } : c))
    await supabase.from('clients').update({ archived }).eq('id', id)
  }

  // ── NOTES ──
  async function addNote(data) {
    const n = {
      ...data, id: -Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: data.type || 'text', items: data.items || [], pinned: false,
    }
    setNotesState(prev => [n, ...prev])
    const { data: row } = await supabase.from('notes').insert(noteRow(n)).select().single()
    if (row) setNotesState(prev => prev.map(x => x.id === n.id ? mapNote(row) : x))
  }

  async function editNote(id, data) {
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
    const note = notes.find(n => n.id === id)
    await supabase.from('notes').update(noteRow({ ...note, ...data })).eq('id', id)
  }

  async function deleteNote(id) {
    setNotesState(prev => prev.filter(n => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  async function toggleNoteItem(noteId, itemId) {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const items = note.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it)
    setNotesState(prev => prev.map(n => n.id === noteId ? { ...n, items } : n))
    await supabase.from('notes').update({ items }).eq('id', noteId)
  }

  async function pinNote(id) {
    const note = notes.find(n => n.id === id)
    if (!note) return
    const pinned = !note.pinned
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, pinned } : n))
    await supabase.from('notes').update({ pinned }).eq('id', id)
  }

  // ── COMMENTS ──
  async function addComment(taskId, text, actor) {
    if (!actor) return
    const { data: row } = await supabase.from('comments').insert({
      task_id: taskId, user_id: actor.id, user_name: actor.name,
      user_color: actor.color, user_initials: actor.initials, text,
    }).select().single()
    if (row) {
      setCommentsState(prev => ({
        ...prev, [taskId]: [...(prev[taskId] || []), mapComment(row)],
      }))
    }
    const task = tasks.find(t => t.id === taskId)
    _notify('💬', `Novo comentário em: ${task?.title || 'tarefa'}`, 'comment.added')
  }

  async function deleteComment(taskId, commentId) {
    setCommentsState(prev => ({
      ...prev, [taskId]: (prev[taskId] || []).filter(c => c.id !== commentId),
    }))
    await supabase.from('comments').delete().eq('id', commentId)
  }

  function getComments(taskId) { return comments[taskId] || [] }

  // ── NOTIFICATIONS ──
  async function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }
  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
  }

  // ── TIME TRACKING ──
  async function startTimer(taskId, actor) {
    if (activeTimer) await stopTimer(actor)
    setActiveTimer({ taskId, startTime: Date.now() })
    const task = tasks.find(t => t.id === taskId)
    if (actor) _notify('⏱', `Timer iniciado: ${task?.title || 'tarefa'}`, 'timer.start')
  }

  async function stopTimer(actor) {
    if (!activeTimer) return
    const duration = Date.now() - activeTimer.startTime
    const entry = { id: -Date.now(), taskId: activeTimer.taskId, startTime: activeTimer.startTime, endTime: Date.now(), duration }
    setTimeEntries(prev => [...prev, entry])
    setActiveTimer(null)
    const task = tasks.find(t => t.id === activeTimer.taskId)
    const { data: row } = await supabase.from('time_entries').insert({
      task_id: activeTimer.taskId, task_title: task?.title || '',
      user_id: actor?.id, start_time: activeTimer.startTime,
      end_time: Date.now(), duration,
    }).select().single()
    if (row) setTimeEntries(prev => prev.map(e => e.id === entry.id ? mapTimeEntry(row) : e))
    if (actor) _notify('⏹', `Timer parado: ${task?.title || 'tarefa'} (${formatDuration(duration)})`, 'timer.stop')
  }

  function getTaskTotalTime(taskId) {
    const total = timeEntries.filter(e => e.taskId === taskId).reduce((s, e) => s + (e.duration || 0), 0)
    const current = activeTimer?.taskId === taskId ? Date.now() - activeTimer.startTime : 0
    return total + current
  }

  const activeClients  = clients.filter(c => !c.archived)
  const unreadCount    = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      appLoading,
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
