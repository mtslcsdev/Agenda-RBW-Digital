import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export const TAG_COLORS = {
  GHL: 'green', N8N: 'orange', Vendas: 'purple',
  Reunião: 'yellow', Dev: 'green', Pessoal: 'purple', Dev2: 'green',
}

export const TAG_OPTIONS = ['GHL', 'N8N', 'Vendas', 'Reunião', 'Dev', 'Pessoal']

export const CLIENT_COLORS = ['#2D6A4F', '#5B4FCF', '#E07A3A', '#D94F3D', '#E8A923', '#3A7CA5']

export const PRIORITY_COLORS = { Normal: null, Alta: 'var(--accent2)', Urgente: 'var(--red)' }

const STATUS_OPTIONS = [
  { label: 'Em andamento', color: 'orange' },
  { label: 'Ativo', color: 'green' },
  { label: 'Onboarding', color: 'yellow' },
  { label: 'Pausado', color: 'red' },
  { label: 'Concluído', color: 'purple' },
]
export { STATUS_OPTIONS }

const SEED_TASKS = [
  { id: 1, title: 'Configurar webhook N8N – Neoprop', done: true, tag: 'GHL', tagColor: 'green', client: 'Neoprop', date: '2026-04-07', priority: 'Normal' },
  { id: 2, title: 'Revisar fluxo de aprovação de trader', done: false, tag: 'N8N', tagColor: 'orange', client: 'Neoprop', date: '2026-04-08', priority: 'Alta' },
  { id: 3, title: 'Switch node – 3 planos Asaas', done: false, tag: 'N8N', tagColor: 'orange', client: 'Neoprop', date: '2026-04-09', priority: 'Urgente' },
  { id: 4, title: 'Enviar proposta para novo cliente', done: false, tag: 'Vendas', tagColor: 'purple', client: 'Pessoal', date: '2026-04-10', priority: 'Normal' },
  { id: 5, title: 'Reunião com Joy – engajamento de leads', done: false, tag: 'Reunião', tagColor: 'yellow', client: 'Pessoal', date: '2026-04-08', priority: 'Normal' },
  { id: 6, title: 'Rascunho capítulo 1 – Ebook 5km', done: false, tag: 'Pessoal', tagColor: 'purple', client: 'Pessoal', date: '2026-04-11', priority: 'Normal' },
  { id: 7, title: 'Checar integração Asaas API', done: true, tag: 'Dev', tagColor: 'green', client: 'Neoprop', date: '2026-04-07', priority: 'Normal' },
]

const SEED_CLIENTS = [
  { id: 1, initials: 'NP', name: 'Neoprop', segment: 'Trader Training Program', email: 'robervan@neoprop.com', status: 'Em andamento', statusColor: 'orange', color: '#2D6A4F', tags: ['GHL', 'N8N'], archived: false },
  { id: 2, initials: 'CB', name: 'Cliente B', segment: 'E-commerce / Loja virtual', email: 'contato@clienteb.com', status: 'Ativo', statusColor: 'green', color: '#5B4FCF', tags: ['Automação'], archived: false },
  { id: 3, initials: 'MK', name: 'Cliente C', segment: 'Marketing Digital', email: 'contato@clientec.com', status: 'Onboarding', statusColor: 'yellow', color: '#E07A3A', tags: [], archived: false },
]

const SEED_NOTES = [
  {
    id: 1, title: '🔧 Neoprop – Webhook Rejeição',
    content: 'Mapear campo de motivo no webhook de rejeição. Verificar com Robervan a estrutura esperada para o Switch node dos 3 planos.',
    date: '2026-04-07', project: 'Neoprop', color: 'yellow',
    type: 'text', items: [], pinned: false,
  },
  {
    id: 2, title: '✅ Setup GHL – Checklist',
    content: '',
    date: '2026-04-06', project: 'Neoprop', color: 'blue',
    type: 'checklist',
    items: [
      { id: 1, text: 'Criar conta no GoHighLevel', done: true },
      { id: 2, text: 'Configurar subaccount Neoprop', done: true },
      { id: 3, text: 'Conectar domínio personalizado', done: false },
      { id: 4, text: 'Ativar automações de follow-up', done: false },
    ],
    pinned: true,
  },
  {
    id: 3, title: '📊 Meta Ads – Estudo',
    content: 'Sessões curtas diárias. Foco atual: estrutura de campanha, conjuntos de anúncios, públicos lookalike e retargeting.',
    date: '2026-04-05', project: 'Pessoal', color: 'purple',
    type: 'text', items: [], pinned: false,
  },
]

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => loadFromStorage('fd_theme', 'light'))
  const [tasks, setTasksState] = useState(() => loadFromStorage('fd_tasks', SEED_TASKS))
  const [clients, setClientsState] = useState(() => loadFromStorage('fd_clients', SEED_CLIENTS))
  const [notes, setNotesState] = useState(() => loadFromStorage('fd_notes', SEED_NOTES))
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveToStorage('fd_theme', theme)
  }, [theme])

  useEffect(() => { saveToStorage('fd_tasks', tasks) }, [tasks])
  useEffect(() => { saveToStorage('fd_clients', clients) }, [clients])
  useEffect(() => { saveToStorage('fd_notes', notes) }, [notes])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  // ── TASKS ──
  function addTask(data) {
    setTasksState(prev => [{ ...data, id: Date.now(), done: false }, ...prev])
  }
  function editTask(id, data) {
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
  }
  function deleteTask(id) {
    setTasksState(prev => prev.filter(t => t.id !== id))
  }
  function toggleTask(id) {
    setTasksState(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  // ── CLIENTS ──
  function addClient(data) {
    setClientsState(prev => [...prev, { ...data, id: Date.now(), archived: false }])
  }
  function editClient(id, data) {
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  }
  function archiveClient(id) {
    setClientsState(prev => prev.map(c => c.id === id ? { ...c, archived: !c.archived } : c))
  }

  // ── NOTES ──
  function addNote(data) {
    setNotesState(prev => [{
      ...data,
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      type: data.type || 'text',
      items: data.items || [],
      pinned: false,
    }, ...prev])
  }
  function editNote(id, data) {
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
  }
  function deleteNote(id) {
    setNotesState(prev => prev.filter(n => n.id !== id))
  }
  function toggleNoteItem(noteId, itemId) {
    setNotesState(prev => prev.map(n =>
      n.id === noteId
        ? { ...n, items: n.items.map(it => it.id === itemId ? { ...it, done: !it.done } : it) }
        : n
    ))
  }
  function pinNote(id) {
    setNotesState(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
  }

  const activeClients = clients.filter(c => !c.archived)

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      tasks, addTask, editTask, deleteTask, toggleTask,
      clients: activeClients, allClients: clients, addClient, editClient, archiveClient,
      notes, addNote, editNote, deleteNote, toggleNoteItem, pinNote,
      searchQuery, setSearchQuery,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
