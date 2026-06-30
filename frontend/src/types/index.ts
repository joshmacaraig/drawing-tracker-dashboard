export interface Drawing {
  id: number
  drawing_id: string
  title: string | null
  group: string | null
  revision: string | null
  status: string | null
  upload_date: string | null
  drop_dead_date: string | null
  risk: string | null
  created_at: string
  updated_at: string
}

export interface DrawingHistory {
  id: number
  drawing_id: string
  field: string
  old_value: string | null
  new_value: string | null
  source: 'import' | 'manual'
  import_file: string | null
  changed_at: string
}

export interface ImportHistory {
  id: number
  file_name: string
  imported_at: string
  inserted: number
  updated: number
  unchanged: number
  errors: number
  error_log: string | null
}

export interface DashboardStats {
  total: number
  approved: number
  underReview: number
  needsAttention: number
  late: number
  atRisk: number
  missingInfo: number
  statusBreakdown: Record<string, number>
  groupBreakdown: Record<string, number>
  recentChanges: Drawing[]
}

export interface ImportResult {
  success: boolean
  fileName: string
  inserted: number
  updated: number
  unchanged: number
  errors: number
  errorLog: string[]
  totalParsed: number
}

export type ImportPreviewAction = 'insert' | 'update' | 'unchanged' | 'duplicate'

export interface ImportPreviewChange {
  field: string
  label: string
  oldValue: string | null
  newValue: string | null
}

export interface ImportPreviewRow {
  rowNumber: number
  action: ImportPreviewAction
  warning?: string
  drawing_id: string | null
  title: string | null
  group: string | null
  revision: string | null
  status: string | null
  upload_date: string | null
  changes: ImportPreviewChange[]
}

export interface ImportPreviewResult {
  fileName: string
  rows: ImportPreviewRow[]
  summary: {
    inserted: number
    updated: number
    unchanged: number
    duplicate: number
    warnings: number
    totalParsed: number
  }
  errors: string[]
  headerRowIndex: number
  totalRawRows: number
}

export type RiskLevel = 'Late' | 'At Risk' | 'Missing Info' | 'On Track'

export const KANBAN_COLUMNS = [
  { id: 'missing-info', label: 'Missing Info', color: 'bg-gray-100 border-gray-300', status: null },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-50 border-blue-300', status: 'In Progress' },
  { id: 'awaiting-design-review', label: 'Awaiting Design Review', color: 'bg-yellow-50 border-yellow-300', status: 'Awaiting Design Review' },
  { id: 'under-review', label: 'Under Review', color: 'bg-orange-50 border-orange-300', status: 'Under Review' },
  { id: 'status-c', label: 'Status C', color: 'bg-purple-50 border-purple-300', status: 'C' },
  { id: 'status-b', label: 'Status B', color: 'bg-indigo-50 border-indigo-300', status: 'B' },
  { id: 'status-a', label: 'Status A', color: 'bg-green-50 border-green-300', status: 'A' },
] as const

export function getKanbanColumn(status: string | null): string {
  if (!status) return 'missing-info'
  const s = status.toLowerCase().trim()
  if (s === 'a' || s === 'status a' || s === 'approved' || s === 'final') return 'status-a'
  if (s === 'b' || s === 'status b' || s === 'issued for review' || s === 'ifr') return 'status-b'
  if (s === 'c' || s === 'status c' || s === 'issued for construction' || s === 'ifc') return 'status-c'
  if (s.includes('under review')) return 'under-review'
  if (s.includes('awaiting design review') || s.includes('adr')) return 'awaiting-design-review'
  if (s.includes('in progress') || s.includes('wip')) return 'in-progress'
  return 'missing-info'
}
