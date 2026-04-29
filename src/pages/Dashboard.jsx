import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { ClientList } from '../components/ClientList'
import { TaskList } from '../components/TaskList'
import styles from './Dashboard.module.css'

export function Dashboard({ session, user }) {
  const [currentView, setCurrentView] = useState('dashboard')
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => localStorage.getItem('flowdesk_theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('flowdesk_theme', theme)
  }, [theme])

  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    const clientsSubscription = supabase
      .channel('clients-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => {
        loadData()
      })
      .subscribe()

    const tasksSubscription = supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      clientsSubscription.unsubscribe()
      tasksSubscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      setClients(clientsData || [])
      setTasks(tasksData || [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta?')) {
      await supabase.auth.signOut()
    }
  }

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      clientes: 'Clientes',
      tarefas: 'Tarefas',
      equipe: 'Equipe',
    }
    return titles[currentView] || 'FlowDesk'
  }

  return (
    <div className={styles.app}>
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        user={user}
        theme={theme}
        onThemeToggle={toggleTheme}
        onLogout={handleLogout}
      />

      <div className={styles.main}>
        <TopBar title={getPageTitle()} />

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : currentView === 'dashboard' ? (
            <div>
              <div className={styles.welcomeBanner}>
                <div>
                  <h3>Bem-vindo de volta, {user?.name}! 👋</h3>
                  <p>Você tem {tasks.filter(t => !t.completed).length} tarefas pendentes</p>
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.card}>
                  <h3>👥 Clientes ({clients.length})</h3>
                  <ClientList clients={clients} onRefresh={loadData} compact />
                </div>
                <div className={styles.card}>
                  <h3>✓ Tarefas Recentes</h3>
                  <TaskList tasks={tasks.slice(0, 5)} onRefresh={loadData} compact />
                </div>
              </div>
            </div>
          ) : currentView === 'clientes' ? (
            <ClientList clients={clients} onRefresh={loadData} />
          ) : currentView === 'tarefas' ? (
            <TaskList tasks={tasks} onRefresh={loadData} />
          ) : (
            <div className={styles.placeholder}>
              Seção em desenvolvimento
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
