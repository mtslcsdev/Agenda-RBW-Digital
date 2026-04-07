import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TaskModal from './components/TaskModal'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Tarefas from './pages/Tarefas'
import Clientes from './pages/Clientes'
import Neoprop from './pages/Neoprop'
import Notas from './pages/Notas'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas',
  '/clientes': 'Clientes',
  '/clientes/neoprop': 'Neoprop',
  '/notas': 'Notas & Documentos',
}

function AppLayout() {
  const [modalOpen, setModalOpen] = useState(false)
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'FlowDesk'

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar title={title} onNew={() => setModalOpen(true)} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/tarefas" element={<Tarefas onNew={() => setModalOpen(true)} />} />
            <Route path="/clientes" element={<Clientes onNew={() => setModalOpen(true)} />} />
            <Route path="/clientes/neoprop" element={<Neoprop />} />
            <Route path="/notas" element={<Notas onNew={() => setModalOpen(true)} />} />
          </Routes>
        </div>
      </div>
      <TaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  )
}
