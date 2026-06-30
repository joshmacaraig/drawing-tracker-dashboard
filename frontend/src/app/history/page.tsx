'use client'

import { useEffect, useState } from 'react'
import { fetchImportHistory, resetDrawingData } from '@/lib/api'
import { ImportHistory } from '@/types'
import { useModal } from '@/context/ModalContext'

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [resetting, setResetting] = useState(false)
  const { openImport } = useModal()

  useEffect(() => {
    fetchImportHistory()
      .then(setHistory)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading import history...</div>
  }

  async function handleReset() {
    const confirmed = window.confirm('Clear all imported drawings, drawing change history, and import history?')
    if (!confirmed) return

    setResetting(true)
    setError(null)
    try {
      await resetDrawingData()
      setHistory([])
      setExpanded(null)
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset data')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import History</h1>
          <p className="text-gray-500 text-sm mt-0.5">{history.length} import{history.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button onClick={openImport} className="btn-primary flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9" />
          </svg>
          New Import
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {history.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">No imports yet.</p>
          <button onClick={openImport} className="btn-primary mt-4">Import your first CSV</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="table-th">#</th>
                <th className="table-th">File Name</th>
                <th className="table-th">Imported At</th>
                <th className="table-th text-green-700">Inserted</th>
                <th className="table-th text-blue-700">Updated</th>
                <th className="table-th text-gray-600">Unchanged</th>
                <th className="table-th text-red-700">Errors</th>
                <th className="table-th">Total</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h, i) => (
                <>
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td text-gray-400 text-xs">{history.length - i}</td>
                    <td className="table-td font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {h.file_name}
                      </div>
                    </td>
                    <td className="table-td text-gray-500 whitespace-nowrap">{formatDateTime(h.imported_at)}</td>
                    <td className="table-td"><span className="font-semibold text-green-600">{h.inserted}</span></td>
                    <td className="table-td"><span className="font-semibold text-blue-600">{h.updated}</span></td>
                    <td className="table-td"><span className="font-semibold text-gray-500">{h.unchanged}</span></td>
                    <td className="table-td">
                      <span className={`font-semibold ${h.errors > 0 ? 'text-red-600' : 'text-gray-300'}`}>{h.errors}</span>
                    </td>
                    <td className="table-td text-gray-600 font-medium">{h.inserted + h.updated + h.unchanged}</td>
                    <td className="table-td">
                      {h.error_log && (
                        <button onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline">
                          {expanded === h.id ? 'Hide' : 'Show'} log
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === h.id && h.error_log && (
                    <tr key={`${h.id}-log`}>
                      <td colSpan={9} className="px-4 py-3 bg-red-50">
                        <pre className="text-xs text-red-700 font-mono whitespace-pre-wrap">{h.error_log}</pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-[11px] text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Clear imported demo data"
        >
          {resetting ? 'clearing...' : 'reset data'}
        </button>
      </div>
    </div>
  )
}
