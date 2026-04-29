import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })
  const [search, setSearch] = useState('')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  const addNotification = (notification) => {
    const id = Date.now()
    const newNotif = { ...notification, id }
    setNotifications(prev => [...prev, newNotif])

    if (notification.duration !== false) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration || 3000)
    }

    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      search,
      setSearch,
      notifications,
      addNotification,
      removeNotification,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
