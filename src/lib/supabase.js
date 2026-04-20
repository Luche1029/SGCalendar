import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Login: cerca il membro per email e password
export async function loginMember(email, password) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return { user: null, error: 'Credenziali non valide' }

  const valid = await bcrypt.compare(password, data.password_hash)
  if (!valid) return { user: null, error: 'Credenziali non valide' }

  return { user: data, error: null }
}

// Recupera tutti i membri (per le colonne del calendario)
export async function getMembers() {
  const { data } = await supabase.from('members').select('*').order('name')
  return data || []
}

// Recupera tutti gli eventi
export async function getEvents() {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('start_date')
  return data || []
}

// Crea nuovo evento
export async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single()
  return { data, error }
}

// Aggiorna evento
export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// Elimina evento
export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  return { error }
}

// Recupera le sync dell'utente corrente
export async function getMemberSyncs(memberId) {
  const { data } = await supabase
    .from('event_syncs')
    .select('event_id')
    .eq('member_id', memberId)
  return new Set((data || []).map(s => s.event_id))
}

// Salva sync per un membro
export async function saveMemberSync(eventId, memberId, googleEventId) {
  const { error } = await supabase
    .from('event_syncs')
    .upsert({ event_id: eventId, member_id: memberId, google_event_id: googleEventId })
  return { error }
}

// Recupera tutti i task con i membri assegnati
export async function getTasks() {
  const { data } = await supabase
    .from('tasks')
    .select(`
      *,
      task_assignments (
        member_id
      )
    `)
    .order('created_at')
  return data || []
}

// Crea task
export async function createTask(task, memberIds) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single()

  if (error) return { data: null, error }

  if (memberIds?.length) {
    await supabase.from('task_assignments').insert(
      memberIds.map(mid => ({ task_id: data.id, member_id: mid }))
    )
  }

  return { data, error: null }
}

// Aggiorna task
export async function updateTask(id, updates, memberIds) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error }

  if (memberIds !== undefined) {
    await supabase.from('task_assignments').delete().eq('task_id', id)
    if (memberIds.length) {
      await supabase.from('task_assignments').insert(
        memberIds.map(mid => ({ task_id: id, member_id: mid }))
      )
    }
  }

  return { data, error: null }
}

// Aggiorna solo lo status (per drag & drop)
export async function updateTaskStatus(id, status) {
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  return { error }
}

// Elimina task
export async function deleteTask(id) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  return { error }
}