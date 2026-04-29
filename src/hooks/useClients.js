import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setClients(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()

    const channel = supabase
      .channel('clients-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => fetchClients()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const createClient = async (clientData) => {
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (err) throw err
      setClients(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateClient = async (id, updates) => {
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setClients(prev => prev.map(c => c.id === id ? data : c))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteClient = async (id) => {
    try {
      const { error: err } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (err) throw err
      setClients(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  }
}
