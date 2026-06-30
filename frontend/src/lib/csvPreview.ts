export interface CsvPreviewRow {
  drawing_id: string | null
  title: string | null
  group: string | null
  revision: string | null
  status: string | null
  upload_date: string | null
}

export interface CsvPreviewResult {
  rows: CsvPreviewRow[]
  errors: string[]
  headerRowIndex: number
  totalRawRows: number
}

const EXPECTED_HEADER_FIELDS: Array<keyof CsvPreviewRow> = [
  'drawing_id',
  'title',
  'group',
  'revision',
  'status',
  'upload_date',
]

const COLUMN_MAP: Record<string, keyof CsvPreviewRow> = {
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

function parseCsvRows(csvContent: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i]
    const next = csvContent[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(cell)
      cell = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    cell += char
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/^\uFEFF/, '').trim().replace(/\s+/g, ' ')
}

function cleanValue(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const str = String(value).trim()
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

function parseDate(value: string | null, slashDateOrder: SlashDateOrder): string | null {
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.substring(0, 10)

  const slashDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+\d{1,2}:\d{2})?$/)
  if (slashDate) {
    const [, first, second, year] = slashDate
    const day = slashDateOrder === 'DMY' ? first : second
    const month = slashDateOrder === 'DMY' ? second : first
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().substring(0, 10)

  return null
}

function findHeaderRowIndex(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const foundFields = new Set<keyof CsvPreviewRow>()

    for (const cell of rows[i]) {
      const field = COLUMN_MAP[normalizeHeader(cell)]
      if (field) foundFields.add(field)
    }

    if (EXPECTED_HEADER_FIELDS.every(field => foundFields.has(field))) return i
  }

  return -1
}

export function parseCsvPreview(csvContent: string): CsvPreviewResult {
  const allRows = parseCsvRows(csvContent)
  const totalRawRows = allRows.length
  const headerRowIndex = findHeaderRowIndex(allRows)
  const slashDateOrder = inferSlashDateOrder(allRows)

  if (headerRowIndex === -1) {
    return {
      rows: [],
      errors: ['Could not find header row. Expected columns: Doc Ref, Description, Unit Group, Rev, Review Status, Uploaded.'],
      headerRowIndex,
      totalRawRows,
    }
  }

  const colIndexToField: Record<number, keyof CsvPreviewRow> = {}
  allRows[headerRowIndex].forEach((cell, index) => {
    const field = COLUMN_MAP[normalizeHeader(cell)]
    if (field) colIndexToField[index] = field
  })

  const rows: CsvPreviewRow[] = []
  const errors: string[] = []

  allRows.slice(headerRowIndex + 1).forEach((row, rowIndex) => {
    if (row.every(cell => !cell || cell.trim() === '')) return

    const entry: CsvPreviewRow = {
      drawing_id: null,
      title: null,
      group: null,
      revision: null,
      status: null,
      upload_date: null,
    }

    row.forEach((cell, index) => {
      const field = colIndexToField[index]
      if (field) {
        const cleaned = cleanValue(cell)
        entry[field] = field === 'upload_date' ? parseDate(cleaned, slashDateOrder) : cleaned
      }
    })

    if (!entry.drawing_id) {
      errors.push(`Row ${headerRowIndex + rowIndex + 2}: missing drawing_id (Doc Ref), skipped`)
      return
    }

    rows.push(entry)
  })

  return { rows, errors, headerRowIndex, totalRawRows }
}
