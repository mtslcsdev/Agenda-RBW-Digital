import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Auth } from './pages/Auth'
import { Dashboard } from './pages/Dashboard'

export function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) {
          loadProfile(session.user.id)
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const loadProfile = async (id) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setUser(data)
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a3329 0%, #2D6A4F 50%, #1a3329 100%)',
        color: 'white',
        fontWeight: '600'
      }}>
        Carregando FlowDesk...
      </div>
    )
  }

  return session ? <Dashboard session={session} user={user} /> : <Auth />
}
