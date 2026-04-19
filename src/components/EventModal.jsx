import { useState } from 'react'
import { createEvent, updateEvent, deleteEvent } from '../lib/supabase'

export default function EventModal({ isOpen, onClose, onSaved, date, event, columnType, currentUser }) {
  const isEdit = !!event
  const [title, setTitle] = useState(event?.title || '')
  const [description, setDescription] = useState(event?.description || '')
const [startDate, setStartDate] = useState(
  event?.start_date?.slice(0, 16) || date || ''
)
const defaultEnd = date
  ? (() => {
      const d = new Date(date)
      d.setHours(d.getHours() + 1)
      // Formatta manualmente senza conversione UTC
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    })()
  : ''

const [endDate, setEndDate] = useState(
  event?.end_date?.slice(0, 16) || defaultEnd
)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  
  const handleSave = async () => {
    if (!title.trim()) { setError('Il titolo è obbligatorio'); return }
    if (!startDate) { setError('La data è obbligatoria'); return }
    setLoading(true)

    const payload = {
      title: title.trim(),
      description: description.trim(),
      start_date: startDate,
      end_date: endDate || null,
      column_type: columnType,
      owner_id: currentUser.id,
    }

    const { error } = isEdit
      ? await updateEvent(event.id, payload)
      : await createEvent(payload)

    if (error) {
      setError('Errore nel salvataggio')
    } else {
      onSaved()
      onClose()
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('Eliminare questo evento?')) return
    setLoading(true)
    await deleteEvent(event.id)
    onSaved()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">

        <h2 className="text-lg font-bold text-white mb-4">
          {isEdit ? '✏️ Modifica evento' : '➕ Nuovo evento'}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Titolo *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome evento"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400">Descrizione</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Dettagli (opzionale)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Inizio *</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Fine</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
            >
              Elimina
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? 'Salvo...' : isEdit ? 'Aggiorna' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  )
}