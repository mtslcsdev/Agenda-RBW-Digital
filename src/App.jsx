import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'

function AppContent() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontWeight: '600'
      }}>
        Carregando FlowDesk...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/*" element={session ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="/auth" element={!session ? <Auth /> : <Navigate to="/" />} />
    </Routes>
  )
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </Router>
  )
}
