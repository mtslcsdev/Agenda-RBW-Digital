import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

// Páginas
import DashboardHome from './DashboardHome'

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const pathToView = {
    '/': 'dashboard',
    '/clientes': 'clientes',
    '/tarefas': 'tarefas',
    '/agenda': 'agenda',
    '/equipe': 'equipe',
    '/financeiro': 'financeiro',
  }

  const currentView = pathToView[location.pathname] || 'dashboard'

  const handleNavigate = (view) => {
    const viewToPath = {
      dashboard: '/',
      clientes: '/clientes',
      tarefas: '/tarefas',
      agenda: '/agenda',
      equipe: '/equipe',
      financeiro: '/financeiro',
    }
    navigate(viewToPath[view] || '/')
  }

  const getTitles = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    tarefas: 'Tarefas',
    agenda: 'Calendário',
    equipe: 'Equipe',
    financeiro: 'Financeiro',
  }

  return (
    <div className="layout">
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />
      <div className="main-container">
        <TopBar title={getTitles[currentView]} />
        <div className="content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/*" element={<DashboardHome />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
