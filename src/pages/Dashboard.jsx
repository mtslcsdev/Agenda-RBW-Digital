import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

// Páginas
import DashboardHome from './DashboardHome'
import Clients from './Clients'
import Tasks from './Tasks'
import Calendar from './Calendar'
import Team from './Team'
import Finance from './Finance'

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

  const currentView = Object.entries(pathToView).find(([path]) => location.pathname === path)?.[1] || 'dashboard'

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
            <Route path="/clientes" element={<Clients />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/agenda" element={<Calendar />} />
            <Route path="/equipe" element={<Team />} />
            <Route path="/financeiro" element={<Finance />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
