import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getTasks, updateTaskStatus, deleteTask, getMembers } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import TaskModal from './TaskModal'

const COLUMNS = [
  { id: 'todo',       label: '📋 Da fare',      color: '#6B7280' },
  { id: 'inprogress', label: '⚡ In corso',      color: '#F59E0B' },
  { id: 'review',     label: '👁 In revisione',  color: '#3B82F6' },
  { id: 'done',       label: '✅ Completato',    color: '#10B981' },
]

const PRIORITY_COLORS = {
  low:    { bg: '#064E3B', text: '#6EE7B7', label: 'Bassa' },
  medium: { bg: '#78350F', text: '#FCD34D', label: 'Media' },
  high:   { bg: '#7F1D1D', text: '#FCA5A5', label: 'Alta'  },
}

export default function KanbanBoard() {
  const { currentUser } = useAuth()
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [filterMember, setFilterMember] = useState('all')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [t, m] = await Promise.all([getTasks(), getMembers()])
    setTasks(t)
    setMembers(m)
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    // Aggiorna UI ottimisticamente
    setTasks(prev => prev.map(t =>
      t.id === draggableId ? { ...t, status: destination.droppableId } : t
    ))

    await updateTaskStatus(draggableId, destination.droppableId)
  }

  const handleCardClick = (task) => {
    setSelectedTask(task)
    setModalOpen(true)
  }

  const handleNewTask = (columnId) => {
    setSelectedTask({ status: columnId })
    setModalOpen(true)
  }

  // Filtra per membro se selezionato
  const filteredTasks = tasks.filter(t => {
    if (filterMember === 'all') return true
    return t.task_assignments?.some(a => a.member_id === filterMember)
  })

  const getColumnTasks = (columnId) =>
    filteredTasks.filter(t => t.status === columnId)

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const getMemberColor = (memberId) =>
    members.find(m => m.id === memberId)?.color || '#6B7280'

  const getMemberName = (memberId) =>
    members.find(m => m.id === memberId)?.name || '?'

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
        <span className="text-sm text-gray-400">Filtra per membro:</span>
        <select
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tutti</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={() => handleNewTask('todo')}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white 
                     text-sm font-semibold rounded-lg transition-colors"
        >
          + Nuovo task
        </button>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 p-4 overflow-x-auto flex-1">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex flex-col w-72 flex-shrink-0">

              {/* Header colonna */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-sm font-semibold text-gray-300">
                    {col.label}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-700 
                                   px-1.5 py-0.5 rounded-full">
                    {getColumnTasks(col.id).length}
                  </span>
                </div>
                <button
                  onClick={() => handleNewTask(col.id)}
                  className="text-gray-500 hover:text-white text-lg leading-none 
                             transition-colors"
                  title="Aggiungi task"
                >
                  +
                </button>
              </div>

              {/* Droppable area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-2 flex-1 min-h-32 p-2 rounded-xl 
                                transition-colors
                                ${snapshot.isDraggingOver
                                  ? 'bg-gray-700'
                                  : 'bg-gray-800'}`}
                  >
                    {getColumnTasks(col.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleCardClick(task)}
                            className={`bg-gray-750 border border-gray-600 rounded-xl 
                                        p-3 cursor-pointer transition-all
                                        hover:border-gray-400
                                        ${snapshot.isDragging
                                          ? 'shadow-2xl rotate-1 border-blue-500'
                                          : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: '#1F2937',
                            }}
                          >
                            {/* Priority badge */}
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: PRIORITY_COLORS[task.priority]?.bg,
                                  color: PRIORITY_COLORS[task.priority]?.text,
                                }}
                              >
                                {PRIORITY_COLORS[task.priority]?.label}
                              </span>

                              {/* Scadenza */}
                              {task.due_date && (
                                <span className={`text-xs ${
                                  isOverdue(task.due_date) && task.status !== 'done'
                                    ? 'text-red-400 font-semibold'
                                    : 'text-gray-400'
                                }`}>
                                  {isOverdue(task.due_date) && task.status !== 'done'
                                    ? '⚠️ '
                                    : '📅 '}
                                  {new Date(task.due_date).toLocaleDateString('it-IT')}
                                </span>
                              )}
                            </div>

                            {/* Titolo */}
                            <p className="text-sm text-white font-medium mb-2 
                                          leading-snug">
                              {task.title}
                            </p>

                            {/* Descrizione */}
                            {task.description && (
                              <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Avatar membri assegnati */}
                            {task.task_assignments?.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {task.task_assignments.map(a => (
                                  <span
                                    key={a.member_id}
                                    className="text-xs px-2 py-0.5 rounded-full 
                                               font-medium"
                                    style={{
                                      backgroundColor: getMemberColor(a.member_id) + '33',
                                      color: getMemberColor(a.member_id),
                                    }}
                                  >
                                    {getMemberName(a.member_id)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modale */}
      {modalOpen && (
        <TaskModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedTask(null) }}
          onSaved={loadAll}
          task={selectedTask}
          members={members}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}