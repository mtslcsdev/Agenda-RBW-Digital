import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

// ── Row mappers (snake_case DB → camelCase app) ──────────────
function mapTask(r) {
  return {
    id: r.id, title: r.title, client: r.client || '', tag: r.tag || '',
    tagColor: r.tag_color || 'green', priority: r.priority || 'Normal',
    date: r.date || '', notes: r.notes || '', done: r.done || false,
    taskStatus: r.task_status || 'pendente',
  }
}

function mapClient(r) {
  return {
    id: r.id, initials: r.initials || '', name: r.name, segment: r.segment || '',
    email: r.email || '', status: r.status || 'Ativo', statusColor: r.status_color || 'green',
    tags: r.tags || [], color: r.color || '#2D6A4F', archived: r.archived || false,
  }
}

function mapNote(r) {
  return {
    id: r.id, title: r.title, content: r.content || '', project: r.project || '',
    color: r.color || 'yellow', date: r.date || r.created_at?.slice(0, 10) || '',
    type: r.type || 'text', items: r.items || [], pinned: r.pinned || false,
  }
}

function mapComment(r) {
  return {
    id: r.id, userId: r.user_id, userName: r.user_name, userColor: r.user_color,
    userInitials: r.user_initials, text: r.text, createdAt: r.created_at,
  }
}

function mapEntry(r) {
  return {
    id: r.id, taskId: r.task_id, taskTitle: r.task_title,
    startTime: r.start_time, endTime: r.end_time, duration: r.duration,
  }
}

function mapActivity(r) {
  return {
    id: r.id, userName: r.user_name, userColor: r.user_color,
    action: r.action, entityType: r.entity_type, entityTitle: r.entity_title,
    createdAt: r.created_at,
  }
}

function mapNotification(r) {
  return { id: r.id, icon: r.icon, message: r.message, type: r.type, read: r.read, createdAt: r.created_at }
}

export function AppProvider({ children }) {
  const [loaded, setLoaded] = useState(false)
  const [tasks, setTasksState] = useState([])
  const [clients, setClientsState] = useState([])
  const [notes, setNotesState] = useState([])
  const [comments, setCommentsState] = useState({})
  const [notifications, setNotifications] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [timeEntries, setTimeEntries] = useState([])
  const [activeTimer, setActiveTimer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fd_activeTimer')) } catch { return null }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('fd_theme') || 'light')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('fd_theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('fd_activeTimer', JSON.stringify(activeTimer)) }, [activeTimer])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [tasksRes, clientsRes, notesRes, commentsRes, activityRes, entriesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('comments').select('*').order('created_at'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('time_entries').select('*'),
      ])

      if (tasksRes.data) setTasksState(tasksRes.data.map(mapTask))
      if (clientsRes.data) setClientsState(clientsRes.data.map(mapClient))
      if (notesRes.data) setNotesState(notesRes.data.map(mapNote))
      if (commentsRes.data) {
        const grouped = {}
        commentsRes.data.forEach(c => {
          if (!grouped[c.task_id]) grouped[c.task_id] = []
          grouped[c.task_id].push(mapComment(c))
        })
        setCommentsState(grouped)
      }
      if (activityRes.data) setActivityLog(activityRes.data.map(mapActivity))
      if (entriesRes.data) setTimeEntries(entriesRes.data.map(mapEntry))

      // Notifications: per user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: notifs } = await supabase.from('notifications').select('*')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
        if (notifs) setNotifications(notifs.map(mapNotification))
      }
    } catch (e) {
      console.error('Supabase load error:', e)
    }
    setLoaded(true)
  }

  function toggleTheme() { setTheme(t => t === 'light' ? 'dark' : 'light') }

  // ── INTERNAL HELPERS ────────────────────────────────────────
  const _notify = useCallback(async (icon, message, type = 'info') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const n = { icon, message, type, read: false, user_id: user.id }
    const { data: row } = await supabase.from('notifications').insert(n).select().single()
    if (row) setNotifications(prev => [mapNotification(row), ...prev].slice(0, 30))
  }, [])

  const _log = useCallback(async (userName, userColor, action, entityType, entityTitle) => {
    const { data: { user } } = await supabase.auth.getUser()
    const entry = { user_id: user?.id, user_name: userName, user_color: userColor || '#6B6960', action, entity_type: entityType, entity_title: entityTitle }
    const { data: row } = await supabase.from('activity_log').insert(entry).select().single()
    if (row) setActivityLog(prev => [mapActivity(row), ...prev].slice(0, 50))
  }, [])

  // ── TASKS ────────────────────────────────────────────────────
  async function addTask(data, actor) {
    const tempId = `temp_${Date.now()}`
    const optimistic = { ...data, id: tempId, done: false, taskStatus: data.taskStatus || 'pendente' }
    setTasksState(prev => [optimistic, ...prev])

    const { data: { user } } = await supabase.auth.getUser()
    const { data: row } = await supabase.from('tasks').insert({
      title: data.title, client: data.client || '', tag: data.tag || '',
      tag_color: data.tagColor || 'green', priority: data.priority || 'Normal',
      date: data.date || null, notes: data.notes || '', done: false,
      task_status: data.taskStatus || 'pendente', created_by: user?.id,
    }).select().single()

    if (row) setTasksState(prev => prev.map(t => t.id === tempId ? mapTask(row) : t))
    _notify('✅', `Nova tarefa criada: ${data.title}`, 'task.created')
    if (actor) _log(actor.name, actor.color, 'criou a tarefa', 'tarefa', data.title)
  }

  async function editTask(id, data, actor) {
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    await supabase.from('tasks').update({
      title: data.title, client: data.client, tag: data.tag,
      tag_color: data.tagColor, priority: data.priority, date: data.date || null,
      notes: data.notes, done: data.done, task_status: data.taskStatus,
    }).eq('id', id)
    if (actor) _log(actor.name, actor.color, 'editou a tarefa', 'tarefa', data.title || '')
  }

  async function deleteTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.filter(t => t.id !== id))
    setCommentsState(prev => { const c = { ...prev }; delete c[id]; return c })
    await supabase.from('tasks').delete().eq('id', id)
    if (actor && task) _log(actor.name, actor.color, 'removeu a tarefa', 'tarefa', task.title)
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
      _log(actor.name, actor.color, done ? 'concluiu a tarefa' : 'reabriu a tarefa', 'tarefa', task.title)
    }
  }

  async function moveTask(id, newStatus, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.map(t => t.id !== id ? t : { ...t, taskStatus: newStatus, done: newStatus === 'concluido' }))
    await supabase.from('tasks').update({ task_status: newStatus, done: newStatus === 'concluido' }).eq('id', id)
    if (actor && task) {
      const colLabel = KANBAN_COLUMNS.find(c => c.id === newStatus)?.label || newStatus
      _notify('🔀', `Tarefa movida para ${colLabel}: ${task.title}`, 'task.moved')
      _log(actor.name, actor.color, `moveu para ${colLabel}`, 'tarefa', task.title)
    }
  }

  // ── CLIENTS ──────────────────────────────────────────────────
  async function addClient(data) {
    const tempId = `temp_${Date.now()}`
    setClientsState(prev => [...prev, { ...data, id: tempId, archived: false }])
    const { data: row } = await supabase.from('clients').insert({
      initials: data.initials, name: data.name, segment: data.segment || '',
      email: data.email || '', status: data.status || 'Ativo',
      status_color: data.statusColor || 'green', tags: data.tags || [],
      color: data.color || '#2D6A4F', archived: false,
    }).select().single()
    if (row) setClientsState(prev => prev.map(c => c.id === tempId ? mapClient(row) : c))
  }

  async function editClient(id, data) {
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    await supabase.from('clients').update({
      initials: data.initials, name: data.name, segment: data.segment,
      email: data.email, status: data.status, status_color: data.statusColor,
      tags: data.tags, color: data.color,
    }).eq('id', id)
  }

  async function archiveClient(id) {
    const client = clients.find(c => c.id === id)
    const archived = !client?.archived
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, archived } : c))
    await supabase.from('clients').update({ archived }).eq('id', id)
  }

  // ── NOTES ────────────────────────────────────────────────────
  async function addNote(data) {
    const tempId = `temp_${Date.now()}`
    const today = new Date().toISOString().slice(0, 10)
    const optimistic = { ...data, id: tempId, date: today, type: data.type || 'text', items: data.items || [], pinned: false }
    setNotesState(prev => [optimistic, ...prev])
    const { data: row } = await supabase.from('notes').insert({
      title: data.title, content: data.content || '', project: data.project || '',
      color: data.color || 'yellow', date: today, type: data.type || 'text',
      items: data.items || [], pinned: false,
    }).select().single()
    if (row) setNotesState(prev => prev.map(n => n.id === tempId ? mapNote(row) : n))
  }

  async function editNote(id, data) {
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
    await supabase.from('notes').update({
      title: data.title, content: data.content, project: data.project,
      color: data.color, type: data.type, items: data.items, pinned: data.pinned,
    }).eq('id', id)
  }

  async function deleteNote(id) {
    setNotesState(prev => prev.filter(n => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  async function toggleNoteItem(noteId, itemId) {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const newItems = note.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it)
    setNotesState(prev => prev.map(n => n.id === noteId ? { ...n, items: newItems } : n))
    await supabase.from('notes').update({ items: newItems }).eq('id', noteId)
  }

  async function pinNote(id) {
    const note = notes.find(n => n.id === id)
    if (!note) return
    const pinned = !note.pinned
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, pinned } : n))
    await supabase.from('notes').update({ pinned }).eq('id', id)
  }

  // ── COMMENTS ─────────────────────────────────────────────────
  async function addComment(taskId, text, actor) {
    const { data: { user } } = await supabase.auth.getUser()
    const row = {
      task_id: taskId, user_id: user?.id, user_name: actor?.name || 'Anônimo',
      user_color: actor?.color || '#6B6960', user_initials: actor?.initials || '?', text,
    }
    const { data: saved } = await supabase.from('comments').insert(row).select().single()
    if (saved) {
      setCommentsState(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), mapComment(saved)] }))
    }
    const task = tasks.find(t => t.id === taskId)
    _notify('💬', `Novo comentário em: ${task?.title || 'tarefa'}`, 'comment.added')
  }

  async function deleteComment(taskId, commentId) {
    setCommentsState(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(c => c.id !== commentId) }))
    await supabase.from('comments').delete().eq('id', commentId)
  }

  function getComments(taskId) { return comments[taskId] || [] }

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  async function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (ids.length) await supabase.from('notifications').update({ read: true }).in('id', ids)
  }

  // ── TIME TRACKING ─────────────────────────────────────────────
  async function startTimer(taskId, actor) {
    if (activeTimer) await stopTimer(actor)
    setActiveTimer({ taskId, startTime: Date.now() })
    const task = tasks.find(t => t.id === taskId)
    if (actor) _notify('⏱', `Timer iniciado: ${task?.title || 'tarefa'}`, 'timer.start')
  }

  async function stopTimer(actor) {
    if (!activeTimer) return
    const duration = Date.now() - activeTimer.startTime
    const task = tasks.find(t => t.id === activeTimer.taskId)
    const { data: { user } } = await supabase.auth.getUser()
    const entry = {
      task_id: activeTimer.taskId, task_title: task?.title || '',
      user_id: user?.id, start_time: activeTimer.startTime,
      end_time: Date.now(), duration,
    }
    const { data: row } = await supabase.from('time_entries').insert(entry).select().single()
    if (row) setTimeEntries(prev => [...prev, mapEntry(row)])
    setActiveTimer(null)
    if (actor) _notify('⏹', `Timer parado: ${task?.title || 'tarefa'} (${formatDuration(duration)})`, 'timer.stop')
  }

  function getTaskTotalTime(taskId) {
    const total = timeEntries.filter(e => e.taskId === taskId).reduce((sum, e) => sum + e.duration, 0)
    const current = activeTimer?.taskId === taskId ? Date.now() - activeTimer.startTime : 0
    return total + current
  }

  const activeClients = clients.filter(c => !c.archived)
  const unreadCount = notifications.filter(n => !n.read).length

  if (!loaded) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', color: 'var(--text3)',
        fontSize: '13px', gap: '8px',
      }}>
        <div style={{ width: '16px', height: '16px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Carregando dados...
      </div>
    )
  }

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
