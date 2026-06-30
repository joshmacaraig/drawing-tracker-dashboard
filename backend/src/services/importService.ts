import { PrismaClient, Drawing } from '@prisma/client'
import { parseCsv, ParsedDrawingRow } from './csvParser'
import { calculateRisk } from './riskCalculator'

const prisma = new PrismaClient()

export interface ImportResult {
  inserted: number
  updated: number
  unchanged: number
  errors: number
  errorLog: string[]
  totalParsed: number
}

function addDays(dateStr: string | null, days: number): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(d: Date | null): string | null {
  if (!d) return null
  return d.toISOString().substring(0, 10)
}

interface FieldChange {
  field: string
  old_value: string | null
  new_value: string | null
}

function getChanges(existing: Drawing, incoming: ParsedDrawingRow): FieldChange[] {
  const changes: FieldChange[] = []
  const fields: Array<{ name: string; old: string | null; new: string | null }> = [
    { name: 'title', old: existing.title, new: incoming.title },
    { name: 'group', old: existing.group, new: incoming.group },
    { name: 'revision', old: existing.revision, new: incoming.revision },
    { name: 'status', old: existing.status, new: incoming.status },
    { name: 'upload_date', old: toDateStr(existing.upload_date), new: incoming.upload_date },
  ]
  for (const f of fields) {
    if (f.old !== f.new) {
      changes.push({ field: f.name, old_value: f.old, new_value: f.new })
    }
  }
  return changes
}

export async function importDrawings(csvContent: string, fileName: string): Promise<ImportResult> {
  const { rows, errors: parseErrors } = parseCsv(csvContent)
  const errorLog: string[] = [...parseErrors]

  let inserted = 0
  let updated = 0
  let unchanged = 0
  let errors = parseErrors.length

  for (const row of rows) {
    try {
      const uploadDate = row.upload_date ? new Date(row.upload_date) : null
      const dropDeadDate = addDays(row.upload_date, 7)
      const risk = calculateRisk({
        status: row.status,
        drop_dead_date: dropDeadDate,
        title: row.title,
        drawing_id: row.drawing_id!,
      })

      const existing = await prisma.drawing.findUnique({
        where: { drawing_id: row.drawing_id! },
      })

      if (!existing) {
        await prisma.drawing.create({
          data: {
            drawing_id: row.drawing_id!,
            title: row.title,
            group: row.group,
            revision: row.revision,
            status: row.status,
            upload_date: uploadDate,
            drop_dead_date: dropDeadDate,
            risk,
          },
        })
        await prisma.drawingHistory.create({
          data: {
            drawing_id: row.drawing_id!,
            field: 'created',
            old_value: null,
            new_value: row.drawing_id,
            source: 'import',
            import_file: fileName,
          },
        })
        inserted++
      } else {
        const changes = getChanges(existing, row)
        if (changes.length === 0) {
          unchanged++
        } else {
          await prisma.drawing.update({
            where: { drawing_id: row.drawing_id! },
            data: {
              title: row.title,
              group: row.group,
              revision: row.revision,
              status: row.status,
              upload_date: uploadDate,
              drop_dead_date: dropDeadDate,
              risk,
            },
          })
          await prisma.drawingHistory.createMany({
            data: changes.map(c => ({
              drawing_id: row.drawing_id!,
              field: c.field,
              old_value: c.old_value,
              new_value: c.new_value,
              source: 'import',
              import_file: fileName,
            })),
          })
          updated++
        }
      }
    } catch (err) {
      errors++
      errorLog.push(`Error processing ${row.drawing_id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  await prisma.importHistory.create({
    data: {
      file_name: fileName,
      inserted,
      updated,
      unchanged,
      errors,
      error_log: errorLog.length > 0 ? errorLog.join('\n') : null,
    },
  })

  return { inserted, updated, unchanged, errors, errorLog, totalParsed: rows.length }
}
