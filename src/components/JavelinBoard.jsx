import { useState, useEffect } from 'react'
import { DragDropContext, Droppable } from '@hello-pangea/dnd'
import {
  getJavelinBoards, createJavelinBoard, deleteJavelinBoard,
  getExperiments, upsertExperiment,
  getStickies, createSticky, updateSticky, deleteSticky,
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StickyCard from './StickyCard'

const ROWS = [
  { id: 'customer',            label: '👤 Customer',            color: '#3B82F6', time: '5 min' },
  { id: 'problem',             label: '🔥 Problem',             color: '#EF4444', time: '5 min' },
  { id: 'solution',            label: '💡 Solution',            color: '#10B981', time: '5 min' },
  { id: 'riskiest_assumption', label: '⚠️ Riskiest Assumption', color: '#F59E0B', time: '10 min' },
  { id: 'success_criterion',   label: '🎯 Success Criterion',   color: '#8B5CF6', time: '' },
  { id: 'result_decision',     label: '📊 Result & Decision',   color: '#06B6D4', time: '' },
  { id: 'learning',            label: '🧠 Learning',            color: '#EC4899', time: '' },
]

const EXPERIMENTS = [1, 2, 3, 4, 5]

export default function JavelinBoard() {
  const { currentUser } = useAuth()
  const [boards, setBoards] = useState([])
  const [activeBoard, setActiveBoard] = useState(null)
  const [stickies, setStickies] = useState([])
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardType, setNewBoardType] = useState('b2c')
  const [creating, setCreating] = useState(false)
  const [editingSticky, setEditingSticky] = useState(null)
  const [editingText, setEditingText] = useState('')

  useEffect(() => { loadBoards() }, [])

  useEffect(() => {
    if (activeBoard) {
      loadStickies(activeBoard.id)
    }
  }, [activeBoard])

  async function loadBoards() {
    const data = await getJavelinBoards()
    setBoards(data)
    if (data.length > 0 && !activeBoard) setActiveBoard(data[0])
  }

  async function loadStickies(boardId) {
    const data = await getStickies(boardId)
    setStickies(data)
  }

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    // Cestino
    if (destination.droppableId === 'trash') {
      await handleDeleteSticky(draggableId)
      return
    }

    if (source.droppableId === destination.droppableId) return

    const sticky = stickies.find(s => s.id === draggableId)
    if (!sticky) return

    let newLocation = 'brainstorm'
    let newExpNumber = null

    if (destination.droppableId.startsWith('exp_')) {
      const parts = destination.droppableId.split('_')
      newExpNumber = parseInt(parts[1])
      newLocation = `experiment_${newExpNumber}`
    }

    setStickies(prev => prev.map(s =>
      s.id === draggableId
        ? { ...s, location: newLocation, experiment_number: newExpNumber }
        : s
    ))

    await updateSticky(draggableId, {
      location: newLocation,
      experiment_number: newExpNumber,
    })
  }

  const handleAddSticky = async (rowId) => {
    const { data } = await createSticky({
      board_id: activeBoard.id,
      row_type: rowId,
      content: '',
      location: 'brainstorm',
      experiment_number: null,
      position: stickies.filter(s => s.row_type === rowId).length,
      created_by: currentUser.id,
    })
    if (data) {
      setStickies(prev => [...prev, data])
      setEditingSticky(data.id)
      setEditingText('')
    }
  }

  const handleSaveSticky = async (id) => {
    if (!editingText.trim()) {
      await deleteSticky(id)
      setStickies(prev => prev.filter(s => s.id !== id))
    } else {
      await updateSticky(id, { content: editingText.trim() })
      setStickies(prev => prev.map(s =>
        s.id === id ? { ...s, content: editingText.trim() } : s
      ))
    }
    setEditingSticky(null)
    setEditingText('')
  }

  const handleDeleteSticky = async (id) => {
    await deleteSticky(id)
    setStickies(prev => prev.filter(s => s.id !== id))
  }

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return
    setCreating(true)
    const { data } = await createJavelinBoard({
      name: newBoardName.trim(),
      type: newBoardType,
      created_by: currentUser.id,
    })
    if (data) {
      await loadBoards()
      setActiveBoard(data)
    }
    setNewBoardName('')
    setShowNewBoard(false)
    setCreating(false)
  }

  const handleDeleteBoard = async (board) => {
    if (!confirm(`Eliminare la board "${board.name}"?`)) return
    await deleteJavelinBoard(board.id)
    const remaining = boards.filter(b => b.id !== board.id)
    setBoards(remaining)
    setActiveBoard(remaining[0] || null)
  }

  const getBrainstormStickies = (rowId) =>
    stickies.filter(s => s.row_type === rowId && s.location === 'brainstorm')

  const getExpStickies = (rowId, expNumber) =>
    stickies.filter(s =>
      s.row_type === rowId &&
      s.location === `experiment_${expNumber}`
    )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Toolbar boards */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700
                      overflow-x-auto flex-shrink-0">
        {boards.map(board => (
          <div key={board.id} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveBoard(board)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeBoard?.id === board.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:text-white'}`}
            >
              {board.type === 'b2b' ? '🏢' : '👤'} {board.name}
            </button>
            {activeBoard?.id === board.id && (
              <button
                onClick={() => handleDeleteBoard(board)}
                className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors"
                title="Elimina board"
              >✕</button>
            )}
          </div>
        ))}

        {showNewBoard ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              value={newBoardName}
              onChange={e => setNewBoardName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
              className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5
                         w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome board"
              autoFocus
            />
            <select
              value={newBoardType}
              onChange={e => setNewBoardType(e.target.value)}
              className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1.5
                         focus:outline-none"
            >
              <option value="b2c">B2C</option>
              <option value="b2b">B2B</option>
            </select>
            <button
              onClick={handleCreateBoard}
              disabled={creating}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white
                         text-sm rounded-lg transition-colors"
            >
              {creating ? '...' : 'Crea'}
            </button>
            <button
              onClick={() => setShowNewBoard(false)}
              className="text-gray-400 hover:text-white text-sm"
            >✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewBoard(true)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300
                       hover:text-white text-sm rounded-lg transition-colors flex-shrink-0"
          >
            + Nuova board
          </button>
        )}
      </div>

      {/* Board vuota */}
      {!activeBoard && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-lg font-medium">Nessuna board</p>
            <p className="text-sm mt-1">Crea una nuova Javelin Board per iniziare</p>
          </div>
        </div>
      )}

      {/* Griglia */}
      {activeBoard && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-auto p-4">
            <div className="min-w-max">

              {/* Header colonne */}
              <div className="flex mb-2 items-center">

                {/* Cestino [0,0] */}
                <div className="w-40 flex-shrink-0 mr-1">
                  <Droppable droppableId="trash">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`h-10 rounded-lg border-2 border-dashed flex
                                    items-center justify-center text-sm font-medium
                                    transition-all
                                    ${snapshot.isDraggingOver
                                      ? 'border-red-400 bg-red-900 text-red-300 scale-105'
                                      : 'border-gray-600 text-gray-500'}`}
                      >
                        {snapshot.isDraggingOver ? '🗑 Rilascia' : '🗑 Cestino'}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Brainstorm header */}
                <div className="w-64 flex-shrink-0 mx-1 text-center text-sm font-bold
                                text-gray-300 bg-gray-700 rounded-lg py-2">
                  🧠 Brainstorming
                </div>

                {/* Esperimenti header */}
                {EXPERIMENTS.map(n => (
                  <div key={n}
                    className="w-48 flex-shrink-0 mx-1 text-center text-sm font-bold
                               text-gray-300 bg-gray-700 rounded-lg py-2">
                    Esperimento {n}
                  </div>
                ))}
              </div>

              {/* Righe contenuto */}
              {ROWS.map(row => (
                <div key={row.id} className="flex mb-2">

                  {/* Label riga */}
                  <div
                    className="w-40 flex-shrink-0 mr-1 rounded-lg p-3 flex
                               flex-col justify-center"
                    style={{ backgroundColor: row.color + '22' }}
                  >
                    <span className="text-xs font-bold" style={{ color: row.color }}>
                      {row.label}
                    </span>
                    {row.time && (
                      <span className="text-xs text-gray-500 mt-0.5">⏱ {row.time}</span>
                    )}
                  </div>

                  {/* Brainstorm zone */}
                  <Droppable droppableId={`brainstorm_${row.id}`} direction="horizontal">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-64 flex-shrink-0 mx-1 rounded-lg p-2 min-h-20
                                    flex flex-wrap gap-2 content-start transition-colors
                                    ${snapshot.isDraggingOver ? 'bg-gray-600' : 'bg-gray-800'}`}
                      >
                        {getBrainstormStickies(row.id).map((sticky, i) => (
                          <StickyCard
                            key={sticky.id}
                            sticky={sticky}
                            index={i}
                            editingSticky={editingSticky}
                            editingText={editingText}
                            setEditingSticky={setEditingSticky}
                            setEditingText={setEditingText}
                            onSave={handleSaveSticky}
                            onDelete={handleDeleteSticky}
                          />
                        ))}
                        {provided.placeholder}
                        <button
                          onClick={() => handleAddSticky(row.id)}
                          className="w-8 h-8 rounded-lg border border-dashed border-gray-600
                                     hover:border-gray-400 text-gray-500 hover:text-gray-300
                                     flex items-center justify-center text-lg transition-colors
                                     flex-shrink-0"
                          title="Aggiungi post-it"
                        >+</button>
                      </div>
                    )}
                  </Droppable>

                  {/* Zone esperimenti */}
                  {EXPERIMENTS.map(n => (
                    <Droppable
                      key={n}
                      droppableId={`exp_${n}_${row.id}`}
                      direction="horizontal"
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`w-48 flex-shrink-0 mx-1 rounded-lg p-2 min-h-20
                                      flex flex-wrap gap-2 content-start transition-colors
                                      ${snapshot.isDraggingOver ? 'bg-gray-600' : 'bg-gray-800'}`}
                        >
                          {getExpStickies(row.id, n).map((sticky, i) => (
                            <StickyCard
                              key={sticky.id}
                              sticky={sticky}
                              index={i}
                              editingSticky={editingSticky}
                              editingText={editingText}
                              setEditingSticky={setEditingSticky}
                              setEditingText={setEditingText}
                              onSave={handleSaveSticky}
                              onDelete={handleDeleteSticky}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  )
}