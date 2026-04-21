import { useEffect, useRef } from 'react'
import { Draggable } from '@hello-pangea/dnd'

const STICKY_COLORS = {
  customer:            { bg: '#DBEAFE', text: '#1E3A5F' },
  problem:             { bg: '#FEE2E2', text: '#7F1D1D' },
  solution:            { bg: '#D1FAE5', text: '#064E3B' },
  riskiest_assumption: { bg: '#FEF3C7', text: '#78350F' },
  success_criterion:   { bg: '#EDE9FE', text: '#4C1D95' },
  result_decision:     { bg: '#CFFAFE', text: '#164E63' },
  learning:            { bg: '#FCE7F3', text: '#831843' },
}

export default function StickyCard({
  sticky, index, editingSticky, editingText,
  setEditingSticky, setEditingText,
  onSave, onDelete
}) {
  const editRef = useRef(null)
  const isEditing = editingSticky === sticky.id
  const colors = STICKY_COLORS[sticky.row_type] || { bg: '#F3F4F6', text: '#111827' }

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus()
      // Cursore alla fine del testo
      const len = editRef.current.value.length
      editRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  return (
    <Draggable draggableId={sticky.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative rounded-lg p-2 text-xs shadow-md cursor-grab
                      transition-all min-h-12 group w-28
                      ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105' : ''}`}
          style={{
            ...provided.draggableProps.style,
            backgroundColor: colors.bg,
            color: colors.text,
          }}
        >
          {isEditing ? (
            <textarea
              ref={editRef}
              value={editingText}
              onChange={e => setEditingText(e.target.value)}
              onBlur={() => onSave(sticky.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSave(sticky.id)
                }
                if (e.key === 'Escape') {
                  setEditingSticky(null)
                  if (!sticky.content) onDelete(sticky.id)
                }
              }}
              className="w-full bg-transparent resize-none focus:outline-none
                         text-xs leading-relaxed"
              rows={3}
              style={{ color: colors.text }}
            />
          ) : (
            <p
              className="leading-relaxed cursor-pointer whitespace-pre-wrap break-words"
              onClick={() => {
                setEditingSticky(sticky.id)
                setEditingText(sticky.content)
              }}
            >
              {sticky.content || <span className="opacity-40">...</span>}
            </p>
          )}

          {!isEditing && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(sticky.id) }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100
                         text-xs leading-none transition-opacity hover:scale-110"
              style={{ color: colors.text }}
            >✕</button>
          )}
        </div>
      )}
    </Draggable>
  )
}