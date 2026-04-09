import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TaskModal from './components/TaskModal'
import ClientModal from './components/ClientModal'
import NoteModal from './components/NoteModal'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Tarefas from './pages/Tarefas'
import Clientes from './pages/Clientes'
import ClientDetail from './pages/ClientDetail'
import Notas from './pages/Notas'
import AdminUsuarios from './pages/AdminUsuarios'
import Relatorio from './pages/Relatorio'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas',
  '/clientes': 'Clientes',
  '/notas': 'Notas & Documentos',
  '/admin': 'Usuários & Permissões',
}

const NEW_LABELS = {
  '/tarefas': '+ Tarefa',
  '/clientes': '+ Cliente',
  '/notas': '+ Nota',
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px', color: 'var(--text3)',
      background: 'var(--surface)',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-1px' }}>RBW</div>
      <div style={{ fontSize: '12px' }}>Carregando...</div>
    </div>
  )
}

function AppLayout() {
  const { pathname } = useLocation()
  const { appLoading } = useApp()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [clientOpen, setClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [noteOpen, setNoteOpen] = useState(false)

  if (appLoading) return <LoadingScreen />

  function openNewTask() { setEditingTask(null); setTaskOpen(true) }
  function openEditTask(task) { setEditingTask(task); setTaskOpen(true) }
  function openNewClient() { setEditingClient(null); setClientOpen(true) }
  function openEditClient(client) { setEditingClient(client); setClientOpen(true) }
  function openNewNote() { setNoteOpen(true) }

  function handleTopbarNew() {
    if (pathname === '/clientes' || pathname.startsWith('/clientes/')) openNewClient()
    else if (pathname === '/notas') openNewNote()
    else if (pathname === '/admin') return
    else openNewTask()
  }

  const isClientDetail = pathname.startsWith('/clientes/') && pathname !== '/clientes'
  const isRelatorio = pathname.startsWith('/relatorio')
  const isAdmin = pathname === '/admin'
  const pageTitle = isClientDetail ? undefined : (PAGE_TITLES[pathname] || 'RBW Digital')
  const newLabel = NEW_LABELS[pathname] || (pathname.startsWith('/clientes/') ? '+ Tarefa' : '+ Novo')
  const hideNewBtn = isAdmin || isRelatorio

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        {!isRelatorio && (
          <Topbar
            title={isClientDetail ? '' : pageTitle}
            onNew={hideNewBtn ? undefined : (isClientDetail ? openNewTask : handleTopbarNew)}
            newLabel={isClientDetail ? '+ Tarefa' : newLabel}
            onMenuToggle={() => setSidebarOpen(o => !o)}
          />
        )}
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard onNewTask={openNewTask} onEditTask={openEditTask} />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/tarefas" element={<Tarefas onNew={openNewTask} onEdit={openEditTask} />} />
            <Route path="/clientes" element={<Clientes onNew={openNewClient} onEdit={openEditClient} />} />
            <Route path="/clientes/:id" element={<ClientDetail onNewTask={openNewTask} onEditTask={openEditTask} onEditClient={openEditClient} />} />
            <Route path="/notas" element={<Notas onNew={openNewNote} />} />
            <Route path="/admin" element={<AdminUsuarios />} />
            <Route path="/relatorio/:clientId" element={<Relatorio />} />
          </Routes>
        </div>
      </div>

      <TaskModal open={taskOpen} onClose={() => { setTaskOpen(false); setEditingTask(null) }} editingTask={editingTask} />
      <ClientModal open={clientOpen} onClose={() => { setClientOpen(false); setEditingClient(null) }} editingClient={editingClient} />
      <NoteModal open={noteOpen} onClose={() => setNoteOpen(false)} />
    </div>
  )
}

function AuthGuard({ children }) {
  const { currentUser, authLoading } = useAuth()
  if (authLoading) return <LoadingScreen />
  if (!currentUser) return <Login />
  // AppProvider monta APÓS autenticação para garantir sessão válida nas queries
  return <AppProvider>{children}</AppProvider>
}

export default function App() {
  return (
    <BrowserRouter basename="/Agenda-RBW-Digital">
      <AuthProvider>
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      </AuthProvider>
    </BrowserRouter>
  )
}
