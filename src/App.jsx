import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import { usePermission } from './hooks/usePermission'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TaskModal from './components/TaskModal'
import ClientModal from './components/ClientModal'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Tarefas from './pages/Tarefas'
import Clientes from './pages/Clientes'
import ClientDetail from './pages/ClientDetail'
import AdminUsuarios from './pages/AdminUsuarios'
import Relatorio from './pages/Relatorio'
import Docs from './pages/Docs'

// Carregado apenas quando o usuário abre um documento (TipTap é pesado)
const DocEditor = lazy(() => import('./pages/DocEditor'))

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas',
  '/clientes': 'Clientes',
  '/docs': 'Documentos',
  '/admin': 'Usuários & Permissões',
}

const NEW_LABELS = {
  '/tarefas': '+ Tarefa',
  '/clientes': '+ Cliente',
}

function LoadingScreen() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '20px', color: 'var(--text3)',
      background: 'var(--bg)',
    }}>
      <img
        src={`${import.meta.env.BASE_URL}rbw-logo.svg`}
        alt="RBW Digital"
        style={{ width: '120px', height: '120px', borderRadius: '24px' }}
      />
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s ease-in-out 0.2s infinite' }} />
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.2s ease-in-out 0.4s infinite' }} />
      </div>
      {slow && <div style={{ fontSize: '12px', opacity: 0.5 }}>Conectando ao servidor...</div>}
    </div>
  )
}

function AppLayout() {
  const { pathname } = useLocation()
  const { appLoading } = useApp()
  const { canEdit, isActualAdmin } = usePermission()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskPreset, setTaskPreset] = useState(null)
  const [clientOpen, setClientOpen] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  if (appLoading) return <LoadingScreen />

  // O quadro chama com { columnId } no "+ Adicionar Tarefa" de cada coluna.
  // Nos outros lugares onNew vai direto num onClick e recebe o evento do
  // clique, por isso a checagem antes de tratar como preset.
  function openNewTask(preset) {
    setEditingTask(null)
    setTaskPreset(preset && preset.columnId != null ? preset : null)
    setTaskOpen(true)
  }
  function openEditTask(task) { setEditingTask(task); setTaskOpen(true) }
  function openNewClient() { setEditingClient(null); setClientOpen(true) }
  function openEditClient(client) { setEditingClient(client); setClientOpen(true) }

  function handleTopbarNew() {
    if (pathname === '/clientes' || pathname.startsWith('/clientes/')) openNewClient()
    else if (pathname === '/admin') return
    else if (pathname.startsWith('/docs')) return
    else openNewTask()
  }

  const isClientDetail = pathname.startsWith('/clientes/') && pathname !== '/clientes'
  const isRelatorio = pathname.startsWith('/relatorio')
  const isDocEditor = pathname.startsWith('/docs/') && pathname !== '/docs'
  const isAdmin = pathname === '/admin'
  const pageTitle = isClientDetail || isDocEditor ? undefined : (PAGE_TITLES[pathname] || 'RBW Digital')
  const newLabel = NEW_LABELS[pathname] || (pathname.startsWith('/clientes/') ? '+ Tarefa' : '+ Novo')
  const hideNewBtn = isAdmin || isRelatorio || isDocEditor || !canEdit

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        {!isRelatorio && !isDocEditor && (
          <Topbar
            title={isClientDetail ? '' : pageTitle}
            onNew={hideNewBtn ? undefined : (isClientDetail ? openNewTask : handleTopbarNew)}
            newLabel={isClientDetail ? '+ Tarefa' : newLabel}
            onMenuToggle={() => setSidebarOpen(o => !o)}
          />
        )}
        <div className={`content${isDocEditor ? ' content-doc' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard onNewTask={openNewTask} onEditTask={openEditTask} />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/tarefas" element={<Tarefas onNew={openNewTask} onEdit={openEditTask} />} />
            <Route path="/clientes" element={<Clientes onNew={openNewClient} onEdit={openEditClient} />} />
            <Route path="/clientes/:id" element={<ClientDetail onNewTask={openNewTask} onEditTask={openEditTask} onEditClient={openEditClient} />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/docs/:id" element={
              <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Carregando editor...</div>}>
                <DocEditor />
              </Suspense>
            } />
            <Route path="/admin" element={<AdminUsuarios />} />
            <Route path="/relatorio/:clientId" element={<Relatorio />} />
          </Routes>
        </div>
      </div>

      <TaskModal
        open={taskOpen}
        onClose={() => { setTaskOpen(false); setEditingTask(null); setTaskPreset(null) }}
        editingTask={editingTask}
        preset={taskPreset}
      />
      <ClientModal open={clientOpen} onClose={() => { setClientOpen(false); setEditingClient(null) }} editingClient={editingClient} />
    </div>
  )
}

// As policies do banco identificam o usuário pelo header x-rbw-token. Se ele
// não chegar ao servidor, as consultas voltam vazias — sem este aviso a tela
// pareceria apenas "sem dados", que é o sintoma mais confuso possível.
function SessionHeaderWarning() {
  return (
    <div style={{
      background: '#fef3c7', color: '#92400e', padding: '10px 16px',
      fontSize: '13px', lineHeight: 1.5, borderBottom: '1px solid #fcd34d',
    }}>
      ⚠️ <strong>Sessão não reconhecida pelo servidor.</strong> Os dados não vão
      carregar até isso ser resolvido. Tente sair e entrar de novo — se
      continuar, avise o suporte técnico.
    </div>
  )
}

function AuthGuard({ children }) {
  const { currentUser, authLoading, headerOk } = useAuth()
  // Aguarda resolução da sessão antes de redirecionar
  if (authLoading) return <LoadingScreen />
  if (!currentUser) return <Login />
  return (
    <AppProvider>
      {!headerOk && <SessionHeaderWarning />}
      {children}
    </AppProvider>
  )
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
