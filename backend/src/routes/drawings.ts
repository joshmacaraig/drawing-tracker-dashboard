import { Router, Request, Response } from 'express'
import { PrismaClient, Prisma } from '@prisma/client'
import { calculateRisk } from '../services/riskCalculator'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status, group, risk, sort, order } = req.query as Record<string, string>
    const where: Prisma.DrawingWhereInput = {}

    if (search) {
      where.OR = [
        { drawing_id: { contains: search } },
        { title: { contains: search } },
        { group: { contains: search } },
      ]
    }
    if (status && status !== 'all') where.status = status
    if (group && group !== 'all') where.group = group
    if (risk && risk !== 'all') where.risk = risk

    const allowedSorts = ['drawing_id', 'title', 'group', 'status', 'risk', 'upload_date', 'drop_dead_date', 'updated_at']
    const sortField = allowedSorts.includes(sort) ? sort : 'updated_at'
    const sortOrder = order === 'asc' ? 'asc' : 'desc'

    const drawings = await prisma.drawing.findMany({ where, orderBy: { [sortField]: sortOrder } })
    return res.json(drawings)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch drawings' })
  }
})

router.get('/filters', async (_req: Request, res: Response) => {
  try {
    const statuses = await prisma.drawing.findMany({ select: { status: true }, distinct: ['status'], orderBy: { status: 'asc' } })
    const groups = await prisma.drawing.findMany({ select: { group: true }, distinct: ['group'], orderBy: { group: 'asc' } })
    return res.json({
      statuses: statuses.map(d => d.status).filter(Boolean),
      groups: groups.map(d => d.group).filter(Boolean),
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch filter options' })
  }
})

router.delete('/reset', async (_req: Request, res: Response) => {
  try {
    const [drawingHistory, importHistory, drawings] = await prisma.$transaction([
      prisma.drawingHistory.deleteMany(),
      prisma.importHistory.deleteMany(),
      prisma.drawing.deleteMany(),
    ])

    return res.json({
      success: true,
      deleted: {
        drawings: drawings.count,
        drawingHistory: drawingHistory.count,
        importHistory: importHistory.count,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset drawing data' })
  }
})

router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const history = await prisma.drawingHistory.findMany({
      where: { drawing_id: req.params.id },
      orderBy: { changed_at: 'desc' },
    })
    return res.json(history)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch drawing history' })
  }
})

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status: string | null }
    const drawingId = req.params.id

    const existing = await prisma.drawing.findUnique({ where: { drawing_id: drawingId } })
    if (!existing) return res.status(404).json({ error: 'Drawing not found' })

    const risk = calculateRisk({
      status,
      drop_dead_date: existing.drop_dead_date,
      title: existing.title,
      drawing_id: drawingId,
    })

    const updated = await prisma.drawing.update({
      where: { drawing_id: drawingId },
      data: { status, risk },
    })

    if (existing.status !== status) {
      await prisma.drawingHistory.create({
        data: {
          drawing_id: drawingId,
          field: 'status',
          old_value: existing.status,
          new_value: status,
          source: 'manual',
        },
      })
    }

    return res.json(updated)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update status' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const drawing = await prisma.drawing.findUnique({ where: { drawing_id: req.params.id } })
    if (!drawing) return res.status(404).json({ error: 'Drawing not found' })
    return res.json(drawing)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch drawing' })
  }
})

export default router
