import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export const TAG_COLORS = {
  GHL: 'green', N8N: 'orange', Vendas: 'purple',
  Reunião: 'yellow', Dev: 'green', Pessoal: 'purple',
}
export const TAG_OPTIONS = ['GHL', 'N8N', 'Vendas', 'Reunião', 'Dev', 'Pessoal']
export const CLIENT_COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']
export const PRIORITY_COLORS = { Normal: null, Alta: 'var(--accent2)', Urgente: 'var(--red)' }
// As colunas do quadro deixaram de ser fixas no código: agora vêm da tabela
// board_columns e podem ser criadas, renomeadas e reordenadas pela interface.
export const COLUMN_COLORS = [
  '#6B6960', '#E07A3A', '#2D6A4F', '#5B4FCF', '#D94F3D', '#E8A923', '#3A7CA5',
]
// Espaçamento entre posições. Inserções usam a média entre vizinhos, então
// esse valor só precisa ser grande o bastante para não esgotar a precisão.
const POSITION_GAP = 1000
export const STATUS_OPTIONS = [
  { label: 'Em andamento', color: 'orange' },
  { label: 'Ativo',        color: 'green' },
  { label: 'Onboarding',   color: 'yellow' },
  { label: 'Pausado',      color: 'red' },
  { label: 'Concluído',    color: 'purple' },
]

// ── Mappers DB → App ──────────────────────────────────────────
const mapTask = r => ({
  id: r.id,
  title: r.title,
  client: r.client || '',         // string legada (manter para compatibilidade)
  client_id: r.client_id || null, // FK novo
  tag: r.tag || '',
  tagColor: r.tag_color || 'green',
  priority: r.priority || 'Normal',
  date: r.date || '',
  notes: r.notes || '',
  done: r.done || false,
  taskStatus: r.task_status || 'pendente',
  columnId: r.column_id ?? null,
  position: r.position != null ? Number(r.position) : 0,
  archived: r.archived || false,
  assigneeName: r.assignee_name || '',
  assignee_id: r.assignee_id || null,
})
const mapClient = r => ({
  id: r.id, initials: r.initials || '', name: r.name,
  segment: r.segment || '', email: r.email || '',
  status: r.status || 'Ativo', statusColor: r.status_color || 'green',
  tags: r.tags || [], color: r.color || '#2D6A4F',
  archived: r.archived || false, hidden: r.hidden || false,
  responsible: r.responsible || '', contract: r.contract || '',
  monthlyValue: r.monthly_value || '',
})
const mapNote = r => ({
  id: r.id, title: r.title, content: r.content || '',
  project: r.project || '', color: r.color || 'yellow',
  date: r.date || r.created_at?.slice(0, 10) || '',
  type: r.type || 'text', items: r.items || [],
  pinned: r.pinned || false, archived: r.archived || false,
})
const mapColumn = r => ({
  id: r.id,
  label: r.label,
  color: r.color || '#6B6960',
  position: Number(r.position),
  isDone: r.is_done || false,
  archived: r.archived || false,
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
const mapFolder = r => ({
  id: r.id, name: r.name, clientId: r.client_id || null,
  color: r.color || '#2D6A4F', createdAt: r.created_at,
})
const mapDoc = r => ({
  id: r.id, title: r.title || 'Sem título', content: r.content || '',
  folderId: r.folder_id || null, clientId: r.client_id || null,
  linkedTaskIds: r.linked_task_ids || [],
  authorId: r.author_id || '', authorName: r.author_name || '',
  authorColor: r.author_color || '',
  createdAt: r.created_at, updatedAt: r.updated_at,
})

// ── Mappers App → DB ──────────────────────────────────────────
const taskRow = t => ({
  title: t.title, client: t.client || '', client_id: t.client_id || null,
  tag: t.tag || '', tag_color: t.tagColor || 'green',
  priority: t.priority || 'Normal', date: t.date || '',
  notes: t.notes || '', done: t.done || false,
  task_status: t.taskStatus || 'pendente',
  column_id: t.columnId ?? null,
  position: t.position ?? 1000,
  assignee_name: t.assigneeName || '', assignee_id: t.assignee_id || null,
})
const clientRow = c => ({
  initials: c.initials || '', name: c.name, segment: c.segment || '',
  email: c.email || '', status: c.status || 'Ativo',
  status_color: c.statusColor || 'green', tags: c.tags || [],
  color: c.color || '#2D6A4F', archived: c.archived || false,
  responsible: c.responsible || '', contract: c.contract || '',
  monthly_value: c.monthlyValue || '',
})
const noteRow = n => ({
  title: n.title, content: n.content || '', project: n.project || '',
  color: n.color || 'yellow', date: n.date || new Date().toISOString().slice(0, 10),
  type: n.type || 'text', items: n.items || [], pinned: n.pinned || false,
})

export function AppProvider({ children }) {
  const [appLoading, setAppLoading]       = useState(false)
  const [tasks, setTasksState]            = useState([])
  const [clients, setClientsState]        = useState([])
  const [notes, setNotesState]            = useState([])
  const [comments, setCommentsState]      = useState({})
  const [notifications, setNotifications] = useState([])
  const [activityLog, setActivityLog]     = useState([])
  const [timeEntries, setTimeEntries]     = useState([])
  const [docs, setDocsState]              = useState([])
  const [folders, setFoldersState]        = useState([])
  const [columns, setColumnsState]        = useState([])
  const [activeTimer, setActiveTimer]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('fd_activeTimer')) } catch { return null }
  })
  const [theme, setTheme] = useState(() => localStorage.getItem('fd_theme') || 'light')
  const [searchQuery, setSearchQuery]     = useState('')
  const realtimeRef = useRef([])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('fd_theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('fd_activeTimer', JSON.stringify(activeTimer))
  }, [activeTimer])

  // ── Carregamento em background ────────────────────────────────
  useEffect(() => {
    loadAll({ notify: true }).then(() => setupRealtime())

    // O realtime do Supabase abre um socket próprio e não envia o header de
    // sessão que as policies exigem, então ele pode não entregar eventos.
    // Para o quadro não ficar defasado entre as pessoas, recarregamos quando a
    // aba volta ao foco e periodicamente enquanto ela estiver visível.
    function refresh() {
      if (document.visibilityState === 'visible') loadAll()
    }
    const interval = setInterval(refresh, 45000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      realtimeRef.current.forEach(ch => supabase.removeChannel(ch))
    }
  }, [])

  // `notify` só é ligado no primeiro carregamento — senão os avisos de prazo
  // reapareceriam a cada recarga automática.
  async function loadAll({ notify = false } = {}) {
    try {
      // Fase 1 — crítica (colunas, tasks, clients, notes)
      const [colRes, tRes, cRes, nRes] = await Promise.all([
        supabase.from('board_columns').select('*').eq('archived', false).order('position'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      ])
      if (colRes.data) setColumnsState(colRes.data.map(mapColumn))
      if (tRes.data) setTasksState(tRes.data.map(mapTask))
      if (cRes.data) setClientsState(cRes.data.map(mapClient))
      if (nRes.data) setNotesState(nRes.data.map(mapNote))

      // Notificações de prazo ao carregar
      const today = new Date().toISOString().slice(0, 10)
      if (notify) {
        const overdue  = tRes.data?.filter(t => t.date && t.date < today && !t.done) || []
        const dueToday = tRes.data?.filter(t => t.date === today && !t.done) || []
        if (overdue.length)   _notify('⚠️', `${overdue.length} tarefa${overdue.length > 1 ? 's' : ''} em atraso!`, 'overdue')
        if (dueToday.length)  _notify('📅', `${dueToday.length} tarefa${dueToday.length > 1 ? 's' : ''} vencem hoje!`, 'deadline')
      }

      // Fase 2 — background (comments, activity, time)
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

      // Fase 3 — docs e pastas
      const [fRes, dRes] = await Promise.all([
        supabase.from('folders').select('*').order('created_at', { ascending: true }),
        supabase.from('docs').select('*').order('updated_at', { ascending: false }),
      ])
      if (fRes.data) setFoldersState(fRes.data.map(mapFolder))
      if (dRes.data) setDocsState(dRes.data.map(mapDoc))

    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
  }

  // ── Realtime Supabase ─────────────────────────────────────────
  function setupRealtime() {
    // Tasks — atualiza em tempo real para todos os usuários
    const tasksCh = supabase
      .channel('realtime:tasks')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, ({ new: row }) => {
        setTasksState(prev => prev.find(t => t.id === row.id) ? prev : [mapTask(row), ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, ({ new: row }) => {
        setTasksState(prev => prev.map(t => t.id === row.id ? mapTask(row) : t))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks' }, ({ old }) => {
        setTasksState(prev => prev.filter(t => t.id !== old.id))
      })
      .subscribe()

    // Comments — realtime para colaboração
    const commentsCh = supabase
      .channel('realtime:comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, ({ new: row }) => {
        setCommentsState(prev => ({
          ...prev,
          [row.task_id]: [...(prev[row.task_id] || []), mapComment(row)],
        }))
        const task = null // não temos tasks aqui facilmente; notificação genérica
        _notify('💬', 'Novo comentário em uma tarefa', 'comment.added')
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, ({ old }) => {
        setCommentsState(prev => {
          const updated = { ...prev }
          Object.keys(updated).forEach(taskId => {
            updated[taskId] = updated[taskId].filter(c => c.id !== old.id)
          })
          return updated
        })
      })
      .subscribe()

    // Clients — atualiza lista de clientes em tempo real
    const clientsCh = supabase
      .channel('realtime:clients')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, ({ new: row }) => {
        setClientsState(prev => prev.find(c => c.id === row.id) ? prev : [...prev, mapClient(row)])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, ({ new: row }) => {
        setClientsState(prev => prev.map(c => c.id === row.id ? mapClient(row) : c))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, ({ old }) => {
        setClientsState(prev => prev.filter(c => c.id !== old.id))
      })
      .subscribe()

    realtimeRef.current = [tasksCh, commentsCh, clientsCh]
  }

  function toggleTheme() { setTheme(t => t === 'light' ? 'dark' : 'light') }

  // ── Helpers internos ──────────────────────────────────────────
  const _notify = useCallback((icon, message, type = 'info') => {
    setNotifications(prev => [{
      id: Date.now() + Math.random(), icon, message, type,
      read: false, createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 30))
  }, [])

  const _log = useCallback((actor, action, entityType, entityTitle) => {
    const entry = {
      id: Date.now() + Math.random(),
      userName: actor?.name || 'Sistema',
      userColor: actor?.color || '#6B6960',
      action, entityType, entityTitle,
      createdAt: new Date().toISOString(),
    }
    setActivityLog(prev => [entry, ...prev].slice(0, 50))
    // Persiste no banco de forma assíncrona (best-effort)
    supabase.from('activity_log').insert({
      user_id: actor?.id, user_name: actor?.name || 'Sistema',
      user_color: actor?.color || '#6B6960',
      action, entity_type: entityType, entity_title: entityTitle,
    }).then(() => {})
  }, [])

  // ── TASKS ─────────────────────────────────────────────────────
  async function addTask(data, actor) {
    const columnId = data.columnId ?? columns[0]?.id ?? null
    const tmp = {
      ...data,
      id: 'tmp-' + Date.now(),
      done: false,
      taskStatus: data.taskStatus || 'pendente',
      columnId,
      position: posicaoNoTopo(columnId),
    }
    setTasksState(prev => [tmp, ...prev])
    const { data: row } = await supabase
      .from('tasks')
      .insert({ ...taskRow(tmp), created_by: actor?.id })
      .select().single()
    if (row) setTasksState(prev => prev.map(t => t.id === tmp.id ? mapTask(row) : t))
    _notify('✅', `Nova tarefa: ${data.title}`, 'task.created')
    if (actor) _log(actor, 'criou a tarefa', 'tarefa', data.title)
  }

  async function editTask(id, data, actor) {
    // Mescla com a tarefa atual antes de gravar: taskRow preenche o que estiver
    // faltando com valores padrão, então enviar só o que veio do formulário
    // apagaria coluna, posição e demais campos fora do modal.
    const atual = tasks.find(t => t.id === id)
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    await supabase.from('tasks').update(taskRow({ ...atual, ...data })).eq('id', id)
    if (actor) _log(actor, 'editou a tarefa', 'tarefa', data.title || atual?.title || '')
  }

  async function deleteTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.filter(t => t.id !== id))
    setCommentsState(prev => { const c = { ...prev }; delete c[id]; return c })
    await supabase.from('tasks').delete().eq('id', id)
    if (actor && task) _log(actor, 'removeu a tarefa', 'tarefa', task.title)
  }

  // Posição para inserir no topo de uma coluna
  function posicaoNoTopo(columnId) {
    const naColuna = tasks.filter(t => t.columnId === columnId && !t.archived)
    if (!naColuna.length) return POSITION_GAP
    return Math.min(...naColuna.map(t => t.position)) - POSITION_GAP
  }

  async function toggleTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const done = !task.done
    // Concluir move o card para a coluna marcada como "concluído"; reabrir
    // devolve para a primeira coluna que não seja de conclusão.
    const alvo = columns.find(c => (done ? c.isDone : !c.isDone))

    if (alvo && alvo.id !== task.columnId) {
      await moveTask(id, alvo.id, posicaoNoTopo(alvo.id), null)
    } else {
      setTasksState(prev => prev.map(t => t.id === id ? { ...t, done } : t))
      await supabase.from('tasks').update({ done }).eq('id', id)
    }

    if (actor) {
      _notify(done ? '🏁' : '↩', done ? `Concluída: ${task.title}` : `Reaberta: ${task.title}`, done ? 'task.done' : 'task.reopened')
      _log(actor, done ? 'concluiu a tarefa' : 'reabriu a tarefa', 'tarefa', task.title)
    }
  }

  // Move um card para outra coluna e/ou outra posição. `novaPosicao` já vem
  // calculada pelo quadro (média entre os vizinhos do destino), então aqui só
  // gravamos. Se o servidor recusar, desfazemos a mudança na tela.
  async function moveTask(id, columnId, novaPosicao, actor) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const col       = columns.find(c => c.id === columnId)
    const done      = col ? col.isDone : task.done
    const anterior  = { columnId: task.columnId, position: task.position, done: task.done }
    const mudouCol  = anterior.columnId !== columnId

    setTasksState(prev => prev.map(t =>
      t.id !== id ? t : { ...t, columnId, position: novaPosicao, done }))

    const { error } = await supabase
      .from('tasks')
      .update({ column_id: columnId, position: novaPosicao, done })
      .eq('id', id)

    if (error) {
      setTasksState(prev => prev.map(t => t.id !== id ? t : { ...t, ...anterior }))
      _notify('⚠️', 'Não foi possível mover a tarefa.', 'error')
      return
    }

    if (actor && col && mudouCol) {
      _notify('🔀', `Movida para ${col.label}: ${task.title}`, 'task.moved')
      _log(actor, `moveu para ${col.label}`, 'tarefa', task.title)
    }
  }

  async function archiveTask(id) {
    const archived = !(tasks.find(t => t.id === id)?.archived)
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, archived } : t))
    await supabase.from('tasks').update({ archived }).eq('id', id)
  }

  // Renumera uma coluna inteira com espaçamento regular. Serve de escape para
  // quando as inserções fracionárias sucessivas deixam os vizinhos próximos
  // demais para caber outro valor entre eles.
  async function reorderColumn(columnId, idsOrdenados) {
    const novos = idsOrdenados.map((id, i) => ({ id, position: (i + 1) * POSITION_GAP }))
    setTasksState(prev => prev.map(t => {
      const novo = novos.find(n => n.id === t.id)
      return novo ? { ...t, columnId, position: novo.position } : t
    }))
    await Promise.all(novos.map(n =>
      supabase.from('tasks').update({ column_id: columnId, position: n.position }).eq('id', n.id)
    ))
  }

  // ── COLUNAS DO QUADRO ─────────────────────────────────────────
  const ordenarColunas = lista => [...lista].sort((a, b) => a.position - b.position)

  async function addColumn(label) {
    const nome = (label || '').trim()
    if (!nome) return { ok: false, error: 'Dê um nome à coluna.' }

    const position = columns.length
      ? Math.max(...columns.map(c => c.position)) + POSITION_GAP
      : POSITION_GAP
    const color = COLUMN_COLORS[columns.length % COLUMN_COLORS.length]

    const { data: row, error } = await supabase
      .from('board_columns').insert({ label: nome, color, position }).select().single()
    if (error) return { ok: false, error: error.message }

    setColumnsState(prev => ordenarColunas([...prev, mapColumn(row)]))
    return { ok: true }
  }

  async function updateColumn(id, patch) {
    const anterior = columns.find(c => c.id === id)
    if (!anterior) return { ok: false, error: 'Coluna não encontrada.' }
    if (patch.label !== undefined && !patch.label.trim())
      return { ok: false, error: 'O nome não pode ficar vazio.' }

    setColumnsState(prev => ordenarColunas(
      prev.map(c => c.id === id ? { ...c, ...patch } : c)))

    const row = {}
    if (patch.label    !== undefined) row.label    = patch.label.trim()
    if (patch.color    !== undefined) row.color    = patch.color
    if (patch.isDone   !== undefined) row.is_done  = patch.isDone
    if (patch.position !== undefined) row.position = patch.position

    const { error } = await supabase.from('board_columns').update(row).eq('id', id)
    if (error) {
      setColumnsState(prev => ordenarColunas(prev.map(c => c.id === id ? anterior : c)))
      return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  // Reordena colunas pelo índice de destino, usando a média entre as vizinhas.
  async function moveColumn(id, novoIndice) {
    const restantes = columns.filter(c => c.id !== id)
    const antes = restantes[novoIndice - 1]
    const depois = restantes[novoIndice]
    let position
    if (!antes && !depois)      position = POSITION_GAP
    else if (!antes)            position = depois.position - POSITION_GAP
    else if (!depois)           position = antes.position + POSITION_GAP
    else                        position = (antes.position + depois.position) / 2
    return updateColumn(id, { position })
  }

  // Arquivar não pode engolir tarefas: elas vão para a primeira coluna restante.
  async function archiveColumn(id) {
    const destino = columns.find(c => c.id !== id)
    if (!destino) return { ok: false, error: 'O quadro precisa de ao menos uma coluna.' }

    const orfas = tasks.filter(t => t.columnId === id)
    if (orfas.length) {
      const base = posicaoNoTopo(destino.id)
      const movidas = orfas.map((t, i) => ({ ...t, columnId: destino.id, position: base - i * POSITION_GAP }))
      setTasksState(prev => prev.map(t => movidas.find(m => m.id === t.id) || t))
      const { error } = await supabase
        .from('tasks')
        .update({ column_id: destino.id, done: destino.isDone })
        .eq('column_id', id)
      if (error) {
        setTasksState(prev => prev.map(t => orfas.find(o => o.id === t.id) || t))
        return { ok: false, error: error.message }
      }
    }

    const { error } = await supabase.from('board_columns').update({ archived: true }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    setColumnsState(prev => prev.filter(c => c.id !== id))
    return { ok: true }
  }

  // ── CLIENTS ───────────────────────────────────────────────────
  async function addClient(data) {
    const tmp = { ...data, id: 'tmp-' + Date.now(), archived: false }
    setClientsState(prev => [...prev, tmp])
    const { data: row } = await supabase.from('clients').insert(clientRow(tmp)).select().single()
    if (row) setClientsState(prev => prev.map(c => c.id === tmp.id ? mapClient(row) : c))
  }

  async function editClient(id, data) {
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    await supabase.from('clients').update(clientRow({ ...data })).eq('id', id)
  }

  async function archiveClient(id) {
    const archived = !(clients.find(c => c.id === id)?.archived)
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, archived } : c))
    await supabase.from('clients').update({ archived }).eq('id', id)
  }

  async function toggleClientHidden(id) {
    const hidden = !(clients.find(c => c.id === id)?.hidden)
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, hidden } : c))
    await supabase.from('clients').update({ hidden }).eq('id', id)
  }

  // ── NOTES ─────────────────────────────────────────────────────
  async function addNote(data) {
    const n = { ...data, id: 'tmp-' + Date.now(), date: new Date().toISOString().slice(0, 10), pinned: false }
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

  async function archiveNote(id) {
    const archived = !(notes.find(n => n.id === id)?.archived)
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, archived } : n))
    await supabase.from('notes').update({ archived }).eq('id', id)
  }

  async function toggleNoteItem(noteId, itemId) {
    const note = notes.find(n => n.id === noteId)
    if (!note) return
    const items = note.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it)
    setNotesState(prev => prev.map(n => n.id === noteId ? { ...n, items } : n))
    await supabase.from('notes').update({ items }).eq('id', noteId)
  }

  async function pinNote(id) {
    const pinned = !(notes.find(n => n.id === id)?.pinned)
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, pinned } : n))
    await supabase.from('notes').update({ pinned }).eq('id', id)
  }

  // ── COMMENTS ──────────────────────────────────────────────────
  async function addComment(taskId, text, actor) {
    if (!actor) return
    const { data: row } = await supabase.from('comments').insert({
      task_id: taskId, user_id: actor.id, user_name: actor.name,
      user_color: actor.color, user_initials: actor.initials, text,
    }).select().single()
    // Realtime cuida da atualização de state; fallback manual se necessário
    if (row) {
      setCommentsState(prev => ({
        ...prev, [taskId]: [...(prev[taskId] || []), mapComment(row)],
      }))
    }
    const task = tasks.find(t => t.id === taskId)
    _notify('💬', `Comentário em: ${task?.title || 'tarefa'}`, 'comment.added')
  }

  async function deleteComment(taskId, commentId) {
    setCommentsState(prev => ({
      ...prev, [taskId]: (prev[taskId] || []).filter(c => c.id !== commentId),
    }))
    await supabase.from('comments').delete().eq('id', commentId)
  }

  function getComments(taskId) { return comments[taskId] || [] }

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  // ── TIME TRACKING ─────────────────────────────────────────────
  async function startTimer(taskId, actor) {
    if (activeTimer) await stopTimer(actor)
    setActiveTimer({ taskId, startTime: Date.now() })
    const task = tasks.find(t => t.id === taskId)
    if (actor) _notify('⏱', `Timer: ${task?.title || 'tarefa'}`, 'timer.start')
  }

  async function stopTimer(actor) {
    if (!activeTimer) return
    const duration = Date.now() - activeTimer.startTime
    const entry = { id: 'tmp-' + Date.now(), taskId: activeTimer.taskId, startTime: activeTimer.startTime, endTime: Date.now(), duration }
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

  // ── FOLDERS ───────────────────────────────────────────────────
  async function addFolder(data) {
    const tmp = { id: 'tmp-' + Date.now(), name: data.name, color: data.color || '#2D6A4F', clientId: data.clientId || null, createdAt: new Date().toISOString() }
    setFoldersState(prev => [...prev, tmp])
    const { data: row } = await supabase.from('folders').insert({
      name: data.name, color: data.color || '#2D6A4F', client_id: data.clientId || null,
    }).select().single()
    if (row) setFoldersState(prev => prev.map(f => f.id === tmp.id ? mapFolder(row) : f))
    return row ? mapFolder(row) : tmp
  }

  async function deleteFolder(id) {
    setFoldersState(prev => prev.filter(f => f.id !== id))
    setDocsState(prev => prev.map(d => d.folderId === id ? { ...d, folderId: null } : d))
    await supabase.from('folders').delete().eq('id', id)
  }

  // ── DOCS ──────────────────────────────────────────────────────
  async function addDoc(data) {
    const tmp = { ...data, id: 'tmp-' + Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setDocsState(prev => [tmp, ...prev])
    const { data: row } = await supabase.from('docs').insert({
      title: data.title || 'Sem título', content: data.content || '',
      folder_id: data.folderId || null, client_id: data.clientId || null,
      linked_task_ids: data.linkedTaskIds || [],
      author_id: data.authorId || '', author_name: data.authorName || '',
      author_color: data.authorColor || '',
    }).select().single()
    if (row) {
      setDocsState(prev => prev.map(d => d.id === tmp.id ? mapDoc(row) : d))
      return mapDoc(row)
    }
    return tmp
  }

  async function editDoc(id, data) {
    const now = new Date().toISOString()
    setDocsState(prev => prev.map(d => d.id === id ? { ...d, ...data, updatedAt: now } : d))
    await supabase.from('docs').update({
      title: data.title, content: data.content,
      linked_task_ids: data.linkedTaskIds, updated_at: now,
    }).eq('id', id)
  }

  async function deleteDoc(id) {
    setDocsState(prev => prev.filter(d => d.id !== id))
    await supabase.from('docs').delete().eq('id', id)
  }

  // ── Computed ──────────────────────────────────────────────────
  const activeClients   = clients.filter(c => !c.archived && !c.hidden)
  const hiddenClients   = clients.filter(c => c.hidden && !c.archived)
  const archivedClients = clients.filter(c => c.archived)
  const activeTasks     = tasks.filter(t => !t.archived)
  const archivedTasks   = tasks.filter(t => t.archived)
  const activeNotes     = notes.filter(n => !n.archived)
  const archivedNotes   = notes.filter(n => n.archived)
  const unreadCount     = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      appLoading,
      theme, toggleTheme,
      tasks: activeTasks, allTasks: tasks, archivedTasks,
      addTask, editTask, deleteTask, toggleTask, moveTask, archiveTask,
      columns, addColumn, updateColumn, moveColumn, archiveColumn, reorderColumn,
      clients: activeClients, allClients: clients, hiddenClients, archivedClients,
      addClient, editClient, archiveClient, toggleClientHidden,
      notes: activeNotes, allNotes: notes, archivedNotes,
      addNote, editNote, deleteNote, toggleNoteItem, pinNote, archiveNote,
      comments, addComment, deleteComment, getComments,
      notifications, markNotificationRead, markAllRead, unreadCount,
      activityLog,
      timeEntries, activeTimer, startTimer, stopTimer, getTaskTotalTime,
      docs, folders, addDoc, editDoc, deleteDoc, addFolder, deleteFolder,
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
