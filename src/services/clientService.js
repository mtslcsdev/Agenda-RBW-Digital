import { supabase } from '../lib/supabase'

// ─── Leitura ──────────────────────────────────────────────────────────────────

export async function fetchClients() {
  return supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
}

// ─── Escrita ──────────────────────────────────────────────────────────────────

export async function createClient(row) {
  return supabase
    .from('clients')
    .insert(row)
    .select()
    .single()
}

export async function updateClient(id, row) {
  return supabase
    .from('clients')
    .update(row)
    .eq('id', id)
}

// Arquiva ou desarquiva um cliente sem excluí-lo
export async function archiveClient(id, archived) {
  return supabase
    .from('clients')
    .update({ archived })
    .eq('id', id)
}

// Oculta ou exibe um cliente nas listagens (ex: dropdown de seleção de tarefas)
export async function toggleHidden(id, hidden) {
  return supabase
    .from('clients')
    .update({ hidden })
    .eq('id', id)
}
