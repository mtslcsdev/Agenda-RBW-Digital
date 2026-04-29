import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('Iniciando getSession...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session obtida:', session?.user?.id || 'sem usuário')
        if (sessionError) console.error('Erro getSession:', sessionError)

        setSession(session)
        if (session?.user) {
          console.log('Buscando perfil para:', session.user.id)
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          console.log('Perfil resultado:', { data, error })
          if (!error && data) {
            setUser(data)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err)
      } finally {
        console.log('Finalizando carregamento')
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (!error && data) {
            setUser(data)
          }
        } catch (err) {
          console.error('Erro ao carregar perfil:', err)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
