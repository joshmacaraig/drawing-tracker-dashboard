'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchDrawings, fetchFilterOptions } from '@/lib/api'
import { Drawing } from '@/types'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import DrawingDetailModal from '@/components/DrawingDetailModal'

type SortField = 'drawing_id' | 'title' | 'group' | 'status' | 'risk' | 'upload_date' | 'drop_dead_date' | 'updated_at'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function SortIcon({ field, current, order }: { field: string; current: string; order: string }) {
  if (field !== current) return <span className="text-gray-300 ml-1">↕</span>
  return <span className="text-blue-500 ml-1">{order === 'asc' ? '↑' : '↓'}</span>
}

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterOptions, setFilterOptions] = useState<{ statuses: string[]; groups: string[] }>({ statuses: [], groups: [] })

  const loadDrawings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchDrawings({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        group: groupFilter !== 'all' ? groupFilter : undefined,
        risk: riskFilter !== 'all' ? riskFilter : undefined,
        sort: sortField,
        order: sortOrder,
      })
      setDrawings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drawings')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, groupFilter, riskFilter, sortField, sortOrder])

  useEffect(() => {
    fetchFilterOptions().then(setFilterOptions).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadDrawings, 200)
    return () => clearTimeout(timer)
  }, [loadDrawings])

  function handleSort(field: SortField) {
    if (field === sortField) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortOrder('asc') }
  }

  const thProps = (field: SortField) => ({
    className: 'table-th cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap',
    onClick: () => handleSort(field),
  })

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drawings</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Loading...' : `${drawings.length} drawing${drawings.length !== 1 ? 's' : ''} found`}
            {!loading && ' · click any row to view details and history'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search by ID, title, or group..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field flex-1 min-w-[200px]"
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field">
              <option value="all">All Statuses</option>
              {filterOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="input-field">
              <option value="all">All Groups</option>
              {filterOptions.groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="input-field">
              <option value="all">All Risk Levels</option>
              <option value="Late">Late</option>
              <option value="At Risk">At Risk</option>
              <option value="Missing Info">Missing Info</option>
              <option value="On Track">On Track</option>
            </select>
            {(search || statusFilter !== 'all' || groupFilter !== 'all' || riskFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setGroupFilter('all'); setRiskFilter('all') }}
                className="btn-secondary text-xs"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th {...thProps('drawing_id')}>Drawing ID <SortIcon field="drawing_id" current={sortField} order={sortOrder} /></th>
                  <th {...thProps('title')}>Title <SortIcon field="title" current={sortField} order={sortOrder} /></th>
                  <th {...thProps('group')}>Group <SortIcon field="group" current={sortField} order={sortOrder} /></th>
                  <th className="table-th">Rev</th>
                  <th {...thProps('status')}>Status <SortIcon field="status" current={sortField} order={sortOrder} /></th>
                  <th {...thProps('upload_date')}>Uploaded <SortIcon field="upload_date" current={sortField} order={sortOrder} /></th>
                  <th {...thProps('drop_dead_date')}>Drop Dead Date <SortIcon field="drop_dead_date" current={sortField} order={sortOrder} /></th>
                  <th {...thProps('risk')}>Risk <SortIcon field="risk" current={sortField} order={sortOrder} /></th>
                  <th {...thProps('updated_at')}>Last Updated <SortIcon field="updated_at" current={sortField} order={sortOrder} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                ) : drawings.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No drawings found</td></tr>
                ) : (
                  drawings.map(d => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDrawing(d)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="table-td font-mono text-xs text-blue-700 font-semibold">{d.drawing_id}</td>
                      <td className="table-td max-w-[200px]">
                        <span className="block truncate text-sm" title={d.title ?? ''}>{d.title ?? '—'}</span>
                      </td>
                      <td className="table-td text-gray-500">{d.group ?? '—'}</td>
                      <td className="table-td">
                        {d.revision ? (
                          <span className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded font-medium">{d.revision}</span>
                        ) : '—'}
                      </td>
                      <td className="table-td"><StatusBadge status={d.status} /></td>
                      <td className="table-td text-gray-500 whitespace-nowrap">{formatDate(d.upload_date)}</td>
                      <td className={`table-td whitespace-nowrap font-medium ${
                        d.risk === 'Late' ? 'text-red-600' : d.risk === 'At Risk' ? 'text-orange-600' : 'text-gray-500'
                      }`}>{formatDate(d.drop_dead_date)}</td>
                      <td className="table-td"><RiskBadge risk={d.risk} /></td>
                      <td className="table-td text-gray-400 whitespace-nowrap text-xs">{formatDate(d.updated_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
