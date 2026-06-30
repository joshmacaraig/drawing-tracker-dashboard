import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const drawings = await prisma.drawing.findMany()

    const total = drawings.length
    const approved = drawings.filter(d => {
      const s = d.status?.toLowerCase().trim() ?? ''
      return s === 'a' || s === 'status a' || s === 'approved' || s === 'final'
    }).length

    const underReview = drawings.filter(d => {
      const s = d.status?.toLowerCase().trim() ?? ''
      return s.includes('under review') || s.includes('review')
    }).length

    const late = drawings.filter(d => d.risk === 'Late').length
    const atRisk = drawings.filter(d => d.risk === 'At Risk').length
    const missingInfo = drawings.filter(d => d.risk === 'Missing Info').length
    const needsAttention = late + atRisk + missingInfo

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    for (const d of drawings) {
      const key = d.status ?? 'Unknown'
      statusBreakdown[key] = (statusBreakdown[key] ?? 0) + 1
    }

    // Group breakdown
    const groupBreakdown: Record<string, number> = {}
    for (const d of drawings) {
      const key = d.group ?? 'Unknown'
      groupBreakdown[key] = (groupBreakdown[key] ?? 0) + 1
    }

    // Recent changes (last 10 updated)
    const recentChanges = await prisma.drawing.findMany({
      orderBy: { updated_at: 'desc' },
      take: 10,
    })

    return res.json({
      total,
      approved,
      underReview,
      needsAttention,
      late,
      atRisk,
      missingInfo,
      statusBreakdown,
      groupBreakdown,
      recentChanges,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

export default router
