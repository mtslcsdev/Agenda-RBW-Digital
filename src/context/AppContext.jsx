import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// Avisos derivados dos dados (recalculados a cada carga) ou puramente de
// interface não vão para o banco — só encheriam a caixa de repetições.
const NOTIFICACOES_EFEMERAS = new Set([
  'overdue', 'deadline', 'error', 'timer.start', 'timer.stop',
])

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

// As cores de coluna e etiqueta são escolhidas pela pessoa, então não dá para
// fixar o texto em branco: sobre o amarelo, por exemplo, fica ilegível.
// Decide entre texto claro e escuro pela luminância da cor de fundo.
export function corDeTexto(hex) {
  const h = String(hex || '').replace('#', '')
  if (h.length !== 6) return '#ffffff'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.6 ? '#1a1f30' : '#ffffff'
}
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
  boardId: r.board_id ?? null,
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
  boardId: r.board_id ?? null,
  label: r.label,
  color: r.color || '#6B6960',
  position: Number(r.position),
  isDone: r.is_done || false,
  archived: r.archived || false,
})
const mapBoard = r => ({
  id: r.id,
  name: r.name,
  clientId: r.client_id ?? null,
  position: Number(r.position),
  archived: r.archived || false,
})
const mapChecklistItem = r => ({
  id: r.id, taskId: r.task_id, text: r.text,
  done: r.done || false, position: Number(r.position),
})
const mapLabel = r => ({ id: r.id, name: r.name, color: r.color || '#2D6A4F' })
const mapAttachment = r => ({
  id: r.id,
  taskId: r.task_id ?? null,
  clientId: r.client_id ?? null,
  path: r.path,
  url: r.url,
  filename: r.filename,
  mimeType: r.mime_type || '',
  sizeBytes: Number(r.size_bytes || 0),
  uploaderName: r.uploader_name || '',
  createdAt: r.created_at,
})
const mapComment = r => ({
  id: r.id, userId: r.user_id, userName: r.user_name,
  userColor: r.user_color, userInitials: r.user_initials,
  text: r.text, createdAt: r.created_at,
})
const mapActivity = r => ({
  id: r.id, userName: r.user_name, userColor: r.user_color,
  action: r.action, entityType: r.entity_type, entityTitle: r.entity_title,
  entityId: r.entity_id ?? null,
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
  title: t.title,
  // Com vínculo por id o nome não é guardado: seria uma cópia que envelhece
  // sozinha quando o cliente é renomeado. O texto só sobrevive para valores
  // que não são um cliente de verdade, como "Pessoal".
  client: t.client_id ? '' : (t.client || ''),
  client_id: t.client_id || null,
  tag: t.tag || '', tag_color: t.tagColor || 'green',
  priority: t.priority || 'Normal', date: t.date || '',
  notes: t.notes || '', done: t.done || false,
  task_status: t.taskStatus || 'pendente',
  column_id: t.columnId ?? null,
  board_id: t.boardId ?? null,
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
  // O AppProvider só é montado depois do login (ver AuthGuard), então aqui
  // sempre existe um usuário — as notificações são por pessoa.
  const { currentUser } = useAuth()
  const usuarioId = currentUser?.id ?? null

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
  const [boards, setBoardsState]          = useState([])
  const [currentBoardId, setBoardId]      = useState(() => {
    const salvo = Number(localStorage.getItem('rbw_board'))
    return Number.isFinite(salvo) && salvo > 0 ? salvo : null
  })
  const [checklists, setChecklists]       = useState({})   // taskId -> itens
  const [labels, setLabelsState]          = useState([])
  const [attachments, setAttachments]     = useState([])
  const [taskLabels, setTaskLabels]       = useState({})   // taskId -> [labelId]
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

  useEffect(() => {
    if (currentBoardId) localStorage.setItem('rbw_board', String(currentBoardId))
  }, [currentBoardId])

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
      const [bRes, colRes, tRes, cRes, nRes] = await Promise.all([
        supabase.from('boards').select('*').eq('archived', false).order('position'),
        supabase.from('board_columns').select('*').eq('archived', false).order('position'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false }),
      ])
      if (bRes.data) {
        const lista = bRes.data.map(mapBoard)
        setBoardsState(lista)
        // Se o quadro salvo sumiu (ou é o primeiro acesso), cai no primeiro
        setBoardId(atual => lista.some(b => b.id === atual) ? atual : (lista[0]?.id ?? null))
      }
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
      const [cmRes, aRes, eRes, chkRes, lblRes, tlRes, atRes, nfRes] = await Promise.all([
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('time_entries').select('*'),
        supabase.from('task_checklist').select('*').order('position'),
        supabase.from('labels').select('*').order('name'),
        supabase.from('task_labels').select('*'),
        supabase.from('attachments').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*')
          .order('created_at', { ascending: false }).limit(30),
      ])

      if (atRes.data) setAttachments(atRes.data.map(mapAttachment))

      if (nfRes.data) {
        // Os avisos efêmeros desta sessão (ainda com id temporário) continuam
        // na tela; o resto vem do banco e sobrevive ao recarregar.
        const doBanco = nfRes.data.map(mapNotification)
        setNotifications(prev => [
          ...prev.filter(n => String(n.id).startsWith('tmp-')),
          ...doBanco,
        ].slice(0, 30))
      }

      if (chkRes.data) {
        const porTarefa = {}
        chkRes.data.forEach(r => {
          (porTarefa[r.task_id] ||= []).push(mapChecklistItem(r))
        })
        setChecklists(porTarefa)
      }
      if (lblRes.data) setLabelsState(lblRes.data.map(mapLabel))
      if (tlRes.data) {
        const porTarefa = {}
        tlRes.data.forEach(r => { (porTarefa[r.task_id] ||= []).push(r.label_id) })
        setTaskLabels(porTarefa)
      }
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
    const local = {
      id: 'tmp-' + Date.now() + Math.random(), icon, message, type,
      read: false, createdAt: new Date().toISOString(),
    }
    setNotifications(prev => [local, ...prev].slice(0, 30))

    // Os avisos de evento sobrevivem ao recarregar a página; os efêmeros não
    if (!NOTIFICACOES_EFEMERAS.has(type) && usuarioId) {
      supabase.from('notifications')
        .insert({ user_id: usuarioId, icon, message, type })
        .select().single()
        .then(({ data }) => {
          if (data) setNotifications(prev =>
            prev.map(n => n.id === local.id ? mapNotification(data) : n))
        })
    }
  }, [usuarioId])

  // entityId liga o registro à entidade. Sem ele o histórico era casado pelo
  // título, e duas tarefas de mesmo nome apareciam misturadas.
  const _log = useCallback((actor, action, entityType, entityTitle, entityId = null) => {
    const entry = {
      id: Date.now() + Math.random(),
      userName: actor?.name || 'Sistema',
      userColor: actor?.color || '#6B6960',
      action, entityType, entityTitle,
      entityId: entityId != null ? String(entityId) : null,
      createdAt: new Date().toISOString(),
    }
    setActivityLog(prev => [entry, ...prev].slice(0, 50))
    // Persiste no banco de forma assíncrona (best-effort)
    supabase.from('activity_log').insert({
      user_id: actor?.id, user_name: actor?.name || 'Sistema',
      user_color: actor?.color || '#6B6960',
      action, entity_type: entityType, entity_title: entityTitle,
      entity_id: entityId != null ? String(entityId) : null,
    }).then(() => {})
  }, [])

  // ── TASKS ─────────────────────────────────────────────────────
  async function addTask(data, actor) {
    const boardId  = data.boardId ?? currentBoardId
    const doQuadro = columns.filter(c => c.boardId === boardId)
    const columnId = data.columnId ?? doQuadro[0]?.id ?? null
    const tmp = {
      ...data,
      id: 'tmp-' + Date.now(),
      done: false,
      taskStatus: data.taskStatus || 'pendente',
      boardId,
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
    if (actor) _log(actor, 'criou a tarefa', 'tarefa', data.title, row?.id)
  }

  async function editTask(id, data, actor) {
    // Mescla com a tarefa atual antes de gravar: taskRow preenche o que estiver
    // faltando com valores padrão, então enviar só o que veio do formulário
    // apagaria coluna, posição e demais campos fora do modal.
    const atual = tasks.find(t => t.id === id)
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    await supabase.from('tasks').update(taskRow({ ...atual, ...data })).eq('id', id)
    if (actor) _log(actor, 'editou a tarefa', 'tarefa', data.title || atual?.title || '', id)
  }

  async function deleteTask(id, actor) {
    const task = tasks.find(t => t.id === id)
    setTasksState(prev => prev.filter(t => t.id !== id))
    setCommentsState(prev => { const c = { ...prev }; delete c[id]; return c })
    await supabase.from('tasks').delete().eq('id', id)
    if (actor && task) _log(actor, 'removeu a tarefa', 'tarefa', task.title, id)
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
    const alvo = columns.find(c =>
      c.boardId === task.boardId && (done ? c.isDone : !c.isDone))

    if (alvo && alvo.id !== task.columnId) {
      await moveTask(id, alvo.id, posicaoNoTopo(alvo.id), null)
    } else {
      setTasksState(prev => prev.map(t => t.id === id ? { ...t, done } : t))
      await supabase.from('tasks').update({ done }).eq('id', id)
    }

    if (actor) {
      _notify(done ? '🏁' : '↩', done ? `Concluída: ${task.title}` : `Reaberta: ${task.title}`, done ? 'task.done' : 'task.reopened')
      _log(actor, done ? 'concluiu a tarefa' : 'reabriu a tarefa', 'tarefa', task.title, id)
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
      _log(actor, `moveu para ${col.label}`, 'tarefa', task.title, id)
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

    const doQuadro = columns.filter(c => c.boardId === currentBoardId)
    const position = doQuadro.length
      ? Math.max(...doQuadro.map(c => c.position)) + POSITION_GAP
      : POSITION_GAP
    const color = COLUMN_COLORS[doQuadro.length % COLUMN_COLORS.length]

    const { data: row, error } = await supabase
      .from('board_columns')
      .insert({ label: nome, color, position, board_id: currentBoardId })
      .select().single()
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
    const boardId = columns.find(c => c.id === id)?.boardId
    const restantes = columns.filter(c => c.id !== id && c.boardId === boardId)
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
    const boardId = columns.find(c => c.id === id)?.boardId
    const destino = columns.find(c => c.id !== id && c.boardId === boardId)
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

  // ── QUADROS ───────────────────────────────────────────────────
  const COLUNAS_PADRAO = [
    { label: 'Pendente',     color: '#6B6960', is_done: false },
    { label: 'Em Progresso', color: '#E07A3A', is_done: false },
    { label: 'Concluído',    color: '#2D6A4F', is_done: true  },
  ]

  async function addBoard(name, clientId = null) {
    const nome = (name || '').trim()
    if (!nome) return { ok: false, error: 'Dê um nome ao quadro.' }

    const position = boards.length
      ? Math.max(...boards.map(b => b.position)) + POSITION_GAP
      : POSITION_GAP

    const { data: row, error } = await supabase
      .from('boards').insert({ name: nome, client_id: clientId, position }).select().single()
    if (error) return { ok: false, error: error.message }

    // Um quadro sem colunas não serve para nada — já nasce com as três padrão
    const { data: cols } = await supabase.from('board_columns').insert(
      COLUNAS_PADRAO.map((c, i) => ({ ...c, position: (i + 1) * POSITION_GAP, board_id: row.id }))
    ).select()

    setBoardsState(prev => [...prev, mapBoard(row)].sort((a, b) => a.position - b.position))
    if (cols) setColumnsState(prev => [...prev, ...cols.map(mapColumn)])
    setBoardId(row.id)
    return { ok: true, board: mapBoard(row) }
  }

  async function renameBoard(id, name) {
    const nome = (name || '').trim()
    if (!nome) return { ok: false, error: 'O nome não pode ficar vazio.' }
    const anterior = boards.find(b => b.id === id)
    setBoardsState(prev => prev.map(b => b.id === id ? { ...b, name: nome } : b))
    const { error } = await supabase.from('boards').update({ name: nome }).eq('id', id)
    if (error) {
      setBoardsState(prev => prev.map(b => b.id === id ? anterior : b))
      return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  async function archiveBoard(id) {
    if (boards.length <= 1) return { ok: false, error: 'É preciso ter ao menos um quadro.' }
    const { error } = await supabase.from('boards').update({ archived: true }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    const restantes = boards.filter(b => b.id !== id)
    setBoardsState(restantes)
    if (currentBoardId === id) setBoardId(restantes[0]?.id ?? null)
    return { ok: true }
  }

  // ── ANEXOS ────────────────────────────────────────────────────
  const LIMITE_ARQUIVO = 25 * 1024 * 1024 // 25 MB, igual ao limite do bucket

  function getAttachments({ taskId = null, clientId = null }) {
    return attachments.filter(a =>
      taskId != null ? a.taskId === taskId : a.clientId === clientId)
  }

  async function addAttachment(file, { taskId = null, clientId = null }, actor) {
    if (!file) return { ok: false, error: 'Nenhum arquivo selecionado.' }
    if (file.size > LIMITE_ARQUIVO) {
      return {
        ok: false,
        error: `"${file.name}" tem ${(file.size / 1048576).toFixed(1)} MB. O limite por arquivo é 25 MB.`,
      }
    }

    // O bucket é público, então o segredo está no caminho: um sufixo aleatório
    // torna a URL impossível de adivinhar por quem não vê a listagem.
    const aleatorio = crypto.randomUUID().replace(/-/g, '')
    const extensao = file.name.includes('.') ? file.name.split('.').pop().slice(0, 10) : 'bin'
    const pasta = taskId != null ? `tarefas/${taskId}` : `clientes/${clientId}`
    const path = `${pasta}/${aleatorio}.${extensao}`

    const { error: upErr } = await supabase.storage
      .from('anexos')
      .upload(path, file, { contentType: file.type || undefined, upsert: false })

    if (upErr) {
      const cheio = /exceeded|quota|storage/i.test(upErr.message || '')
      return {
        ok: false,
        error: cheio
          ? 'O espaço de armazenamento acabou. Apague anexos antigos ou fale sobre aumentar o plano do Supabase.'
          : `Falha ao enviar: ${upErr.message}`,
      }
    }

    const { data: pub } = supabase.storage.from('anexos').getPublicUrl(path)

    const { data: row, error } = await supabase.from('attachments').insert({
      task_id: taskId, client_id: clientId,
      path, url: pub.publicUrl,
      filename: file.name,
      mime_type: file.type || '',
      size_bytes: file.size,
      uploaded_by: actor?.id || null,
      uploader_name: actor?.name || '',
    }).select().single()

    if (error) {
      // Não deixa arquivo órfão no storage se o registro falhar
      await supabase.storage.from('anexos').remove([path])
      return { ok: false, error: error.message }
    }

    setAttachments(prev => [mapAttachment(row), ...prev])
    return { ok: true }
  }

  async function deleteAttachment(id) {
    const anexo = attachments.find(a => a.id === id)
    if (!anexo) return { ok: false, error: 'Anexo não encontrado.' }

    setAttachments(prev => prev.filter(a => a.id !== id))
    const { error } = await supabase.from('attachments').delete().eq('id', id)
    if (error) {
      setAttachments(prev => [anexo, ...prev])
      return { ok: false, error: error.message }
    }
    // Best-effort: se o arquivo sobrar no storage, o registro já saiu da vista
    await supabase.storage.from('anexos').remove([anexo.path])
    return { ok: true }
  }

  // ── CHECKLIST DO CARD ─────────────────────────────────────────
  function getChecklist(taskId) { return checklists[taskId] || [] }

  function checklistProgress(taskId) {
    const itens = getChecklist(taskId)
    if (!itens.length) return null
    const feitos = itens.filter(i => i.done).length
    return { feitos, total: itens.length, pct: Math.round((feitos / itens.length) * 100) }
  }

  async function addChecklistItem(taskId, text) {
    const texto = (text || '').trim()
    if (!texto) return
    const atuais  = getChecklist(taskId)
    const position = atuais.length ? Math.max(...atuais.map(i => i.position)) + POSITION_GAP : POSITION_GAP
    const tmp = { id: 'tmp-' + Date.now(), taskId, text: texto, done: false, position }

    setChecklists(prev => ({ ...prev, [taskId]: [...atuais, tmp] }))
    const { data: row, error } = await supabase
      .from('task_checklist').insert({ task_id: taskId, text: texto, position }).select().single()

    if (error) {
      setChecklists(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(i => i.id !== tmp.id) }))
      return
    }
    setChecklists(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || []).map(i => i.id === tmp.id ? mapChecklistItem(row) : i),
    }))
  }

  async function toggleChecklistItem(taskId, itemId) {
    const item = getChecklist(taskId).find(i => i.id === itemId)
    if (!item) return
    const done = !item.done
    setChecklists(prev => ({
      ...prev,
      [taskId]: prev[taskId].map(i => i.id === itemId ? { ...i, done } : i),
    }))
    const { error } = await supabase.from('task_checklist').update({ done }).eq('id', itemId)
    if (error) {
      setChecklists(prev => ({
        ...prev,
        [taskId]: prev[taskId].map(i => i.id === itemId ? { ...i, done: !done } : i),
      }))
    }
  }

  async function deleteChecklistItem(taskId, itemId) {
    const anterior = getChecklist(taskId)
    setChecklists(prev => ({ ...prev, [taskId]: anterior.filter(i => i.id !== itemId) }))
    const { error } = await supabase.from('task_checklist').delete().eq('id', itemId)
    if (error) setChecklists(prev => ({ ...prev, [taskId]: anterior }))
  }

  // ── ETIQUETAS ─────────────────────────────────────────────────
  function getTaskLabels(taskId) {
    const ids = taskLabels[taskId] || []
    return labels.filter(l => ids.includes(l.id))
  }

  async function toggleTaskLabel(taskId, labelId) {
    const atuais = taskLabels[taskId] || []
    const tinha  = atuais.includes(labelId)
    setTaskLabels(prev => ({
      ...prev,
      [taskId]: tinha ? atuais.filter(id => id !== labelId) : [...atuais, labelId],
    }))

    const { error } = tinha
      ? await supabase.from('task_labels').delete().eq('task_id', taskId).eq('label_id', labelId)
      : await supabase.from('task_labels').insert({ task_id: taskId, label_id: labelId })

    if (error) setTaskLabels(prev => ({ ...prev, [taskId]: atuais }))
  }

  async function addLabel(name, color) {
    const nome = (name || '').trim()
    if (!nome) return { ok: false, error: 'Dê um nome à etiqueta.' }
    const { data: row, error } = await supabase
      .from('labels').insert({ name: nome, color: color || COLUMN_COLORS[0] }).select().single()
    if (error) {
      if (error.code === '23505') return { ok: false, error: 'Já existe uma etiqueta com esse nome.' }
      return { ok: false, error: error.message }
    }
    setLabelsState(prev => [...prev, mapLabel(row)].sort((a, b) => a.name.localeCompare(b.name)))
    return { ok: true, label: mapLabel(row) }
  }

  async function deleteLabel(labelId) {
    const anterior = labels
    setLabelsState(prev => prev.filter(l => l.id !== labelId))
    setTaskLabels(prev => {
      const novo = {}
      Object.entries(prev).forEach(([tid, ids]) => { novo[tid] = ids.filter(id => id !== labelId) })
      return novo
    })
    const { error } = await supabase.from('labels').delete().eq('id', labelId)
    if (error) setLabelsState(anterior)
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

    // Avisa quem é responsável pela tarefa — só se for outra pessoa, senão
    // a pessoa receberia notificação do próprio comentário.
    if (task?.assignee_id && task.assignee_id !== actor.id) {
      supabase.from('notifications').insert({
        user_id: task.assignee_id,
        icon: '💬',
        message: `${actor.name} comentou em: ${task.title}`,
        type: 'comment.added',
      }).then(() => {})
    }
  }

  async function deleteComment(taskId, commentId) {
    setCommentsState(prev => ({
      ...prev, [taskId]: (prev[taskId] || []).filter(c => c.id !== commentId),
    }))
    await supabase.from('comments').delete().eq('id', commentId)
  }

  function getComments(taskId) { return comments[taskId] || [] }

  // ── NOTIFICATIONS ─────────────────────────────────────────────
  // Só as notificações gravadas têm id do banco; as efêmeras ficam só na tela.
  const ehDoBanco = id => !String(id).startsWith('tmp-')

  function markNotificationRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    if (ehDoBanco(id)) {
      supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {})
    }
  }

  function markAllRead() {
    const ids = notifications.filter(n => !n.read && ehDoBanco(n.id)).map(n => n.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (ids.length) {
      supabase.from('notifications').update({ read: true }).in('id', ids).then(() => {})
    }
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
  // O nome do cliente exibido é derivado de client_id, não guardado na tarefa:
  // assim renomear um cliente atualiza as tarefas dele em vez de órfãs-las.
  // O texto antigo continua servindo de reserva para valores que não são um
  // cliente de verdade — "Pessoal", por exemplo, é uma categoria.
  const comCliente = tasks.map(t => {
    const c = t.client_id ? clients.find(cl => cl.id === t.client_id) : null
    return c ? { ...t, client: c.name } : t
  })
  const activeTasks     = comCliente.filter(t => !t.archived)
  const archivedTasks   = comCliente.filter(t => t.archived)
  const activeNotes     = notes.filter(n => !n.archived)
  const archivedNotes   = notes.filter(n => n.archived)
  const unreadCount     = notifications.filter(n => !n.read).length

  return (
    <AppContext.Provider value={{
      appLoading,
      theme, toggleTheme,
      tasks: activeTasks, allTasks: comCliente, archivedTasks,
      addTask, editTask, deleteTask, toggleTask, moveTask, archiveTask,
      // `columns` é sempre o do quadro aberto; `allColumns` serve para telas
      // que somam tarefas de todos os quadros (Dashboard, Relatório).
      columns: columns.filter(c => c.boardId === currentBoardId),
      allColumns: columns,
      addColumn, updateColumn, moveColumn, archiveColumn, reorderColumn,
      boards, currentBoardId, setCurrentBoard: setBoardId,
      addBoard, renameBoard, archiveBoard,
      getChecklist, checklistProgress, addChecklistItem, toggleChecklistItem, deleteChecklistItem,
      labels, getTaskLabels, toggleTaskLabel, addLabel, deleteLabel,
      getAttachments, addAttachment, deleteAttachment,
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
