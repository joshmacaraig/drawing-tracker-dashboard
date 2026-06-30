import Papa from 'papaparse'

export interface ParsedDrawingRow {
  drawing_id: string | null
  title: string | null
  group: string | null
  revision: string | null
  status: string | null
  upload_date: string | null
}

const EXPECTED_HEADER_FIELDS: Array<keyof ParsedDrawingRow> = [
  'drawing_id',
  'title',
  'group',
  'revision',
  'status',
  'upload_date',
]

// Column name aliases (case-insensitive, trimmed)
const COLUMN_MAP: Record<string, keyof ParsedDrawingRow> = {
  'doc ref': 'drawing_id',
  'doc_ref': 'drawing_id',
  'docref': 'drawing_id',
  'drawing id': 'drawing_id',
  'drawing_id': 'drawing_id',
  'id': 'drawing_id',
  'description': 'title',
  'title': 'title',
  'name': 'title',
  'unit group': 'group',
  'unit_group': 'group',
  'group': 'group',
  'discipline': 'group',
  'rev': 'revision',
  'revision': 'revision',
  'review status': 'status',
  'review_status': 'status',
  'status': 'status',
  'uploaded': 'upload_date',
  'upload date': 'upload_date',
  'upload_date': 'upload_date',
  'date': 'upload_date',
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/^\uFEFF/, '').trim().replace(/\s+/g, ' ')
}

function cleanValue(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const str = String(val).trim()
  if (str === '' || str === '---' || str === '-' || str === 'N/A' || str === 'n/a' || str === 'TBD') return null
  return str
}

type SlashDateOrder = 'DMY' | 'MDY'

function inferSlashDateOrder(rows: string[][]): SlashDateOrder {
  for (const row of rows) {
    for (const cell of row) {
      const cleaned = cleanValue(cell)
      if (!cleaned) continue

      const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+\d{1,2}:\d{2})?$/)
      if (!match) continue

      const first = Number(match[1])
      const second = Number(match[2])

      if (first > 12 && second <= 12) return 'DMY'
      if (second > 12 && first <= 12) return 'MDY'
    }
  }

  return 'DMY'
}

function parseDate(val: string | null, slashDateOrder: SlashDateOrder): string | null {
  if (!val) return null

  // Try YYYY-MM-DD
  const iso = val.match(/^\d{4}-\d{2}-\d{2}/)
  if (iso) return val.substring(0, 10)

  // Try slash dates. Infer DMY vs MDY from the whole file.
  const slashDate = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+\d{1,2}:\d{2})?$/)
  if (slashDate) {
    const [, first, second, y] = slashDate
    const d = slashDateOrder === 'DMY' ? first : second
    const m = slashDateOrder === 'DMY' ? second : first
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  // Fallback: try native Date parse
  const d = new Date(val)
  if (!isNaN(d.getTime())) {
    return d.toISOString().substring(0, 10)
  }
  return null
}

function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const foundFields = new Set<keyof ParsedDrawingRow>()

    for (const cell of row) {
      const field = COLUMN_MAP[normalizeHeader(cell)]
      if (field) foundFields.add(field)
    }

    if (EXPECTED_HEADER_FIELDS.every(field => foundFields.has(field))) return i
  }
  return -1
}

export interface CsvParseResult {
  rows: ParsedDrawingRow[]
  errors: string[]
  headerRowIndex: number
  totalRawRows: number
}

export function parseCsv(csvContent: string): CsvParseResult {
  const errors: string[] = []

  // First pass: get all rows as arrays
  const rawResult = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: false,
  })

  const allRows = rawResult.data as string[][]
  const totalRawRows = allRows.length
  const slashDateOrder = inferSlashDateOrder(allRows)

  // Find the header row
  const headerRowIndex = findHeaderRowIndex(allRows)
  if (headerRowIndex === -1) {
    return { rows: [], errors: ['Could not find header row. Expected columns: Doc Ref, Description, Unit Group, Rev, Review Status, Uploaded.'], headerRowIndex: -1, totalRawRows }
  }

  // Build column index map
  const headerRow = allRows[headerRowIndex]
  const colIndexToField: Record<number, keyof ParsedDrawingRow> = {}

  headerRow.forEach((cell, idx) => {
    const norm = normalizeHeader(cell)
    if (COLUMN_MAP[norm]) {
      colIndexToField[idx] = COLUMN_MAP[norm]
    }
  })

  // Parse data rows
  const dataRows = allRows.slice(headerRowIndex + 1)
  const parsed: ParsedDrawingRow[] = []

  dataRows.forEach((row, rowNum) => {
    // Skip completely empty rows
    if (row.every(cell => !cell || cell.trim() === '')) return

    const entry: ParsedDrawingRow = {
      drawing_id: null,
      title: null,
      group: null,
      revision: null,
      status: null,
      upload_date: null,
    }

    row.forEach((cell, idx) => {
      const field = colIndexToField[idx]
      if (field) {
        const cleaned = cleanValue(cell)
        entry[field] = field === 'upload_date' ? parseDate(cleaned, slashDateOrder) : cleaned
      }
    })

    if (!entry.drawing_id) {
      errors.push(`Row ${headerRowIndex + rowNum + 2}: missing drawing_id (Doc Ref), skipped`)
      return
    }

    parsed.push(entry)
  })

  return { rows: parsed, errors, headerRowIndex, totalRawRows }
}
