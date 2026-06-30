'use client'

import { useEffect, useState, useCallback, DragEvent } from 'react'
import { fetchDrawings, updateDrawingStatus } from '@/lib/api'
import { Drawing, KANBAN_COLUMNS, getKanbanColumn } from '@/types'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import DrawingDetailModal from '@/components/DrawingDetailModal'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

interface KanbanCardProps {
  drawing: Drawing
  isDragging: boolean
  onDragStart: (e: DragEvent, drawing: Drawing) => void
  onDragEnd: () => void
  onClick: () => void
}

function KanbanCard({ drawing, isDragging, onDragStart, onDragEnd, onClick }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, drawing)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2 cursor-pointer select-none transition-all ${
        isDragging ? 'opacity-40 scale-95 shadow-none' : 'hover:shadow-md hover:border-blue-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-blue-700 font-semibold">{drawing.drawing_id}</span>
        <RiskBadge risk={drawing.risk} />
      </div>
      {drawing.title && (
        <p className="text-xs text-gray-700 font-medium leading-tight line-clamp-2" title={drawing.title}>
          {drawing.title}
        </p>
      )}
      <div className="flex flex-wrap gap-1 text-xs text-gray-500">
        {drawing.group && (
          <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{drawing.group}</span>
        )}
        {drawing.revision && (
          <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-600">Rev {drawing.revision}</span>
        )}
      </div>
      <div className="border-t border-gray-100 pt-2">
        <StatusBadge status={drawing.status} />
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div>
          <span className="text-gray-400">Uploaded: </span>
          <span className="text-gray-600">{formatDate(drawing.upload_date)}</span>
        </div>
        <div>
          <span className="text-gray-400">DDD: </span>
          <span className={`font-medium ${
            drawing.risk === 'Late' ? 'text-red-600' :
            drawing.risk === 'At Risk' ? 'text-orange-600' :
            'text-gray-600'
          }`}>
            {formatDate(drawing.drop_dead_date)}
          </span>
        </div>
      </div>

      {/* Drag handle hint */}
      <div className="flex justify-center pt-0.5 opacity-20">
        <svg className="w-4 h-3 text-gray-400" fill="currentColor" viewBox="0 0 16 10">
          <rect y="0" width="16" height="2" rx="1" />
          <rect y="4" width="16" height="2" rx="1" />
          <rect y="8" width="16" height="2" rx="1" />
        </svg>
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchDrawings()
      setDrawings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function onDragStart(e: DragEvent, drawing: Drawing) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('drawing_id', drawing.drawing_id)
    setDraggingId(drawing.drawing_id)
  }

  function onDragEnd() {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  async function onDrop(e: DragEvent, columnId: string) {
    e.preventDefault()
    const drawingId = e.dataTransfer.getData('drawing_id')
    setDraggingId(null)
    setDragOverColumn(null)

    const column = KANBAN_COLUMNS.find(c => c.id === columnId)
    if (!column) return

    const drawing = drawings.find(d => d.drawing_id === drawingId)
    if (!drawing) return

    const currentCol = getKanbanColumn(drawing.status)
    if (currentCol === columnId) return

    const newStatus = column.status

    // Optimistic update
    setDrawings(prev => prev.map(d =>
      d.drawing_id === drawingId ? { ...d, status: newStatus } : d
    ))

    try {
      const updated = await updateDrawingStatus(drawingId, newStatus)
      // Apply server response (includes recalculated risk)
      setDrawings(prev => prev.map(d => d.drawing_id === drawingId ? updated : d))
    } catch {
      // Revert
      setDrawings(prev => prev.map(d => d.drawing_id === drawingId ? drawing : d))
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading Kanban board...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-700">{error}</div>
  }

  const columnsWithDrawings = KANBAN_COLUMNS.map(col => ({
    ...col,
    drawings: drawings.filter(d => getKanbanColumn(d.status) === col.id),
  }))

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {drawings.length} drawing{drawings.length !== 1 ? 's' : ''} · drag cards to change status · click to view details
          </p>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {columnsWithDrawings.map(col => (
              <div
                key={col.id}
                onDragOver={e => { e.preventDefault(); setDragOverColumn(col.id) }}
                onDragLeave={e => {
                  // Only clear if leaving the column entirely (not entering a child)
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumn(null)
                  }
                }}
                onDrop={e => onDrop(e, col.id)}
                className={`flex flex-col w-64 rounded-xl border-2 transition-all ${col.color} min-h-[200px] ${
                  dragOverColumn === col.id && draggingId
                    ? 'ring-2 ring-blue-400 ring-offset-1 scale-[1.01]'
                    : ''
                }`}
              >
                {/* Column header */}
                <div className="px-3 py-2.5 border-b border-current border-opacity-20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{col.label}</h3>
                    <span className="bg-white text-gray-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-gray-200">
                      {col.drawings.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className={`flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] transition-colors ${
                  dragOverColumn === col.id && draggingId ? 'bg-white/50' : ''
                }`}>
                  {col.drawings.length === 0 ? (
                    <div className={`text-xs text-center py-6 italic transition-colors ${
                      dragOverColumn === col.id && draggingId
                        ? 'text-blue-400 border-2 border-dashed border-blue-300 rounded-lg py-8'
                        : 'text-gray-400'
                    }`}>
                      {dragOverColumn === col.id && draggingId ? 'Drop here' : 'No drawings'}
                    </div>
                  ) : (
                    col.drawings.map(d => (
                      <KanbanCard
                        key={d.id}
                        drawing={d}
                        isDragging={draggingId === d.drawing_id}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedDrawing(d)}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DrawingDetailModal
        drawing={selectedDrawing}
        onClose={() => setSelectedDrawing(null)}
      />
    </>
  )
}
