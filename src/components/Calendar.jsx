import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useAuth } from '../context/AuthContext'
import EventModal from './EventModal'
import listPlugin from '@fullcalendar/list'
import SyncButton from './SyncButton'
import { getEvents, getMembers, getMemberSyncs } from '../lib/supabase'

const SHARED_COLUMNS = [
  { id: 'all',          label: '🌐 Vista completa',  color: '#A855F7' },
  { id: 'appointments', label: '📅 Appuntamenti SG', color: '#3B82F6' },
  { id: 'events',       label: '🎉 Eventi SG',        color: '#10B981' },
  { id: 'deadline',     label: '⏰ Deadline',          color: '#EF4444' },
]


export default function Calendar() {
  const { currentUser, logout } = useAuth()
  const [members, setMembers] = useState([])
  const [events, setEvents] = useState([])
  const [activeColumn, setActiveColumn] = useState('appointments')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [syncedEventIds, setSyncedEventIds] = useState(new Set())

  useEffect(() => {
    loadMembers()
    loadEvents()
    loadSyncs()
  }, [])

  async function loadMembers() {
    const data = await getMembers()
    setMembers(data)
  }

  async function loadEvents() {
    const data = await getEvents()
    setEvents(data)
  }

  async function loadSyncs() {
    const synced = await getMemberSyncs(currentUser.id)
    setSyncedEventIds(synced)
  }

  // Colonne visibili: le 3 condivise + quella personale dell'utente loggato
  const allColumns = [
    ...SHARED_COLUMNS,
    ...members.map(m => ({
      id: `member_${m.id}`,
      label: `👤 ${m.name}`,
      color: m.color,
      memberId: m.id,
    }))
  ]

  // Filtra eventi per la colonna attiva
const visibleEvents = events
  .filter(e => {
    if (activeColumn === 'all') return true
    return e.column_type === activeColumn
  })
  .map(e => {
    const colorMap = {
      appointments: '#3B82F6',
      events: '#10B981',
      deadline: '#EF4444',
      ...Object.fromEntries(members.map(m => [`member_${m.id}`, m.color]))
    }
    const color = colorMap[e.column_type] || '#6B7280'
    const isPersonal = e.column_type.startsWith('member_')

    return {
      id: e.id,
      title: e.title,
      start: e.start_date,
      end: e.end_date,
      backgroundColor: color,
      borderColor: 'transparent',
      classNames: isPersonal ? ['event-personal'] : [],
      extendedProps: { ...e }
    }
  })
// Aggiungi questa funzione dentro il componente Calendar
const renderEvent = (info) => {
  const ev = info.event.extendedProps
  const isShared = ['appointments', 'events', 'deadline'].includes(ev.column_type)
  const isSyncedByMe = syncedEventIds.has(ev.id)

  return (
    <div className="flex flex-col gap-0.5 p-0.5 overflow-hidden w-full">
      <span className="text-xs font-semibold truncate">{info.event.title}</span>
      {isShared && !isSyncedByMe && (
        <SyncButton
          event={ev}
          currentUser={currentUser}
          onSynced={() => setSyncedEventIds(prev => new Set([...prev, ev.id]))}
        />
      )}
      {isShared && isSyncedByMe && (
        <span className="text-xs opacity-70">✅ Sul tuo Google</span>
      )}
    </div>
  )
}
  // Controlla se l'utente può scrivere sulla colonna attiva
const canWrite = () => {
  if (activeColumn === 'all') return false // vista completa = solo lettura
  if (['appointments', 'events', 'deadline'].includes(activeColumn)) return true
  return activeColumn === `member_${currentUser.id}`
}

const handleDateClick = (info) => {
  if (!canWrite()) return

  // Vista mese → solo data, vista settimana → data + ora
  const hasTime = info.dateStr.includes('T')
  let start = ''

  if (hasTime) {
    // Clicato su un orario in vista settimana → già formato datetime
    start = info.dateStr.slice(0, 16) // "2026-04-18T14:00"
  } else {
    // Clicato su un giorno in vista mese → aggiungi orario default 09:00
    start = `${info.dateStr}T09:00`
  }

  setSelectedDate(start)
  setSelectedEvent(null)
  setModalOpen(true)
}

  const handleEventClick = (info) => {
    const ev = info.event.extendedProps
    // Può modificare solo se è la sua colonna o una condivisa
    const colIsShared = ['appointments', 'events', 'deadline'].includes(activeColumn)
    const colIsOwn = activeColumn === `member_${currentUser.id}`
    if (!colIsShared && !colIsOwn) return
    setSelectedEvent({ id: info.event.id, ...ev })
    setSelectedDate(null)
    setModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <h1 className="text-xl font-bold text-white">🚀 SG Calendar</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Ciao, <span className="text-white font-semibold">{currentUser.name}</span>
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Esci →
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar colonne */}
        <aside className="w-56 bg-gray-800 border-r border-gray-700 p-4 flex flex-col gap-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Colonne</p>

          {/* Colonne condivise */}
          {SHARED_COLUMNS.map(col => (
            <button
              key={col.id}
              onClick={() => setActiveColumn(col.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeColumn === col.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              style={activeColumn === col.id ? { backgroundColor: col.color + '33', color: col.color } : {}}
            >
              {col.label}
            </button>
          ))}

          <div className="border-t border-gray-700 my-2" />
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Membri</p>

          {/* Colonne membri */}
          {members.map(m => {
            const colId = `member_${m.id}`
            const isOwn = m.id === currentUser.id
            return (
              <button
                key={colId}
                onClick={() => setActiveColumn(colId)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${activeColumn === colId
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                style={activeColumn === colId ? { backgroundColor: m.color + '33', color: m.color } : {}}
              >
                {isOwn ? `👤 ${m.name} (tu)` : `👁 ${m.name}`}
              </button>
            )
          })}
        </aside>

        {/* Calendario */}
        <main className="flex-1 p-4 overflow-auto">

          {/* Banner colonna attiva */}
          <div className="mb-3 flex items-center gap-3">
            <div
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: (allColumns.find(c => c.id === activeColumn)?.color || '#6B7280') + '33',
                color: allColumns.find(c => c.id === activeColumn)?.color || '#9CA3AF'
              }}
            >
              {allColumns.find(c => c.id === activeColumn)?.label}
            </div>
            {!canWrite() && (
              <span className="text-xs text-gray-500">👁 Solo lettura</span>
            )}
            {canWrite() && (
              <span className="text-xs text-gray-500">✏️ Clicca su un giorno per aggiungere</span>
            )}
          </div>
            {activeColumn === 'all' && (
            <div className="mb-3 flex flex-wrap gap-2">
                {[
                { label: '📅 Appuntamenti', color: '#3B82F6' },
                { label: '🎉 Eventi SG',    color: '#10B981' },
                { label: '⏰ Deadline',     color: '#EF4444' },
                ...members.map(m => ({ label: `👤 ${m.name}`, color: m.color }))
                ].map(item => (
                <span
                    key={item.label}
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: item.color + '33', color: item.color }}
                >
                    {item.label}
                </span>
                ))}
            </div>
            )}
          {/* FullCalendar */}
          <div className="bg-gray-800 rounded-xl p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale="it"
              timeZone="Europe/Rome"
              dayHeaderFormat={{ 
                weekday: 'short', 
                day: 'numeric', 
                omitCommas: true 
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listMonth'
              }}
              buttonText={{
                today: 'Oggi',
                month: 'Mese',
                week: 'Settimana',
                list: 'Lista'
                }}
              events={visibleEvents}
              eventContent={renderEvent}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              selectable={canWrite()}
              height="auto"
            />
          </div>
        </main>
      </div>

      {/* Modale evento */}
      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={loadEvents}
          date={selectedDate}
          event={selectedEvent}
          columnType={activeColumn}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}