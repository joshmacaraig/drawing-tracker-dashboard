'use client'

import { useEffect, useState } from 'react'
import { fetchDashboardStats, fetchDrawings } from '@/lib/api'
import { DashboardStats, Drawing, RiskLevel } from '@/types'
import RiskBadge from '@/components/RiskBadge'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
import { useModal } from '@/context/ModalContext'

function StatCard({ label, value, sublabel, color }: {
  label: string
  value: number
  sublabel?: string
  color?: string
}) {
  return (
    <div className="stat-card">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-gray-900'}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  )
}

function AlertIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  )
}

function NeedsAttentionTooltip() {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="How Needs Attention is calculated"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-red-50 ring-1 ring-white/25 transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
      >
        <InfoIcon />
      </button>
      <span className="pointer-events-none absolute left-1/2 top-7 z-20 hidden w-72 -translate-x-1/2 rounded-lg bg-gray-950 px-3 py-2 text-left text-xs font-normal leading-relaxed text-white shadow-xl group-hover:block group-focus-within:block">
        Needs Attention = Late + At Risk + Missing Info. Late means past drop dead date. At Risk means due within 3 days. Missing Info means no status or no title.
      </span>
    </span>
  )
}

function AttentionMetric({ label, value, description, tone, icon, onClick }: {
  label: string
  value: number
  description: string
  tone: 'red' | 'amber' | 'gray'
  icon: React.ReactNode
  onClick: () => void
}) {
  const styles = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles[tone]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none">{value}</p>
          <p className="mt-2 text-xs opacity-80">{description}</p>
        </div>
        <div className="rounded-full bg-white/70 p-2 shadow-sm">
          {icon}
        </div>
      </div>
    </button>
  )
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
}

function RiskItemsModal({ risk, drawings, loading, error, onClose }: {
  risk: RiskLevel | null
  drawings: Drawing[]
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  if (!risk) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Needs Attention</p>
            <h2 className="text-lg font-semibold text-gray-900">{risk} drawings</h2>
            <p className="text-sm text-gray-500">{loading ? 'Loading...' : `${drawings.length} item${drawings.length !== 1 ? 's' : ''} found`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading drawings...</div>
          ) : error ? (
            <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          ) : drawings.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">No drawings in this category.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-th">Drawing ID</th>
                  <th className="table-th">Title</th>
                  <th className="table-th">Group</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Uploaded</th>
                  <th className="table-th">Drop Dead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drawings.map(drawing => (
                  <tr key={drawing.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono text-xs font-semibold text-blue-700">{drawing.drawing_id}</td>
                    <td className="table-td max-w-[260px] truncate" title={drawing.title ?? ''}>{drawing.title ?? '-'}</td>
                    <td className="table-td text-gray-500">{drawing.group ?? '-'}</td>
                    <td className="table-td"><StatusBadge status={drawing.status} /></td>
                    <td className="table-td whitespace-nowrap text-gray-500">{formatDate(drawing.upload_date)}</td>
                    <td className="table-td whitespace-nowrap font-medium text-gray-700">{formatDate(drawing.drop_dead_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <Link href={`/drawings?risk=${encodeURIComponent(risk)}`} className="btn-primary">Open full table</Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | null>(null)
  const [riskDrawings, setRiskDrawings] = useState<Drawing[]>([])
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskError, setRiskError] = useState<string | null>(null)
  const { openImport } = useModal()

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">Failed to load dashboard</p>
        <p className="text-red-500 text-sm mt-1">{error}</p>
        <p className="text-gray-500 text-sm mt-3">Make sure the backend is running on port 3001.</p>
        <button onClick={openImport} className="btn-primary mt-4">Import a CSV to get started</button>
      </div>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-700">No drawings yet</h2>
        <p className="text-gray-400 text-sm mt-1">Import a CSV file to start tracking drawings.</p>
        <button onClick={openImport} className="btn-primary mt-4">Import CSV</button>
      </div>
    )
  }

  const statusEntries = Object.entries(stats.statusBreakdown).sort((a, b) => b[1] - a[1])
  const groupEntries = Object.entries(stats.groupBreakdown).sort((a, b) => b[1] - a[1])
  const onTrack = Math.max(stats.total - stats.needsAttention, 0)

  function openRiskModal(risk: RiskLevel) {
    setSelectedRisk(risk)
    setRiskDrawings([])
    setRiskError(null)
    setRiskLoading(true)
    fetchDrawings({ risk, sort: 'drop_dead_date', order: 'asc' })
      .then(setRiskDrawings)
      .catch(err => setRiskError(err instanceof Error ? err.message : 'Failed to load drawings'))
      .finally(() => setRiskLoading(false))
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Construction drawing status overview</p>
        </div>
        <button onClick={openImport} className="btn-primary">Import CSV</button>
      </div>

      <section className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-red-600 text-white px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/15 p-2">
                <AlertIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-100">Needs Attention</p>
                  <NeedsAttentionTooltip />
                </div>
                <h2 className="text-2xl font-bold">{stats.needsAttention} drawing{stats.needsAttention !== 1 ? 's' : ''}</h2>
              </div>
            </div>
            <Link href="/drawings?risk=Late" className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors">
              Review drawings
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
          <AttentionMetric label="Late" value={stats.late} description="Past drop dead date" tone="red" icon={<ClockIcon />} onClick={() => openRiskModal('Late')} />
          <AttentionMetric label="At Risk" value={stats.atRisk} description="Due within 3 days" tone="amber" icon={<AlertIcon />} onClick={() => openRiskModal('At Risk')} />
          <AttentionMetric label="Missing Info" value={stats.missingInfo} description="Missing status or title" tone="gray" icon={<InfoIcon />} onClick={() => openRiskModal('Missing Info')} />
        </div>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="On Track" value={onTrack} color="text-blue-600" />
        <StatCard label="Approved" value={stats.approved} color="text-green-600" />
        <StatCard label="Under Review" value={stats.underReview} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Status Breakdown</h2>
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-28 shrink-0">
                  <StatusBadge status={status === 'Unknown' ? null : status} />
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.round((count / stats.total) * 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Group Breakdown</h2>
          <div className="space-y-3">
            {groupEntries.map(([group, count]) => (
              <div key={group} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-gray-600 truncate" title={group}>{group}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${Math.round((count / stats.total) * 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Changes</h2>
          <Link href="/drawings" className="text-blue-600 text-sm hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Drawing ID</th>
                <th className="table-th">Title</th>
                <th className="table-th">Group</th>
                <th className="table-th">Status</th>
                <th className="table-th">Risk</th>
                <th className="table-th">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentChanges.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-mono text-xs text-blue-700">{d.drawing_id}</td>
                  <td className="table-td max-w-[200px] truncate" title={d.title ?? ''}>{d.title ?? '-'}</td>
                  <td className="table-td text-gray-500">{d.group ?? '-'}</td>
                  <td className="table-td"><StatusBadge status={d.status} /></td>
                  <td className="table-td"><RiskBadge risk={d.risk} /></td>
                  <td className="table-td text-gray-400">{formatDate(d.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <RiskItemsModal risk={selectedRisk} drawings={riskDrawings} loading={riskLoading} error={riskError} onClose={() => setSelectedRisk(null)} />
    </>
  )
}
