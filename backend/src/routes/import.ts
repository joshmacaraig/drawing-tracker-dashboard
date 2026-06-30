import { Router, Request, Response } from 'express'
import multer from 'multer'
import { importDrawings } from '../services/importService'
import { PrismaClient } from '@prisma/client'
import { parseCsv, ParsedDrawingRow } from '../services/csvParser'

const router = Router()
const prisma = new PrismaClient()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'))
    }
  },
})

function toDateStr(d: Date | null): string | null {
  if (!d) return null
  return d.toISOString().substring(0, 10)
}

function getPreviewChanges(existing: {
  title: string | null
  group: string | null
  revision: string | null
  status: string | null
  upload_date: Date | null
}, incoming: ParsedDrawingRow) {
  const fields = [
    { field: 'title', label: 'Description', oldValue: existing.title, newValue: incoming.title },
    { field: 'group', label: 'Unit Group', oldValue: existing.group, newValue: incoming.group },
    { field: 'revision', label: 'Rev', oldValue: existing.revision, newValue: incoming.revision },
    { field: 'status', label: 'Review Status', oldValue: existing.status, newValue: incoming.status },
    { field: 'upload_date', label: 'Uploaded', oldValue: toDateStr(existing.upload_date), newValue: incoming.upload_date },
  ]

  return fields.filter(change => change.oldValue !== change.newValue)
}

router.post('/preview', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const csvContent = req.file.buffer.toString('utf-8')
    const parsed = parseCsv(csvContent)
    const ids = parsed.rows
      .map(row => row.drawing_id)
      .filter((id): id is string => Boolean(id))

    const existingDrawings = await prisma.drawing.findMany({
      where: { drawing_id: { in: ids } },
    })
    const existingById = new Map(existingDrawings.map(drawing => [drawing.drawing_id, drawing]))
    const seenInFile = new Set<string>()

    let inserted = 0
    let updated = 0
    let unchanged = 0
    let duplicate = 0

    const rows = parsed.rows.map((row, index) => {
      const rowNumber = parsed.headerRowIndex + index + 2
      const drawingId = row.drawing_id!

      if (seenInFile.has(drawingId)) {
        duplicate++
        return {
          ...row,
          rowNumber,
          action: 'duplicate',
          changes: [],
          warning: 'Duplicate drawing ID in this CSV. Later rows may overwrite earlier rows.',
        }
      }

      seenInFile.add(drawingId)
      const existing = existingById.get(drawingId)

      if (!existing) {
        inserted++
        return { ...row, rowNumber, action: 'insert', changes: [] }
      }

      const changes = getPreviewChanges(existing, row)
      if (changes.length === 0) {
        unchanged++
        return { ...row, rowNumber, action: 'unchanged', changes }
      }

      updated++
      return { ...row, rowNumber, action: 'update', changes }
    })

    return res.json({
      fileName: req.file.originalname,
      rows,
      summary: {
        inserted,
        updated,
        unchanged,
        duplicate,
        warnings: parsed.errors.length,
        totalParsed: parsed.rows.length,
      },
      errors: parsed.errors,
      headerRowIndex: parsed.headerRowIndex,
      totalRawRows: parsed.totalRawRows,
    })
  } catch (err) {
    console.error('Preview error:', err)
    return res.status(500).json({
      error: 'Preview failed',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const csvContent = req.file.buffer.toString('utf-8')
    const fileName = req.file.originalname

    const result = await importDrawings(csvContent, fileName)

    return res.json({
      success: true,
      fileName,
      ...result,
    })
  } catch (err) {
    console.error('Import error:', err)
    return res.status(500).json({
      error: 'Import failed',
      message: err instanceof Error ? err.message : String(err),
    })
  }
})

router.get('/history', async (_req: Request, res: Response) => {
  try {
    const history = await prisma.importHistory.findMany({
      orderBy: { imported_at: 'desc' },
    })
    return res.json(history)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch import history' })
  }
})

export default router
