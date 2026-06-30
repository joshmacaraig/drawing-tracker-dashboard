'use client'

import { useEffect, useState } from 'react'
import { Drawing, DrawingHistory } from '@/types'
import { fetchDrawingHistory } from '@/lib/api'
import RiskBadge from './RiskBadge'
import StatusBadge from './StatusBadge'

interface DrawingDetailModalProps {
  drawing: Drawing | null
  onClose: () => void
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FieldLabel({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="mt-0.5 text-sm text-gray-800">{value ?? <span className="text-gray-400">-</span>}</div>
    </div>
  )
}

function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    created: 'Drawing created',
    title: 'Title',
    group: 'Group',
    revision: 'Revision',
    status: 'Status',
    upload_date: 'Upload date',
    drop_dead_date: 'Drop dead date',
    risk: 'Risk',
  }
  return map[field] ?? field
}

function historyGroupKey(item: DrawingHistory): string {
  return [item.changed_at, item.source, item.import_file ?? ''].join('|')
}

function groupHistory(history: DrawingHistory[]): DrawingHistory[][] {
  const groups: DrawingHistory[][] = []
  const groupIndex = new Map<string, DrawingHistory[]>()

  for (const item of history) {
    const key = historyGroupKey(item)
    const existing = groupIndex.get(key)

    if (existing) {
      existing.push(item)
    } else {
      const next = [item]
      groupIndex.set(key, next)
      groups.push(next)
    }
  }

  return groups
}

function SourceIcon({ source }: { source: DrawingHistory['source'] }) {
  const isImport = source === 'import'

  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
      isImport ? 'bg-blue-200' : 'bg-gray-200'
    }`}>
      {isImport ? (
        <svg className="w-3 h-3 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" />
        </svg>
      ) : (
        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )}
    </div>
  )
}

function HistoryGroup({ group }: { group: DrawingHistory[] }) {
  const event = group[0]
  const isImport = event.source === 'import'
  const createdOnly = group.length === 1 && event.field === 'created'

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      isImport ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
    }`}>
      <SourceIcon source={event.source} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-700">
            {createdOnly ? 'Drawing created' : `${group.length} change${group.length !== 1 ? 's' : ''}`}
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            isImport ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
          }`}>
            {isImport ? `via import${event.import_file ? ` - ${event.import_file}` : ''}` : 'manual'}
          </span>
        </div>

        {!createdOnly && (
          <div className="mt-2 space-y-1.5">
            {group.map(item => (
              <div key={item.id} className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                <span className="font-medium text-gray-600">{formatFieldName(item.field)}</span>
                <span className="flex items-center gap-2 text-gray-500">
                  <span className="line-through text-gray-400">{item.old_value ?? 'null'}</span>
                  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-700">{item.new_value ?? 'null'}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">{formatDateTime(event.changed_at)}</p>
      </div>
    </div>
  )
}

export default function DrawingDetailModal({ drawing, onClose }: DrawingDetailModalProps) {
  const [history, setHistory] = useState<DrawingHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (!drawing) return
    setHistoryLoading(true)
    fetchDrawingHistory(drawing.drawing_id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [drawing?.drawing_id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!drawing) return null

  const historyGroups = groupHistory(history)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
              {drawing.drawing_id}
            </span>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{drawing.title ?? 'Untitled'}</p>
              <p className="text-xs text-gray-400">{drawing.group ?? 'No group'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <FieldLabel label="Status" value={<StatusBadge status={drawing.status} />} />
            <FieldLabel label="Risk" value={<RiskBadge risk={drawing.risk} size="md" />} />
            <FieldLabel label="Revision" value={drawing.revision ? (
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded font-medium">Rev {drawing.revision}</span>
            ) : null} />
            <FieldLabel label="Upload Date" value={formatDate(drawing.upload_date)} />
            <FieldLabel label="Drop Dead Date" value={
              <span className={drawing.risk === 'Late' ? 'text-red-600 font-medium' : drawing.risk === 'At Risk' ? 'text-orange-600 font-medium' : ''}>
                {formatDate(drawing.drop_dead_date)}
              </span>
            } />
            <FieldLabel label="Last Updated" value={formatDateTime(drawing.updated_at)} />
            <FieldLabel label="Created" value={formatDateTime(drawing.created_at)} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Change History</h3>

            {historyLoading ? (
              <div className="text-center py-6 text-gray-400 text-sm">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No history recorded yet</div>
            ) : (
              <div className="space-y-2">
                {historyGroups.map(group => (
                  <HistoryGroup key={historyGroupKey(group[0])} group={group} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
