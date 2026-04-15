import { supabase } from '../lib/supabase'

// Campos aceitos em taskRow ao criar ou atualizar uma tarefa
const TASK_FIELDS = [
  'title',
  'client',
  'client_id',
  'tag',
  'tag_color',
  'priority',
  'date',
  'notes',
  'done',
  'task_status',
  'assignee_name',
  'assignee_id',
  'created_by',
]

// Retorna apenas as chaves de `taskRow` que existem em TASK_FIELDS (evita campos extras)
function pickTaskFields(taskRow) {
  return Object.fromEntries(
    Object.entries(taskRow).filter(([key]) => TASK_FIELDS.includes(key))
  )
}

// ─── Leitura ─────────────────────────────────────────────────────────────────

export async function fetchTasks() {
  return supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export async function createTask(taskRow) {
  return supabase
    .from('tasks')
    .insert(pickTaskFields(taskRow))
    .select()
    .single()
}

export async function updateTask(id, taskRow) {
  return supabase
    .from('tasks')
    .update(pickTaskFields(taskRow))
    .eq('id', id)
}

export async function deleteTask(id) {
  return supabase
    .from('tasks')
    .delete()
    .eq('id', id)
}

// Marca ou desmarca uma tarefa como concluída e atualiza o status correspondente
export async function toggleTask(id, done, taskStatus) {
  return supabase
    .from('tasks')
    .update({ done, task_status: taskStatus })
    .eq('id', id)
}

// Move uma tarefa para uma nova coluna/status no quadro (ex: kanban)
export async function moveTask(id, newStatus, done) {
  return supabase
    .from('tasks')
    .update({ task_status: newStatus, done })
    .eq('id', id)
}

// Arquiva ou desarquiva uma tarefa sem excluí-la
export async function archiveTask(id, archived) {
  return supabase
    .from('tasks')
    .update({ archived })
    .eq('id', id)
}
