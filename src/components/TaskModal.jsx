import { useState } from 'react'
import { createTask, updateTask, deleteTask } from '../lib/supabase'

export default function TaskModal({ isOpen, onClose, onSaved, task, members, currentUser }) {
  const isEdit = !!task?.id
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState(task?.status || 'todo')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [assignedIds, setAssignedIds] = useState(
    task?.task_assignments?.map(a => a.member_id) || []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleMember = (id) => {
    setAssignedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('Il titolo è obbligatorio'); return }
    setLoading(true)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate || null,
      created_by: currentUser.id,
    }

    const { error } = isEdit
      ? await updateTask(task.id, payload, assignedIds)
      : await createTask(payload, assignedIds)

    if (error) {
      setError('Errore nel salvataggio')
    } else {
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Eliminare questo task?')) return
    setLoading(true)
    await deleteTask(task.id)
    onSaved()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center 
                    justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">

        <h2 className="text-lg font-bold text-white mb-4">
          {isEdit ? '✏️ Modifica task' : '➕ Nuovo task'}
        </h2>

        <div className="space-y-3">

          {/* Titolo */}
          <div>
            <label className="text-xs text-gray-400">Titolo *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome del task"
            />
          </div>

          {/* Descrizione */}
          <div>
            <label className="text-xs text-gray-400">Descrizione</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Dettagli (opzionale)"
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Stato</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">📋 Da fare</option>
                <option value="inprogress">⚡ In corso</option>
                <option value="review">👁 In revisione</option>
                <option value="done">✅ Completato</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Priorità</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">🟢 Bassa</option>
                <option value="medium">🟡 Media</option>
                <option value="high">🔴 Alta</option>
              </select>
            </div>
          </div>

          {/* Scadenza */}
          <div>
            <label className="text-xs text-gray-400">Scadenza</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assegna membri */}
          <div>
            <label className="text-xs text-gray-400 block mb-2">
              Assegna a
            </label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium 
                             transition-all border"
                  style={assignedIds.includes(m.id) ? {
                    backgroundColor: m.color + '33',
                    color: m.color,
                    borderColor: m.color,
                  } : {
                    backgroundColor: 'transparent',
                    color: '#6B7280',
                    borderColor: '#374151',
                  }}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        {/* Azioni */}
        <div className="flex gap-2 mt-5">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white 
                         rounded-lg text-sm transition-colors"
            >
              Elimina
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white 
                       rounded-lg text-sm transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                       rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? 'Salvo...' : isEdit ? 'Aggiorna' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}