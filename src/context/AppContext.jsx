import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export const initialTasks = [
  { id: 1, title: 'Configurar webhook N8N – Neoprop', done: true, tag: 'GHL', tagColor: 'green', client: 'Neoprop', date: '07/04', priority: 'Normal' },
  { id: 2, title: 'Revisar fluxo de aprovação de trader', done: false, tag: 'N8N', tagColor: 'orange', client: 'Neoprop', date: '08/04', priority: 'Alta' },
  { id: 3, title: 'Switch node – 3 planos Asaas', done: false, tag: 'N8N', tagColor: 'orange', client: 'Neoprop', date: '09/04', priority: 'Urgente' },
  { id: 4, title: 'Enviar proposta para novo cliente', done: false, tag: 'Vendas', tagColor: 'purple', client: 'Pessoal', date: '10/04', priority: 'Normal' },
  { id: 5, title: 'Reunião com Joy – engajamento de leads', done: false, tag: 'Reunião', tagColor: 'yellow', client: 'Pessoal', date: '08/04', priority: 'Normal' },
  { id: 6, title: 'Rascunho capítulo 1 – Ebook 5km', done: false, tag: 'Pessoal', tagColor: 'purple', client: 'Pessoal', date: '11/04', priority: 'Normal' },
  { id: 7, title: 'Checar integração Asaas API', done: true, tag: 'Dev', tagColor: 'green', client: 'Neoprop', date: '07/04', priority: 'Normal' },
]

export const initialClients = [
  { id: 1, initials: 'NP', name: 'Neoprop', segment: 'Trader Training Program', email: 'robervan@neoprop.com', status: 'Em andamento', statusColor: 'orange', color: '#2D6A4F', tags: ['GHL', 'N8N'], taskCount: 5 },
  { id: 2, initials: 'CB', name: 'Cliente B', segment: 'E-commerce / Loja virtual', email: 'contato@clienteb.com', status: 'Ativo', statusColor: 'green', color: '#5B4FCF', tags: ['Automação'], taskCount: 2 },
  { id: 3, initials: 'MK', name: 'Cliente C', segment: 'Marketing Digital', email: 'contato@clientec.com', status: 'Onboarding', statusColor: 'yellow', color: '#E07A3A', tags: [], taskCount: 0 },
]

export const initialNotes = [
  { id: 1, title: '🔧 Neoprop – Webhook Rejeição', content: 'Mapear campo de motivo no webhook de rejeição. Verificar com Robervan a estrutura esperada para o Switch node dos 3 planos.', date: '07/04/2026', project: 'Neoprop', color: 'yellow' },
  { id: 2, title: '🏃 Guia do Corredor – 5km', content: 'Preço: R$29,90 · Hotmart. Validar organicamente primeiro. Estrutura: aquecimento, treino base, progressão, recuperação.', date: '06/04/2026', project: 'Pessoal', color: 'blue' },
  { id: 3, title: '📊 Meta Ads – Estudo', content: 'Sessões curtas diárias. Foco atual: estrutura de campanha, conjuntos de anúncios, públicos lookalike e retargeting.', date: '05/04/2026', project: 'Pessoal', color: 'purple' },
]

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const [tasks, setTasks] = useState(initialTasks)
  const [clients] = useState(initialClients)
  const [notes] = useState(initialNotes)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  return (
    <AppContext.Provider value={{ theme, toggleTheme, tasks, setTasks, clients, notes, toggleTask }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
