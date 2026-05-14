import { useState, useEffect, useCallback } from 'react'
import {
  getLeanCanvases, createLeanCanvas, deleteLeanCanvas,
  getLeanCanvasBlocks, upsertLeanCanvasBlock,
} from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateLeanCanvasPDF } from '../lib/pdfExport'

// Colori per blocco
const BLOCK_COLORS = {
  problems:            '#EF4444',
  alternatives:        '#EF4444',
  solutions:           '#10B981',
  uvp:                 '#8B5CF6',
  unfair_advantage:    '#F59E0B',
  customer_segments:   '#3B82F6',
  early_adopters:      '#3B82F6',
  channels:            '#06B6D4',
  key_metrics:         '#EC4899',
  cost_structure:      '#6B7280',
  revenue_streams:     '#6B7280',
}

const BLOCK_LABELS = {
  problems:            '🔥 Problemi',
  alternatives:        '🔄 Alternative esistenti',
  solutions:           '💡 Soluzioni',
  uvp:                 '⭐ Unique Value Proposition',
  unfair_advantage:    '🏆 Unfair Advantage',
  customer_segments:   '👥 Customer Segments',
  early_adopters:      '🚀 Early Adopters',
  channels:            '📣 Channels',
  key_metrics:         '📊 Key Metrics',
  cost_structure:      '💸 Cost Structure',
  revenue_streams:     '💰 Revenue Streams',
}

// Componente singolo blocco editabile
function CanvasBlock({ blockType, content, onSave, tall = false }) {
  const [text, setText] = useState(content)
  const [saving, setSaving] = useState(false)
  const color = BLOCK_COLORS[blockType]
  const label = BLOCK_LABELS[blockType]

  useEffect(() => { setText(content) }, [content])

  const handleBlur = async () => {
    if (text === content) return
    setSaving(true)
    await onSave(blockType, text)
    setSaving(false)
  }

  // Autosave con debounce
  useEffect(() => {
    if (text === content) return
    const t = setTimeout(async () => {
      setSaving(true)
      await onSave(blockType, text)
      setSaving(false)
    }, 1000)
    return () => clearTimeout(t)
  }, [text])

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border"
      style={{ borderColor: color + '44', height: tall ? '320px' : '220px' }}
    >
      {/* Header blocco */}
      <div
        className="px-3 py-2 flex items-center justify-between flex-shrink-0"
        style={{ backgroundColor: color + '22' }}
      >
        <span className="text-xs font-bold" style={{ color }}>
          {label}
        </span>
        {saving && <span className="text-xs text-gray-500">💾</span>}
      </div>

      {/* Area testo */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        className="flex-1 bg-gray-800 text-gray-200 text-xs p-3 resize-none
                   focus:outline-none focus:bg-gray-750 placeholder-gray-600
                   leading-relaxed"
        style={{ backgroundColor: color + '08' }}
        placeholder={`Inserisci ${label.replace(/^.+? /, '')}...`}
      />
    </div>
  )
}

export default function LeanCanvas() {
  const { currentUser } = useAuth()
  const [canvases, setCanvases] = useState([])
  const [activeCanvas, setActiveCanvas] = useState(null)
  const [blocks, setBlocks] = useState({})
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { loadCanvases() }, [])

  useEffect(() => {
    if (activeCanvas) loadBlocks(activeCanvas.id)
  }, [activeCanvas])

  async function loadCanvases() {
    const data = await getLeanCanvases()
    setCanvases(data)
    if (data.length > 0 && !activeCanvas) setActiveCanvas(data[0])
  }

  async function loadBlocks(canvasId) {
    const data = await getLeanCanvasBlocks(canvasId)
    const map = {}
    data.forEach(b => { map[b.block_type] = b.content })
    setBlocks(map)
  }

  const handleSave = useCallback(async (blockType, content) => {
    if (!activeCanvas) return
    await upsertLeanCanvasBlock(activeCanvas.id, blockType, content)
    setBlocks(prev => ({ ...prev, [blockType]: content }))
  }, [activeCanvas])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const { data } = await createLeanCanvas({
      name: newName.trim(),
      created_by: currentUser.id,
    })
    if (data) {
      await loadCanvases()
      setActiveCanvas(data)
    }
    setNewName('')
    setShowNew(false)
    setCreating(false)
  }

  const handleDelete = async (canvas) => {
    if (!confirm(`Eliminare "${canvas.name}"?`)) return
    await deleteLeanCanvas(canvas.id)
    const remaining = canvases.filter(c => c.id !== canvas.id)
    setCanvases(remaining)
    setActiveCanvas(remaining[0] || null)
    setBlocks({})
  }

  const block = (type, tall = false) => (
    <CanvasBlock
      key={type}
      blockType={type}
      content={blocks[type] || ''}
      onSave={handleSave}
      tall={tall}
    />
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700
                      overflow-x-auto flex-shrink-0">
        {canvases.map(canvas => (
          <div key={canvas.id} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveCanvas(canvas)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${activeCanvas?.id === canvas.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:text-white'}`}
            >
              🗺 {canvas.name}
            </button>
            {activeCanvas?.id === canvas.id && (
              <button
                onClick={() => handleDelete(canvas)}
                className="text-gray-500 hover:text-red-400 text-xs px-1 transition-colors"
                title="Elimina canvas"
              >✕</button>
            )}
          </div>
        ))}

        {showNew ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5
                         w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome canvas"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white
                         text-sm rounded-lg transition-colors"
            >
              {creating ? '...' : 'Crea'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="text-gray-400 hover:text-white text-sm"
            >✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNew(true)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300
                       hover:text-white text-sm rounded-lg transition-colors flex-shrink-0"
          >
            + Nuovo canvas
          </button>          
        )}
      </div>
{activeCanvas && (
  <button
    onClick={() => generateLeanCanvasPDF(activeCanvas, blocks)}
    className="ml-auto px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300
               hover:text-white text-sm rounded-lg transition-colors flex-shrink-0
               flex items-center gap-2"
  >
    📄 Esporta PDF
  </button>
)}
      {/* Canvas vuoto */}
      {!activeCanvas && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-4xl mb-3">🗺</p>
            <p className="text-lg font-medium">Nessun Lean Canvas</p>
            <p className="text-sm mt-1">Crea un nuovo canvas per iniziare</p>
          </div>
        </div>
      )}

      {/* Griglia Lean Canvas */}
      {activeCanvas && (
        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-max max-w-7xl mx-auto space-y-2">

            {/* Titolo */}
            <h2 className="text-center text-lg font-bold text-gray-300 mb-4">
              {activeCanvas.name}
            </h2>

            {/* Riga 1 — 5 colonne principali */}
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1.4fr 1fr 1fr' }}>
              {block('problems')}
              {block('solutions')}
              {block('uvp', false)}
              {block('unfair_advantage')}
              {block('customer_segments')}
            </div>

            {/* Riga 2 — sotto-blocchi */}
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1.4fr 1fr 1fr' }}>
              {block('alternatives')}
              {block('channels')}
              {block('key_metrics')}
              <div /> {/* spacer */}
              {block('early_adopters')}
            </div>

            {/* Riga 3 — Cost + Revenue full width */}
            <div className="grid grid-cols-2 gap-2">
              {block('cost_structure')}
              {block('revenue_streams')}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}