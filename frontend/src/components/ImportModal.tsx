'use client'

import { useState, useRef, DragEvent, useEffect } from 'react'
import { importCsv, previewImportCsv } from '@/lib/api'
import { ImportPreviewAction, ImportPreviewResult, ImportResult } from '@/types'
import { useModal } from '@/context/ModalContext'

const ACTION_STYLES: Record<ImportPreviewAction, { label: string; badge: string; row: string }> = {
  insert: {
    label: 'New',
    badge: 'bg-green-100 text-green-700 border-green-200',
    row: 'bg-green-50/40',
  },
  update: {
    label: 'Update',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    row: 'bg-blue-50/40',
  },
  unchanged: {
    label: 'Unchanged',
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    row: '',
  },
  duplicate: {
    label: 'Duplicate',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    row: 'bg-amber-50/50',
  },
}

function ActionBadge({ action }: { action: ImportPreviewAction }) {
  const style = ACTION_STYLES[action]
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}>
      {style.label}
    </span>
  )
}

function ChangeList({ changes }: { changes: ImportPreviewResult['rows'][number]['changes'] }) {
  if (changes.length === 0) return <span className="text-gray-400">No field changes</span>

  return (
    <div className="space-y-1">
      {changes.slice(0, 3).map(change => (
        <div key={change.field} className="text-[11px] text-gray-600">
          <span className="font-medium text-gray-700">{change.label}:</span>{' '}
          <span className="text-red-600">{change.oldValue ?? 'null'}</span>
          <span className="text-gray-400"> -&gt; </span>
          <span className="text-green-700">{change.newValue ?? 'null'}</span>
        </div>
      ))}
      {changes.length > 3 && (
        <div className="text-[11px] text-gray-400">{changes.length - 3} more change{changes.length - 3 !== 1 ? 's' : ''}</div>
      )}
    </div>
  )
}

export default function ImportModal() {
  const { importOpen, closeImport } = useModal()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!importOpen) {
      setFile(null)
      setResult(null)
      setError(null)
      setPreview(null)
      setPreviewLoading(false)
      setDragging(false)
    }
  }, [importOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeImport() }
    if (importOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [importOpen, closeImport])

  if (!importOpen) return null

  async function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.')
      return
    }

    setFile(f)
    setResult(null)
    setError(null)
    setPreview(null)
    setPreviewLoading(true)

    try {
      const parsed = await previewImportCsv(f)
      setPreview(parsed)
      if (parsed.rows.length === 0) {
        setError(parsed.errors[0] ?? 'No importable rows were found in this CSV.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not preview this CSV.')
    } finally {
      setPreviewLoading(false)
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await importCsv(file)
      setResult(res)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    setPreview(null)
    setPreviewLoading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewRows = preview?.rows.slice(0, 10) ?? []
  const hiddenPreviewRows = preview ? Math.max(preview.rows.length - previewRows.length, 0) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeImport} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import CSV</h2>
            <p className="text-xs text-gray-500 mt-0.5">Preview detected rows before importing</p>
          </div>
          <button onClick={closeImport} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-blue-400 bg-blue-50' :
                  file ? 'border-green-400 bg-green-50' :
                  'border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${file ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {file ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-green-700">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB - click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Drop CSV here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-0.5">Detects header row automatically</p>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              {previewLoading && (
                <div className="border border-gray-200 rounded-lg p-4 text-sm text-gray-500">Comparing CSV against current drawings...</div>
              )}

              {preview && preview.rows.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Preview</p>
                      <p className="text-xs text-gray-500">
                        Header found on row {preview.headerRowIndex + 1}. {preview.rows.length} importable rows detected.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-1">
                        {preview.summary.inserted} new
                      </span>
                      <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-1">
                        {preview.summary.updated} update{preview.summary.updated !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-1">
                        {preview.summary.unchanged} unchanged
                      </span>
                      {(preview.summary.duplicate > 0 || preview.errors.length > 0) && (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
                          {preview.summary.duplicate + preview.errors.length} warning{preview.summary.duplicate + preview.errors.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-white border-b border-gray-100">
                    {[
                      { label: 'Will add', value: preview.summary.inserted, className: 'text-green-700 bg-green-50 border-green-100' },
                      { label: 'Will update', value: preview.summary.updated, className: 'text-blue-700 bg-blue-50 border-blue-100' },
                      { label: 'No change', value: preview.summary.unchanged, className: 'text-gray-600 bg-gray-50 border-gray-100' },
                      { label: 'Needs review', value: preview.summary.duplicate + preview.errors.length, className: 'text-amber-800 bg-amber-50 border-amber-100' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-lg border px-3 py-2 ${item.className}`}>
                        <p className="text-lg font-bold leading-none">{item.value}</p>
                        <p className="mt-1 text-[11px] font-medium uppercase">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-white text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Action</th>
                          <th className="px-3 py-2 text-left font-medium">Doc Ref</th>
                          <th className="px-3 py-2 text-left font-medium">Description</th>
                          <th className="px-3 py-2 text-left font-medium">Unit Group</th>
                          <th className="px-3 py-2 text-left font-medium">Rev</th>
                          <th className="px-3 py-2 text-left font-medium">Review Status</th>
                          <th className="px-3 py-2 text-left font-medium">Uploaded</th>
                          <th className="px-3 py-2 text-left font-medium">Detected Changes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {previewRows.map((row, index) => (
                          <tr key={`${row.drawing_id}-${index}`} className={`text-gray-700 ${ACTION_STYLES[row.action].row}`}>
                            <td className="px-3 py-2 whitespace-nowrap"><ActionBadge action={row.action} /></td>
                            <td className="px-3 py-2 whitespace-nowrap font-medium">{row.drawing_id}</td>
                            <td className="px-3 py-2 min-w-48">{row.title ?? <span className="text-gray-400">null</span>}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.group ?? <span className="text-gray-400">null</span>}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.revision ?? <span className="text-gray-400">null</span>}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.status ?? <span className="text-gray-400">null</span>}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{row.upload_date ?? <span className="text-gray-400">null</span>}</td>
                            <td className="px-3 py-2 min-w-52">
                              {row.warning ? <span className="text-amber-700">{row.warning}</span> : <ChangeList changes={row.changes} />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hiddenPreviewRows > 0 && (
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                      Showing first 10 rows. {hiddenPreviewRows} more row{hiddenPreviewRows !== 1 ? 's' : ''} will also be imported.
                    </div>
                  )}
                </div>
              )}

              {preview && preview.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Preview warnings</p>
                  {preview.errors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-amber-700 font-mono">{e}</p>
                  ))}
                  {preview.errors.length > 5 && (
                    <p className="text-xs text-amber-700 mt-1">{preview.errors.length - 5} more warning{preview.errors.length - 5 !== 1 ? 's' : ''}</p>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium mb-1">Expected columns</p>
                <p className="text-xs text-blue-600">Doc Ref, Description, Unit Group, Rev, Review Status, Uploaded</p>
                <p className="text-xs text-blue-500 mt-1">Values of <code className="bg-blue-100 px-1 rounded">---</code> are treated as null. Drop dead date = upload date + 7 days.</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleImport} disabled={!file || loading || previewLoading || (preview !== null && preview.rows.length === 0)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Importing...
                    </>
                  ) : preview ? `Import ${preview.rows.length} Row${preview.rows.length !== 1 ? 's' : ''}` : 'Import CSV'}
                </button>
                {file && <button onClick={reset} className="btn-secondary">Clear</button>}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Import complete</p>
                  <p className="text-sm text-gray-500">{result.fileName} - {result.totalParsed} rows processed</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Inserted', value: result.inserted, color: 'text-green-600' },
                  { label: 'Updated', value: result.updated, color: 'text-blue-600' },
                  { label: 'Unchanged', value: result.unchanged, color: 'text-gray-500' },
                  { label: 'Errors', value: result.errors, color: result.errors > 0 ? 'text-red-600' : 'text-gray-300' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {result.errorLog.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-700 mb-1">Warnings</p>
                  {result.errorLog.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 font-mono">{e}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={closeImport} className="btn-primary flex-1">Done</button>
                <button onClick={reset} className="btn-secondary">Import another</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
