import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setTasks(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const createTask = async (taskData) => {
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single()

      if (err) throw err
      setTasks(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateTask = async (id, updates) => {
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (err) throw err
      setTasks(prev => prev.map(t => t.id === id ? data : t))
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteTask = async (id) => {
    try {
      const { error: err } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (err) throw err
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  }
}
