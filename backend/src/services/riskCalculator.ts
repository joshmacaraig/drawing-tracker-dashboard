export type RiskLevel = 'Late' | 'At Risk' | 'Missing Info' | 'On Track'

interface DrawingForRisk {
  status: string | null
  drop_dead_date: Date | null
  title: string | null
  drawing_id: string
}

const APPROVED_STATUSES = ['a', 'status a', 'approved', 'final']

function isApproved(status: string | null): boolean {
  if (!status) return false
  return APPROVED_STATUSES.includes(status.toLowerCase().trim())
}

export function calculateRisk(drawing: DrawingForRisk): RiskLevel {
  // Missing info if no status or no title
  if (!drawing.status || !drawing.title) {
    return 'Missing Info'
  }

  // Approved drawings have no risk
  if (isApproved(drawing.status)) {
    return 'On Track'
  }

  if (drawing.drop_dead_date) {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const ddd = new Date(drawing.drop_dead_date)
    ddd.setHours(0, 0, 0, 0)
    const daysUntil = Math.ceil((ddd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) return 'Late'
    if (daysUntil <= 3) return 'At Risk'
  }

  return 'On Track'
}
