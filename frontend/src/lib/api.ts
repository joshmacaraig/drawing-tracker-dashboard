import { Drawing, DashboardStats, ImportHistory, ImportResult, DrawingHistory, ImportPreviewResult } from '@/types'

const API_BASE = '/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? err.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return fetchJson(`${API_BASE}/dashboard/stats`)
}

export async function fetchDrawings(params?: {
  search?: string
  status?: string
  group?: string
  risk?: string
  sort?: string
  order?: string
}): Promise<Drawing[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  if (params?.group) query.set('group', params.group)
  if (params?.risk) query.set('risk', params.risk)
  if (params?.sort) query.set('sort', params.sort)
  if (params?.order) query.set('order', params.order)
  const qs = query.toString()
  return fetchJson(`${API_BASE}/drawings${qs ? `?${qs}` : ''}`)
}

export async function fetchFilterOptions(): Promise<{ statuses: string[]; groups: string[] }> {
  return fetchJson(`${API_BASE}/drawings/filters`)
}

export async function fetchDrawingHistory(drawingId: string): Promise<DrawingHistory[]> {
  return fetchJson(`${API_BASE}/drawings/${encodeURIComponent(drawingId)}/history`)
}

export async function updateDrawingStatus(drawingId: string, status: string | null): Promise<Drawing> {
  return fetchJson(`${API_BASE}/drawings/${encodeURIComponent(drawingId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export async function fetchImportHistory(): Promise<ImportHistory[]> {
  return fetchJson(`${API_BASE}/import/history`)
}

export async function importCsv(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  return fetchJson(`${API_BASE}/import`, { method: 'POST', body: formData })
}

export async function previewImportCsv(file: File): Promise<ImportPreviewResult> {
  const formData = new FormData()
  formData.append('file', file)
  return fetchJson(`${API_BASE}/import/preview`, { method: 'POST', body: formData })
}

export async function resetDrawingData(): Promise<{
  success: boolean
  deleted: {
    drawings: number
    drawingHistory: number
    importHistory: number
  }
}> {
  return fetchJson(`${API_BASE}/drawings/reset`, { method: 'DELETE' })
}
