import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TaskModal from './components/TaskModal'
import ClientModal from './components/ClientModal'
import NoteModal from './components/NoteModal'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Tarefas from './pages/Tarefas'
import Clientes from './pages/Clientes'
import ClientDetail from './pages/ClientDetail'
import Notas from './pages/Notas'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas',
  '/clientes': 'Clientes',
  '/notas': 'Notas & Documentos',
}

const NEW_LABELS = {
  '/tarefas': '+ Tarefa',
  '/clientes': '+ Cliente',
  '/notas': '+ Nota',
}

function AppLayout() {
  const { pathname } = useLocation()

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Task modal
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  // Client modal
  const [clientOpen, setClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  // Note modal
  const [noteOpen, setNoteOpen] = useState(false)

  function openNewTask() { setEditingTask(null); setTaskOpen(true) }
  function openEditTask(task) { setEditingTask(task); setTaskOpen(true) }
  function openNewClient() { setEditingClient(null); setClientOpen(true) }
  function openEditClient(client) { setEditingClient(client); setClientOpen(true) }
  function openNewNote() { setNoteOpen(true) }

  function handleTopbarNew() {
    if (pathname === '/clientes' || pathname.startsWith('/clientes/')) openNewClient()
    else if (pathname === '/notas') openNewNote()
    else openNewTask()
  }

  const isClientDetail = pathname.startsWith('/clientes/') && pathname !== '/clientes'
  const pageTitle = isClientDetail
    ? undefined  // ClientDetail renders its own header
    : (PAGE_TITLES[pathname] || 'FlowDesk')

  const newLabel = NEW_LABELS[pathname] || (pathname.startsWith('/clientes/') ? '+ Tarefa' : '+ Novo')

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        {!isClientDetail && (
          <Topbar title={pageTitle} onNew={handleTopbarNew} newLabel={newLabel} onMenuToggle={() => setSidebarOpen(o => !o)} />
        )}
        {isClientDetail && (
          <Topbar
            title={pageTitle || ''}
            onNew={pathname.startsWith('/clientes/') ? openNewTask : handleTopbarNew}
            newLabel="+ Tarefa"
            onMenuToggle={() => setSidebarOpen(o => !o)}
          />
        )}
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard onNewTask={openNewTask} onEditTask={openEditTask} />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/tarefas" element={<Tarefas onNew={openNewTask} onEdit={openEditTask} />} />
            <Route path="/clientes" element={<Clientes onNew={openNewClient} onEdit={openEditClient} />} />
            <Route
              path="/clientes/:id"
              element={
                <ClientDetail
                  onNewTask={openNewTask}
                  onEditTask={openEditTask}
                  onEditClient={openEditClient}
                />
              }
            />
            <Route path="/notas" element={<Notas onNew={openNewNote} />} />
          </Routes>
        </div>
      </div>

      <TaskModal
        open={taskOpen}
        onClose={() => { setTaskOpen(false); setEditingTask(null) }}
        editingTask={editingTask}
      />
      <ClientModal
        open={clientOpen}
        onClose={() => { setClientOpen(false); setEditingClient(null) }}
        editingClient={editingClient}
      />
      <NoteModal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/Agenda-RBW-Digital">
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  )
}
