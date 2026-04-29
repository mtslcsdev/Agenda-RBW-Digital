import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEvents()

    const subscription = supabase
      .channel('events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true })

      if (err) throw err
      setEvents(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Erro ao buscar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData) => {
    try {
      const { data, error: err } = await supabase
        .from('events')
        .insert([eventData])
        .select()

      if (err) throw err
      setEvents([...events, ...data])
      return data?.[0]
    } catch (err) {
      setError(err.message)
      console.error('Erro ao criar evento:', err)
      throw err
    }
  }

  const updateEvent = async (id, updates) => {
    try {
      const { data, error: err } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()

      if (err) throw err
      setEvents(events.map(e => e.id === id ? data[0] : e))
      return data?.[0]
    } catch (err) {
      setError(err.message)
      console.error('Erro ao atualizar evento:', err)
      throw err
    }
  }

  const deleteEvent = async (id) => {
    try {
      const { error: err } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (err) throw err
      setEvents(events.filter(e => e.id !== id))
    } catch (err) {
      setError(err.message)
      console.error('Erro ao deletar evento:', err)
      throw err
    }
  }

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  }
}
